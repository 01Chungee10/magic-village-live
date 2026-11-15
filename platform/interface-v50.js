/** Presentation preferences only. Never reads or changes learning records or rewards. */
const root=document.documentElement;
const key='magic-village-interface-v50';
let large=false;
try{large=localStorage.getItem(key)==='large';}catch{}
root.dataset.readingSize=large?'large':'normal';
function refreshPreferences(){
 for(const button of document.querySelectorAll('[data-ui-action="text-size"]')){
  const pressed=String(large),label=large?'기본 글자로 보기':'큰 글자로 보기';
  if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
  if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
  if(button.title!==label)button.title=label;
  if(button.textContent!==(large?'가−':'가+'))button.textContent=large?'가−':'가+';
 }
}
let scheduled=false;
const observer=new MutationObserver(records=>{
 if(!records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1)))return;
 if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;refreshPreferences();});
});
observer.observe(document.body,{childList:true,subtree:true});refreshPreferences();
let imageDialog=null;
function zoomImage(button){
 const raw=button.dataset.uiImage;
 if(!raw)return;
 let url;try{url=new URL(raw,document.baseURI);}catch{return;}
 if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return;
 imageDialog?.close();imageDialog?.remove();
 const dialog=document.createElement('dialog');dialog.className='ui-image-dialog';
 dialog.setAttribute('aria-labelledby','ui-image-heading');
 const header=document.createElement('header');
 const heading=document.createElement('h2');heading.id='ui-image-heading';heading.textContent=button.dataset.uiImageTitle||'문제 그림 확대';
 const size=document.createElement('button');size.type='button';size.textContent='원본 크기';size.setAttribute('aria-pressed','false');
 const close=document.createElement('button');close.type='button';close.textContent='닫기';close.setAttribute('aria-label','확대 그림 닫기');
 const scroll=document.createElement('div');scroll.className='ui-image-scroll';
 const image=document.createElement('img');image.src=url.href;image.alt=heading.textContent;
 const status=document.createElement('p');status.className='ui-helper';status.setAttribute('role','status');
 image.addEventListener('error',()=>{status.textContent='그림을 불러오지 못했어요. 연결을 확인한 뒤 다시 열어 주세요.';});
 size.addEventListener('click',()=>{const natural=scroll.dataset.natural!=='true';scroll.dataset.natural=String(natural);size.textContent=natural?'화면에 맞추기':'원본 크기';size.setAttribute('aria-pressed',String(natural));});
 close.addEventListener('click',()=>dialog.close());
 // The enclosing village handles Escape too; let the top-layer dialog own it.
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 dialog.addEventListener('close',()=>{dialog.remove();if(imageDialog===dialog)imageDialog=null;if(button.isConnected)button.focus({preventScroll:true});},{once:true});
 header.append(heading,size,close);scroll.append(image,status);dialog.append(header,scroll);document.body.append(dialog);imageDialog=dialog;
 dialog.showModal();close.focus({preventScroll:true});
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-ui-action]');if(!button)return;
 if(button.dataset.uiAction==='text-size'){
  large=!large;root.dataset.readingSize=large?'large':'normal';
  try{localStorage.setItem(key,large?'large':'normal');}catch{}
  refreshPreferences();
 }else if(button.dataset.uiAction==='zoom-image')zoomImage(button);
});
window.addEventListener('storage',event=>{if(event.key!==key)return;large=event.newValue==='large';root.dataset.readingSize=large?'large':'normal';refreshPreferences();});
window.addEventListener('pagehide',()=>imageDialog?.close());
