// Keep the earlier prototype intact; this test owns its explicit seek behavior.
export function createScrollTimeline(element,onProgress){
 const {gsap,ScrollTrigger}=window;
 if(!gsap||!ScrollTrigger)throw Error('Scroll runtime unavailable');
 gsap.registerPlugin(ScrollTrigger);
 ScrollTrigger.config({ignoreMobileResize:true,autoRefreshEvents:'visibilitychange,DOMContentLoaded,load'});
 const playhead={progress:0};
 const tween=gsap.to(playhead,{progress:1,ease:'none',onUpdate:()=>onProgress(playhead.progress),scrollTrigger:{trigger:element,start:'top top',end:'bottom bottom',scrub:.16,invalidateOnRefresh:true,onRefresh:self=>onProgress(self.progress)}});
 return {
  refresh:()=>ScrollTrigger.refresh(),
  destroy:()=>{tween.scrollTrigger.kill();tween.kill();},
  go(progress){
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
