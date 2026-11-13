import {gradeResponse, validateInteraction} from './activities.js';

/** Pure mission rules. Persistence, rewards and ability updates belong to progress.js. */
export const CONCEPT_ID = 'math.part-whole';
export const GAME_ID = 'fairy-baskets';
const KINDS = ['predict', 'hidden', 'transfer', 'represent', 'explain'];
const MAX_TOTAL = 10;
const HINT_LIMIT = 3;
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const fail = () => { throw new Error('두 바구니 놀이를 다시 열어 주세요.'); };

/** The two parts always contain exactly the same whole, including an empty part. */
export function createBaskets({total = 5, left = Math.floor(total / 2)} = {}) {
  if (!integer(total, 0, MAX_TOTAL) || !integer(left, 0, total)) fail();
  return {total, left, right: total - left};
}

function checkBaskets(baskets) {
  if (!baskets || !integer(baskets.total, 0, MAX_TOTAL) ||
      !integer(baskets.left, 0, baskets.total) ||
      !integer(baskets.right, 0, baskets.total) ||
      baskets.left + baskets.right !== baskets.total) fail();
}

export function moveCounter(baskets, from) {
  checkBaskets(baskets);
  if (from !== 'left' && from !== 'right') fail();
  if (baskets[from] === 0) return baskets;
  return createBaskets({total: baskets.total, left: baskets.left + (from === 'left' ? -1 : 1)});
}

function missionFor(question) {
  const mission = question?.mission;
  if (!question || typeof question.id !== 'string' ||
      question.canonicalConcept !== CONCEPT_ID || question.skill !== CONCEPT_ID ||
      !mission || !KINDS.includes(mission.kind) ||
      !['baskets', 'chairs', 'dots'].includes(mission.context) ||
      typeof mission.unit !== 'string' || !mission.unit ||
      typeof mission.emoji !== 'string' || !mission.emoji ||
      !Array.isArray(mission.hints) || mission.hints.length !== HINT_LIMIT ||
      mission.hints.some(hint => typeof hint !== 'string' || !hint.trim())) fail();
  if (!integer(mission.total, 0, MAX_TOTAL) || !integer(mission.left, 0, mission.total)) fail();
  const baskets = createBaskets(mission);
  validateInteraction(question);
  if (mission.kind === 'predict') {
    if (!['left', 'right'].includes(mission.moveFrom) || baskets[mission.moveFrom] < 1 ||
        mission.targetLeft !== moveCounter(baskets, mission.moveFrom).left) fail();
  }
  if (mission.kind === 'hidden' && mission.hiddenSide !== 'right') fail();
  if (['predict', 'hidden', 'transfer'].includes(mission.kind)) {
    const target = mission.kind === 'predict' ? mission.total - mission.targetLeft : baskets.right;
    if (question.interaction?.type !== 'build' || question.interaction.target !== target ||
        question.interaction.max !== mission.total) fail();
  } else if ((question.interaction?.type ?? 'choice') !== 'choice') fail();
  return mission;
}

/** Stable instructional order; repeated rounds choose the least-seen parallel item. */
export function buildRoundPlan(game, {level = 1, size = 3, records = {}} = {}) {
  if (!game || game.id !== GAME_ID || !Array.isArray(game.questions) ||
      !integer(level, 1, 4) || ![3, 5].includes(size) ||
      !integer(game.minStage, 1, 4) || !integer(game.maxStage, game.minStage, 4) ||
      new Set(game.questions.map(q => q.id)).size !== game.questions.length) fail();
  const stage = Math.min(game.maxStage, Math.max(game.minStage, level));
  const pool = game.questions.filter(q => q.level === stage);
  pool.forEach(missionFor);
  const seen = question => {
    const record = records?.[question.id];
    if (!record) return 0;
    return integer(record.seen, 0, 100000) ? record.seen : 1;
  };
  return KINDS.slice(0, size).map(kind => {
    const candidates = pool.filter(q => q.mission.kind === kind);
    candidates.sort((a, b) => seen(a) - seen(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (!candidates.length) fail();
    return candidates[0].id;
  });
}

export function createMissionState(question) {
  const mission = missionFor(question);
  return {
    questionId: question.id,
    baskets: createBaskets(mission),
    hintLevel: 0,
    demonstrated: false,
    assisted: false,
    answer: null
  };
}

function checkState(state, question) {
  const mission = missionFor(question);
  if (!state || state.questionId !== question.id ||
      !integer(state.hintLevel, 0, HINT_LIMIT) ||
      typeof state.demonstrated !== 'boolean' || typeof state.assisted !== 'boolean' ||
      ((state.hintLevel > 0 || state.demonstrated) && !state.assisted)) fail();
  checkBaskets(state.baskets);
  if (state.baskets.total !== mission.total) fail();
  return mission;
}

/** Showing a solution assists any later answer, never an answer already submitted. */
export function demonstrateMission(state, question) {
  const mission = checkState(state, question);
  return {
    ...state,
    baskets: createBaskets({
      total: mission.total,
      left: mission.kind === 'predict' ? mission.targetLeft : mission.left
    }),
    hintLevel: HINT_LIMIT,
    demonstrated: true,
    assisted: true
  };
}

export function revealHint(state, question) {
  checkState(state, question);
  if (state.hintLevel >= HINT_LIMIT) return state;
  if (state.hintLevel === HINT_LIMIT - 1) return demonstrateMission(state, question);
  return {...state, hintLevel: state.hintLevel + 1, assisted: true};
}

/** One answer per displayed state; repeated taps preserve the first answer object. */
export function submitMissionAnswer(state, question, response) {
  checkState(state, question);
  if (state.answer !== null) return state;
  const graded = gradeResponse(question, response);
  return {
    ...state,
    answer: {
      ...graded,
      assisted: state.assisted || state.hintLevel > 0 || state.demonstrated,
      hintLevel: state.hintLevel
    }
  };
}
