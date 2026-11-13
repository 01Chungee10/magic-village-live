import {mountBlenderWorld,blenderDestinations} from './blender-v41-world.js?v=visual-v48-20261112';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
let learner=params.get('who')==='se'?'se':'tae';
let selected='math',viewer=null;
const descriptions={
  math:'열매를 옮겨 보며 전체와 부분의 관계를 배워요.',
  korean:'새로 꾸민 책장과 책을 살피고 나의 이야기를 펼쳐 보아요.',
  english:'숲에서 일상 영어 표현을 찾아보아요.',
  hanja:'모양과 뜻을 연결해 한자 여행을 떠나요.',
  kma:'경시대회의 원본 문제를 차근차근 풀어 보아요.',
  practice:'익숙한 숫자 문제도 다른 방법으로 도전해 보아요.',
  academy:'다양한 배움터를 한 번에 둘러보아요.',
  growth:'내가 배운 것과 앞으로 배울 것을 알아보아요.',
  pond:'연꽃과 물결, 작은 친구들이 기다리는 연못이에요.',
  ocean:'생태를 존중하며 푸른 바다를 멀리서 관찰해요.',
  career:'우주인과 다양한 직업의 도구를 찾아보아요.',
  garden:'생명의 나무와 꿀벌을 만나 보아요.',
  plaza:'배움을 응원하는 광장에서 쉬어 보아요.'
};
const buttonContainer=$('explore-places'),moreContainer=$('explore-extra-places');
const mainPlaces=['math','korean','pond','career','english','academy'];
const extraPlaces=['garden','growth','hanja','kma','practice','ocean','plaza'];
function choose(place){
  if(!Object.hasOwn(blenderDestinations,place))return;
  selected=place;
  for(const b of document.querySelectorAll('[data-place]'))b.setAttribute('aria-pressed',String(b.dataset.place===place));
  $('explore-place-title').textContent=blenderDestinations[place];
  $('explore-place-description').textContent=descriptions[place];
  const whom=encodeURIComponent(learner);
  const routable=!['garden','plaza'].includes(place);
  $('explore-go-village').href='./village/?who='+whom+'&autostart=1&v=48'+(routable?'&go='+encodeURIComponent(place):'');
  $('explore-go-village').textContent=routable?'3D 마을에서 '+blenderDestinations[place]+'로 이동하기':'3D 마을 입장하기';
  const subject=['math','korean','english','hanja'].includes(place)?'&subject='+place:'';
  $('explore-go-learning').href='./learning.html?who='+whom+subject;
  $('explore-go-learning').textContent=subject?'이 과목 학습부터 시작하기':'학습페이지 열기';
}
for(const [items,container] of [[mainPlaces,buttonContainer],[extraPlaces,moreContainer]]){
  for(const place of items){
    const b=document.createElement('button');
    b.type='button';b.dataset.place=place;
    b.textContent=blenderDestinations[place];
    b.addEventListener('click',()=>choose(place));
    container.append(b);
  }
}
function selectLearner(who){
  if(who!=='tae'&&who!=='se')return;
  learner=who;
  for(const b of document.querySelectorAll('[data-who]'))b.setAttribute('aria-pressed',String(b.dataset.who===who));
  choose(selected);
}
for(const b of document.querySelectorAll('[data-who]'))b.addEventListener('click',()=>selectLearner(b.dataset.who));
selectLearner(learner);
const stage=$('explore-stage'),status=$('world-status'),fallback=stage.querySelector('.explore-poster');
try{
  viewer=await mountBlenderWorld(stage,{
    modelUrl:'./assets/blender-v48/sparkle-magic-world-v48.glb',
    mode:'entry',autoAnimate:!matchMedia('(prefers-reduced-motion: reduce)').matches,
    onDestination:choose
  });
  status.textContent='입체 지도가 준비됐어요. 손가락이나 방향키로 둘러보고, 아래에서 장소를 선택해요.';
}catch{
  stage.replaceChildren(fallback);
  stage.dataset.blenderReady='false';
  status.textContent='이 기기에서는 3D 지도를 열 수 없어요. 그림과 장소 버튼으로 계속 이용할 수 있어요.';
}
window.addEventListener('pagehide',()=>viewer?.destroy(),{once:true});
