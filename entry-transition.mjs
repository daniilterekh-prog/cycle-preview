import {entryVisuals} from './entry-timing.mjs';
export function createEntryTransition(){
 const root=document.documentElement,hero=document.querySelector('.hero'),mark=hero.querySelector('h1'),header=document.querySelector('.site-header'),viewport=document.querySelector('.viewport');
 let active=false,progress=0,last=-1;
 const variables=['--entry-nav','--entry-copy','--entry-scene','--entry-lift'];
 mark.tabIndex=-1;
 function update(p,force=false){
  progress=p;if(!active||(!force&&p===last))return;last=p;
  const v=entryVisuals(p);
  hero.style.opacity=String(1-v.fade);
  root.style.setProperty('--entry-nav',String(v.nav));root.style.setProperty('--entry-copy',String(v.copy));root.style.setProperty('--entry-scene',String(v.scene));root.style.setProperty('--entry-lift',`${12*(1-v.copy)}px`);
  root.dataset.entry=Number(p).toFixed(4);
  header.inert=v.nav<.99;header.setAttribute('aria-hidden',String(v.nav<.99));
  viewport.inert=v.copy<.99;viewport.setAttribute('aria-hidden',String(v.copy<.99));
 }
 function refresh(){
  if(!active)return;
  update(progress,true);
 }
 return {
  activate(){active=true;root.classList.add('entry-enhanced');refresh();update(0,true);},
  update,refresh,
  destroy(){active=false;progress=0;last=-1;root.classList.remove('entry-enhanced');delete root.dataset.entry;variables.forEach(v=>root.style.removeProperty(v));hero.style.removeProperty('opacity');header.inert=false;viewport.inert=false;header.removeAttribute('aria-hidden');viewport.removeAttribute('aria-hidden');},
  focusHero(){mark.focus({preventScroll:true});},
 };
}
