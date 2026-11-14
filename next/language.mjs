export const supportedLanguages=['ru','en','me'];
export function languageURL(locale,current,moduleURL){
 if(!supportedLanguages.includes(locale))throw Error('Unsupported language');
 const target=new URL(locale+'/',new URL('.',moduleURL));target.hash=new URL(current).hash;return target.href;
}
export function transitionState({target,form={},journey,openCases=[],hash=''},now=Date.now()){
 const allowed={};for(const [key,max] of [['name',120],['contact',200],['message',3000],['engagement',40]])allowed[key]=String(form[key]||'').slice(0,max);
 return {version:1,target,form:allowed,journey:Number.isFinite(journey)?Math.max(0,Math.min(1,journey)):null,openCases:openCases.filter(id=>/^case-[a-z-]+$/.test(id)).slice(0,3),hash,expiresAt:now+600000};
}
export function readTransition(raw,pathname,now=Date.now()){
 try{const state=JSON.parse(raw);if(state?.version!==1||state.target!==pathname||!(state.expiresAt>now)||!Array.isArray(state.openCases))return null;return {...transitionState(state,now),expiresAt:state.expiresAt};}catch{return null;}
}
export function languageContext({journey,storyBottom,viewportHeight,sections=[]}){
 if(storyBottom>viewportHeight*.2)return {hash:journey>0?'#top':'#hero',journey};
 const section=sections.filter(s=>s.top<=viewportHeight*.3).at(-1)||sections[0];
 return {hash:section?'#'+section.id:'#contact',journey:null};
}
export function installLanguages(){
 const root=document.documentElement,key='cycle:language-transition',form=document.querySelector('#contact-form');
 let saved;
 try{saved=readTransition(sessionStorage.getItem(key),location.pathname);sessionStorage.removeItem(key);}catch{}
 if(saved){
  for(const name of ['name','contact','message','engagement'])if(form?.elements[name]&&typeof saved.form?.[name]==='string')form.elements[name].value=saved.form[name];
  for(const id of saved.openCases||[]){const detail=document.getElementById(id)?.querySelector('details');if(detail)detail.open=true;}
  if(saved.journey!==null&&['','#hero','#top','#expertise'].includes(saved.hash||'')){root.dataset.resumeJourney=String(saved.journey);document.dispatchEvent(new Event('cycle:resume-language'));}
 }
 try{const preference=localStorage.getItem('cycle:language');if(location.pathname===new URL('.',import.meta.url).pathname&&supportedLanguages.includes(preference)&&preference!=='ru')location.replace(languageURL(preference,location.href,import.meta.url));}catch{}
 document.querySelectorAll('[data-language]').forEach(link=>{
  const url=languageURL(link.dataset.language,location.href,import.meta.url);link.href=url;
  link.addEventListener('click',event=>{
   if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   if(link.dataset.language===root.dataset.locale){event.preventDefault();return;}
   const target=new URL(languageURL(link.dataset.language,location.href,import.meta.url));
   const context=languageContext({journey:Number(root.dataset.journey)||0,storyBottom:document.querySelector('.experience')?.getBoundingClientRect().bottom??0,viewportHeight:innerHeight,sections:[...document.querySelectorAll('main>.page-section,.case-card,footer')].filter(el=>!el.hidden&&el.id).map(el=>({id:el.id,top:el.getBoundingClientRect().top}))});
   target.hash=context.hash;
   const state=transitionState({target:target.pathname,form:form?Object.fromEntries(new FormData(form)):{},...context,openCases:[...document.querySelectorAll('.case-card')].filter(el=>el.querySelector('details[open]')).map(el=>el.id)});
   try{sessionStorage.setItem(key,JSON.stringify(state));localStorage.setItem('cycle:language',link.dataset.language);}catch{}
   link.href=target.href;
  });
 });
}
export function translator(){
 let messages={};try{messages=JSON.parse(document.querySelector('#cycle-messages')?.textContent||'{}');}catch{}
 return source=>messages[source]??source;
}
