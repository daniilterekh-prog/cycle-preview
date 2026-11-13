import {entryVisuals} from './entry-timing.mjs';
export function createEntryTransition(){
 const root=document.documentElement,hero=document.querySelector('.hero'),mark=hero.querySelector('h1'),header=document.querySelector('.site-header'),target=header.querySelector('.logo img'),viewport=document.querySelector('.viewport');
 let active=false,progress=0,last=-1,geometry;
 const variables=['--entry-nav','--entry-copy','--entry-scene','--entry-handoff','--entry-lift','--entry-tagline'];
 mark.tabIndex=-1;
 function update(p,force=false){
  progress=p;if(!active||(!force&&p===last))return;last=p;
  const v=entryVisuals(p,innerWidth<=700);
  if(geometry){const {x,y,scale}=geometry;mark.style.transform=`translate3d(${x*v.dock}px,${y*v.dock}px,0) scale(${1+(scale-1)*v.dock})`;}
  hero.style.opacity=String(1-v.handoff);
  root.style.setProperty('--entry-tagline',String(1-Math.min(1,v.dock*4)));
  root.style.setProperty('--entry-nav',String(v.nav));root.style.setProperty('--entry-copy',String(v.copy));root.style.setProperty('--entry-scene',String(v.scene));root.style.setProperty('--entry-handoff',String(v.handoff));root.style.setProperty('--entry-lift',`${12*(1-v.copy)}px`);
  root.dataset.entry=Number(p).toFixed(4);
  header.inert=v.nav<.99;header.setAttribute('aria-hidden',String(v.nav<.99));
  viewport.inert=v.copy<.99;viewport.setAttribute('aria-hidden',String(v.copy<.99));
 }
 function refresh(){
  if(!active)return;
  mark.style.transform='none';
  const from=mark.getBoundingClientRect(),to=target.getBoundingClientRect();
  geometry={x:to.left-from.left,y:to.top-from.top,scale:to.width/from.width};
  update(progress,true);
 }
 return {
  activate(){active=true;root.classList.add('entry-enhanced');refresh();update(0,true);},
  update,refresh,
  destroy(){active=false;progress=0;last=-1;geometry=null;root.classList.remove('entry-enhanced');delete root.dataset.entry;variables.forEach(v=>root.style.removeProperty(v));mark.style.removeProperty('transform');hero.style.removeProperty('opacity');header.inert=false;viewport.inert=false;header.removeAttribute('aria-hidden');viewport.removeAttribute('aria-hidden');},
  focusHero(){mark.focus({preventScroll:true});},
 };
}
