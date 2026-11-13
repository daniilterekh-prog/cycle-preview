import {snapStage} from './stage-snap.mjs';
// Native scroll with directional completion after the user releases the gesture.
export function createScrollTimeline(element,onProgress){
 const {gsap,ScrollTrigger}=window;
 if(!gsap||!ScrollTrigger)throw Error('Scroll runtime unavailable');
 gsap.registerPlugin(ScrollTrigger);
 ScrollTrigger.config({ignoreMobileResize:true,autoRefreshEvents:'visibilitychange,DOMContentLoaded,load'});
 const playhead={progress:0};let snapAllowed=false;
 const tween=gsap.to(playhead,{progress:1,ease:'none',onUpdate:()=>onProgress(playhead.progress),scrollTrigger:{trigger:element,start:'top top',end:'bottom bottom',scrub:.16,invalidateOnRefresh:true,onRefresh:self=>onProgress(self.progress),snap:{
  // Scrub may lag behind an explicit seek; snapping must use actual scroll.
  snapTo:(_value,self)=>snapAllowed?snapStage(self.progress,self.direction):self.progress,
  inertia:false,delay:.12,duration:{min:1.8,max:3.6},ease:'power1.inOut',
  onComplete:()=>{snapAllowed=false;}
 }}});
 const interactive=target=>target?.closest?.('a,button,input,textarea,select,summary,[contenteditable="true"]');
 function stopSnap(){snapAllowed=false;tween.scrollTrigger.getTween(true)?.kill?.();}
 function wheel(event){
  if(event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||interactive(event.target)){stopSnap();return;}
  if(event.deltaY)snapAllowed=true;
 }
 function touch(event){stopSnap();snapAllowed=event.touches.length===1&&!interactive(event.target);}
 function key(event){stopSnap();if(!interactive(event.target)&&['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(event.key))snapAllowed=true;}
 function click(event){if(interactive(event.target))stopSnap();}
 function pointer(event){if(event.pointerType==='mouse')stopSnap();}
 const listeners=[['wheel',wheel],['touchstart',touch],['keydown',key],['click',click],['pointerdown',pointer]];
 for(const [name,handler] of listeners)window.addEventListener(name,handler,{passive:true});
 return {
  refresh:()=>{stopSnap();ScrollTrigger.refresh();},
  destroy:()=>{stopSnap();for(const [name,handler] of listeners)window.removeEventListener(name,handler);tween.scrollTrigger.kill();tween.kill();},
  go(progress){
   stopSnap();
   const trigger=tween.scrollTrigger;
   window.scrollTo({top:trigger.start+(trigger.end-trigger.start)*progress,behavior:'instant'});
   ScrollTrigger.update();
   // Finish the previous scrub interpolation before an explicit keyboard/button
   // seek. Otherwise its next tick briefly overwrites the requested frame.
   trigger.getTween()?.progress(1);
   tween.progress(progress);onProgress(progress);
  }
 };
}
