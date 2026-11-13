import {createBaskets, moveCounter, createMissionState, revealHint, demonstrateMission, GAME_ID} from './concept-baskets.js';

const PHASES = {predict:'먼저 예상하기', hidden:'가려진 부분 찾기', transfer:'다른 곳에 써보기', represent:'다른 그림으로 보기', explain:'설명 살펴보기'};
const encode = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fruit = '<svg viewBox="0 0 32 36" aria-hidden="true"><path d="M16 9C4 1 0 15 6 26c4 8 16 8 20-1C33 12 26 2 16 9Z" fill="#c44563" stroke="#743249" stroke-width="1.5"/><path d="M16 10c-1-7 4-9 8-8-1 5-4 7-8 8Z" fill="#457a48"/><path d="m11 14-2 4" stroke="#fff1eb" stroke-width="3" stroke-linecap="round"/></svg>';

export function createViewState() {
  return {roundKey:'', intro:false, exploration:createBaskets({total:5,left:2}), questionKey:'', mission:null, selected:null, error:''};
}
export function enterRound(ui, round, who) {
  const key = who + ':' + round.id;
  if (ui.roundKey === key) return;
  Object.assign(ui, createViewState(), {roundKey:key, intro:round.index===0 && round.answers.length===0 && !round.hinted && round.strategy!=='review'});
}
function currentState(ui, q, round, retrying) {
  const key = round.id + ':' + q.id + ':' + Boolean(retrying);
  if (ui.questionKey !== key) Object.assign(ui, {questionKey:key, mission:createMissionState(q), selected:null, error:''});
  // An assisted item stays assisted after reloading, even though its display state is ephemeral.
  if (round.hinted && !retrying && ui.mission.hintLevel===0) ui.mission=revealHint(ui.mission,q);
  return ui.mission;
}
function tokens(count) {
  return Array.from({length:count}, () => '<span class="basket-fruit">' + fruit + '</span>').join('');
}
function basket(label,count,{hidden=false,showCount=true}={}) {
  return '<div class="basket-group"><h3>' + label + '</h3><div class="basket-vessel' + (hidden?' is-covered':'') + '" role="img" aria-label="' + (hidden?'가려진 바구니':label+' 열매 '+count+'개') + '">' + (hidden?'<span class="basket-cover" aria-hidden="true">?</span>':tokens(count)||'<span class="basket-empty" aria-hidden="true">비었어요</span>') + '</div>' + (showCount?'<p class="basket-count">'+(hidden?'?':count)+'<small>개</small></p>':'') + '</div>';
}
function basketPair(baskets, {hiddenSide='', showCount=true}={}) {
  return '<div class="basket-pair">' + basket('왼쪽',baskets.left,{hidden:hiddenSide==='left',showCount}) + basket('오른쪽',baskets.right,{hidden:hiddenSide==='right',showCount}) + '</div>';
}
function scene(q,state,{reveal=false}={}) {
  const m=q.mission, b=state.baskets;
  if(m.context==='chairs') {
    return '<figure class="basket-scene"><figcaption>자리 '+m.total+'개 · 앉은 동물 '+m.left+'마리</figcaption><div class="basket-chairs" role="img" aria-label="자리 '+m.total+'개 중 '+m.left+'곳에 동물이 앉아 있어요. 나머지는 비어 있어요.">'+Array.from({length:m.total},(_,i)=>'<span class="basket-chair '+(i<m.left?'occupied':'')+'" aria-hidden="true"><span>'+(i<m.left?'🐰':'')+'</span><i></i></span>').join('')+'</div>'+(reveal?'<p class="basket-equation">앉은 자리 '+m.left+' + 빈 자리 '+(m.total-m.left)+' = 전체 '+m.total+'</p>':'')+'</figure>';
  }
  if(m.context==='dots') {
    const stickers=m.kind==='transfer', hidden=stickers&&!reveal&&!state.demonstrated;
    const leftLabel=stickers?'노란 종이':'노란 점', rightLabel=stickers?'파란 종이':'파란 점';
    const marks=n=>Array.from({length:n},()=>stickers?'<span aria-hidden="true">⭐</span>':'<i aria-hidden="true"></i>').join('');
    const description=leftLabel+'에 '+m.left+'개, '+(hidden?rightLabel+'는 가려져 있어요':rightLabel+'에 '+(m.total-m.left)+'개');
    return '<figure class="basket-scene"><figcaption>'+(stickers?'스티커는 모두 '+m.total+'개예요':'두 무리의 동그라미')+'</figcaption><div class="basket-dot-groups" role="img" aria-label="'+description+'"><div class="basket-yellow"><span class="basket-group-label">'+leftLabel+'</span>'+marks(m.left)+'</div><div class="basket-blue"><span class="basket-group-label">'+rightLabel+'</span>'+(hidden?'<span class="basket-cover" aria-hidden="true">?</span>':marks(m.total-m.left)||'<span aria-hidden="true">비었어요</span>')+'</div></div>'+(reveal?'<p class="basket-equation">'+m.left+' + '+(m.total-m.left)+' = '+m.total+'</p>':'')+'</figure>';
  }
  const hidden = m.kind==='hidden' && !reveal && !state.demonstrated;
  const totalLine=m.kind==='hidden'?'<p class="basket-total">두 바구니에 모두 <strong>'+m.total+'개</strong></p>':'';
  return '<figure class="basket-scene">'+totalLine+basketPair(b,{hiddenSide:hidden?m.hiddenSide:'',showCount:m.kind!=='predict'||reveal})+(reveal?'<p class="basket-equation">'+b.left+' + '+b.right+' = '+b.total+'</p>':'')+'</figure>';
}
export function renderExplore(ui, esc=encode) {
  const b=ui.exploration;
  return '<section class="panel baskets-panel" aria-labelledby="basket-title"><p class="basket-eyebrow">요정의 두 바구니 · 먼저 만져 보기</p><h1 id="basket-title" tabindex="-1">열매를 옮겨 볼까?</h1><p class="basket-story">한 개씩 옮기며 두 바구니를 살펴봐요.</p>'+basketPair(b)+'<p class="basket-equation">'+b.left+' + '+b.right+' = <strong>'+b.total+'</strong></p><div class="basket-move-controls"><button class="secondary" data-action="basket-move" data-from="right" '+(b.right===0?'disabled':'')+'>← 왼쪽으로 1개</button><button class="secondary" data-action="basket-move" data-from="left" '+(b.left===0?'disabled':'')+'>오른쪽으로 1개 →</button></div><p class="basket-note">마음껏 옮겨 봐요. 이 연습은 점수에 넣지 않아요.</p><button class="primary basket-primary" data-action="basket-begin">이제 예상해 볼래요</button></section>';
}
export function renderQuestion(ui,{q,round,retrying=false,esc=encode}) {
  const state=currentState(ui,q,round,retrying),choice=!q.interaction||q.interaction.type==='choice';
  const options=choice?q.choices:Array.from({length:q.interaction.max+1},(_,n)=>String(n));
  const hint=state.hintLevel>0?q.mission.hints[Math.min(state.hintLevel,q.mission.hints.length)-1]:'';
  return '<section class="panel baskets-panel" aria-labelledby="basket-title" data-basket-question="'+esc(q.id)+'"><div class="basket-heading"><div><p class="basket-eyebrow">'+PHASES[q.mission.kind]+'</p><h1 id="basket-title" tabindex="-1">'+esc(q.title)+'</h1></div><button class="secondary basket-read" data-action="read" aria-label="문제와 보기 읽어주기">🔊 듣기</button></div><p class="basket-story">'+esc(q.story)+'</p>'+scene(q,state)+'<h2 id="basket-prompt" class="basket-prompt">'+esc(q.prompt)+'</h2><div class="basket-answers '+(choice?'is-choice':'')+'" role="group" aria-labelledby="basket-prompt">'+options.map((label,n)=>'<button data-action="basket-pick" data-value="'+n+'" aria-pressed="'+(ui.selected===n)+'"'+(!choice?' aria-label="'+n+'개"':'')+'>'+esc(label)+'</button>').join('')+'</div><p id="basket-answer-error" class="basket-error">'+esc(ui.error)+'</p><button class="primary basket-primary" data-action="basket-submit">내 생각 확인하기</button><div class="basket-help"><button class="text-button" data-action="basket-hint" '+(state.hintLevel>=q.mission.hints.length?'disabled':'')+'>'+(state.hintLevel===0?'도움 받기':state.hintLevel<q.mission.hints.length-1?'다음 도움 보기':'함께 확인하기')+'</button><p>'+esc(hint)+'</p></div><p class="voice-status" id="voice-status" role="status"></p></section>';
}
export function renderFeedback(ui,{q,round,answer,retrying=false,esc=encode}) {
  const state=currentState(ui,q,round,retrying);
  const shown=demonstrateMission({...state,answer:{...answer,assisted:round.hinted||retrying}},q);
  return '<section class="panel baskets-panel basket-feedback" id="feedback" tabindex="-1"><p class="basket-eyebrow">'+PHASES[q.mission.kind]+'</p><h1 tabindex="-1">'+(answer.correct?'방법을 찾았어!':'함께 살펴보자')+'</h1><p class="basket-story">'+(q.mission.kind==='predict'?'옮긴 뒤의 두 바구니를 확인해요.':q.mission.kind==='hidden'?'가린 바구니를 열어 확인해요.':'그림과 설명을 함께 확인해요.')+'</p>'+scene(q,shown,{reveal:true})+'<div class="basket-explanation">'+q.explanation.map(text=>'<p>'+esc(text)+'</p>').join('')+'</div><p class="basket-note">'+(retrying?'풀이를 본 뒤 다시 연습했어요.':round.hinted?'도움을 받아 생각한 답으로 기록했어요.':'힌트 없이 생각한 답으로 기록했어요.')+'</p><div class="basket-feedback-actions">'+(!retrying||!answer.correct?'<button class="secondary" data-action="retry">내가 다시 풀기</button>':'')+'<button class="primary" data-action="next">'+(round.index===round.ids.length-1?'한 판 마치기':'다음 이야기')+'</button></div></section>';
}
export function act(ui,action,{from,value,q,round,retrying=false}={}) {
  if(action==='basket-move'&&ui.intro) {
    ui.exploration=moveCounter(ui.exploration,from);
    return {announcement:'왼쪽 '+ui.exploration.left+'개, 오른쪽 '+ui.exploration.right+'개. 모두 '+ui.exploration.total+'개예요.'};
  }
  if(action==='basket-begin') {ui.intro=false;return {focus:'#basket-title'};}
  if(!q||!round||ui.intro)return {};
  const state=currentState(ui,q,round,retrying);
  if(action==='basket-pick') {
    const max=(!q.interaction||q.interaction.type==='choice')?q.choices.length-1:q.interaction.max;
    if(Number.isInteger(value)&&value>=0&&value<=max){ui.selected=value;ui.error='';}
  }
  if(action==='basket-hint') {
    ui.mission=revealHint(state,q);
    if(ui.mission.hintLevel>=q.mission.hints.length)ui.mission=demonstrateMission(ui.mission,q);
    return {hint:true,announcement:q.mission.hints[ui.mission.hintLevel-1]};
  }
  if(action==='basket-submit') {
    if(ui.selected===null){ui.error='먼저 내 생각을 골라 주세요.';return {announcement:ui.error,focus:'[data-action="basket-pick"]'};}
    return {response:ui.selected};
  }
  return {};
}
export function summarizeEvidence(records={},ids=null,{roundId=null}={}) {
  const entries=Object.entries(records).filter(([id])=>!ids||ids.includes(id));
  const result={independent:0,independentCorrect:0,assisted:0,unknown:0,reviewCorrect:0,transferCorrect:0};
  for(const [,record] of entries) {
    const first=record.firstAttempt;
    if(!first)result.unknown++;
    else if(!roundId||first.roundId===roundId){
      if(first.assisted===true)result.assisted++;
      else {result.independent++;if(first.correct)result.independentCorrect++;}
    }
    const attempts=(record.attempts||[]).filter(a=>!roundId||a.roundId===roundId);
    if(attempts.some(a=>a.purpose==='review'&&a.correct&&!a.assisted))result.reviewCorrect++;
    if(attempts.some(a=>a.purpose==='transfer'&&a.correct&&!a.assisted))result.transferCorrect++;
  }
  return result;
}
export function renderSummary(records={},ids=null,esc=encode,{roundId=null}={}) {
  const s=summarizeEvidence(records,ids,{roundId});
  return '<section class="basket-summary"><h3>두 바구니에서 해 본 생각</h3><p>옮겨도 전체는 같은지, 보이지 않는 부분은 얼마인지 생각했어요.</p><details><summary>보호자와 '+(roundId?'이번 회차':'누적')+' 기록 보기</summary><dl><div><dt>'+(roundId?'이번에 처음 푼 문항 · 도움 없음':'누적 최초 시도 · 도움 없음')+'</dt><dd>'+s.independentCorrect+' / '+s.independent+'개 정답</dd></div><div><dt>'+(roundId?'이번에 처음 푼 문항 · 도움 있음':'누적 최초 시도 · 도움 있음')+'</dt><dd>'+s.assisted+'개</dd></div><div><dt>다른 상황에서 혼자 찾은 답</dt><dd>'+s.transferCorrect+'개</dd></div><div><dt>복습에서 혼자 다시 찾은 답</dt><dd>'+s.reviewCorrect+'개</dd></div>'+(s.unknown?'<div><dt>도움 여부를 확인할 수 없는 이전 기록</dt><dd>'+s.unknown+'개</dd></div>':'')+'</dl><p class="basket-note">한 번의 정답으로 이해를 확정하지 않아요. 다른 물건으로도 해 보고, 다음 복습에서 다시 확인해요. 복습·전이 수는 문항별 최근 기록에 남은 답을 기준으로 해요.</p></details></section>';
}
export function renderEntry({roundSize=3,resume=false}={}) {
  return '<section class="basket-entry" aria-labelledby="basket-entry-title"><div><p class="basket-eyebrow">직접 해 보는 수학</p><h2 id="basket-entry-title">요정의 두 바구니</h2><p>옮겨도 전체는 같을까? 만져 보고, 예상하고, 다른 곳에도 써 봐요.</p></div><button class="primary" data-action="play" data-game="'+GAME_ID+'" data-purpose="foundation">'+(resume?'이어서 발견하기':'바구니 열어 보기')+'</button><small>한 판 '+roundSize+'문제 · 내 속도로 생각해요</small></section>';
}
