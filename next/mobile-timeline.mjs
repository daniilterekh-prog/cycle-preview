import {mobileProgressMap,nextReadStop,keyDirection} from './mobile-progress.mjs';
import {showStillStory} from './still-story.mjs?v=versioned-stills-2';
export const mobileFlowWanted=()=>matchMedia('(max-width:700px), (orientation:landscape) and (max-height:500px)').matches;
// The one Canvas is moved between natural-flow chapters. Other chapters retain
// a shared key image; no additional renderer or model is created.
export function createMobileTimeline(experience,panels,scene,controls,onProgress,manifest){
 const root=document.documentElement,viewport=experience.querySelector('.viewport');
 const sceneHome=document.createComment('scene home'),controlsHome=document.createComment('controls home');
 scene.before(sceneHome);controls.before(controlsHome);viewport.prepend(controls);root.classList.add('mobile-flow');
 showStillStory(panels,{manifest,base:import.meta.url,frameRoot:root.dataset.frameRoot||'frames'});
 const anchors=panels.map(panel=>{const anchor=document.createElement('span');anchor.className='mobile-scene-anchor';anchor.setAttribute('aria-hidden','true');panel.querySelector('.description').after(anchor);return anchor;});
 let map,closed=false,readFloor=null,progress=0,raf=0,snapTimer=0,intent=0,writing=false,touchY=0,touchForward=false,touchBackward=false;
 const interactive=target=>target?.closest?.('a,button,input,textarea,select,summary,[contenteditable="true"]');
 const emit=p=>{progress=Math.max(0,Math.min(1,p));if(!closed)onProgress(progress);};
 function stop(){cancelAnimationFrame(raf);clearTimeout(snapTimer);raf=0;snapTimer=0;writing=false;}
 function headerHeight(){return document.querySelector('.site-header').offsetHeight+controls.offsetHeight+8;}
 function measure(){
  const header=headerHeight();root.style.setProperty('--mobile-scene-top',header+'px');
  map=mobileProgressMap({entryEnd:experience.offsetTop+parseFloat(getComputedStyle(experience).paddingTop),header,viewport:innerHeight,panels:panels.map((panel,i)=>({id:panel.dataset.panel,top:scrollY+panel.getBoundingClientRect().top,scene:scrollY+anchors[i].getBoundingClientRect().top,sceneHeight:scene.offsetHeight}))});
 }
 function placeScene(id){
  const active=panels.find(panel=>panel.dataset.panel===id);if(!active)return;
  for(const [i,panel] of panels.entries()){
   const selected=panel===active;panel.toggleAttribute('data-scene-active',selected);
   const picture=panel.querySelector('.stage-still');if(!picture||panel.dataset.panel==='strategy')continue;
   const activeIndex=panels.indexOf(active),stage=manifest.stages.find(s=>s.id===panel.dataset.panel);
   const frame=i<activeIndex?stage.end:Math.max(0,stage.start-1);
   const source=picture.querySelector('source'),image=picture.querySelector('img');
   source.srcset=new URL(manifest.profiles.mobile.frames[frame].file,import.meta.url).href;
   image.src=new URL(manifest.profiles.desktop.frames[frame].file,import.meta.url).href;
  }
  if(scene.parentElement!==active)active.insertBefore(scene,active.querySelector('.stage-result'));
  if(map)measure();
  const button=controls.querySelector(`[data-seek="${id==='strategy'?'strategy':manifest.stages.find(s=>s.id===id)?.end}"]`),strip=controls.querySelector('.control-bottom');
  if(button&&strip)strip.scrollLeft=button.offsetLeft-(strip.clientWidth-button.offsetWidth)/2;
 }
 function renderScroll(){
  if(!map||closed)return;
  let p=map.progress(scrollY);
  if(readFloor){const panel=panels.find(panel=>panel.dataset.panel===readFloor.id),next=panels[panels.indexOf(panel)+1];const end=next?scrollY+next.getBoundingClientRect().top-headerHeight():experience.offsetTop+experience.offsetHeight;
   if(scrollY>=readFloor.y-2&&scrollY<end)p=readFloor.progress;else readFloor=null;
  }
  emit(p);
 }
 function reveal(stop){
  const start=performance.now(),from=progress,duration=900,floor={...stop,progress:from};readFloor=floor;writing=true;
  function tick(now){if(closed)return;if(readFloor!==floor){writing=false;intent=0;raf=0;return;}const t=Math.min(1,(now-start)/duration),smooth=t*t*(3-2*t);floor.progress=from+(stop.progress-from)*smooth;emit(floor.progress);if(t<1)raf=requestAnimationFrame(tick);else{writing=false;intent=0;raf=0;}}
  raf=requestAnimationFrame(tick);
 }
 function settle(stop){
  if(!stop||closed)return;stopMotion();writing=true;const from=scrollY,start=performance.now(),duration=Math.min(650,Math.max(300,Math.abs(stop.y-from)*.55));
  function tick(now){if(closed)return;const t=Math.min(1,(now-start)/duration),smooth=t*t*(3-2*t);scrollTo({top:from+(stop.y-from)*smooth,behavior:'instant'});renderScroll();if(t<1)raf=requestAnimationFrame(tick);else{raf=0;reveal(stop);}}
  raf=requestAnimationFrame(tick);
 }
 function stopMotion(){stop();intent=0;}
 function schedule(){clearTimeout(snapTimer);if(!intent||writing||!map||scrollY<experience.offsetTop||scrollY>=experience.offsetTop+experience.offsetHeight-innerHeight)return;const direction=intent;snapTimer=setTimeout(()=>settle(nextReadStop(map.stops,scrollY,direction)),180);}
 function scroll(){renderScroll();schedule();}
 function canSnap(direction,compensation=0){
  if(!map||scrollY<map.points[1].y)return true;
  const active=panels.find(panel=>panel.dataset.panel===root.dataset.stage);if(!active)return true;
  // Finish reading the current chapter before the next gesture advances it.
  return direction>0?(active.querySelector('.stage-example')?.getBoundingClientRect().bottom??active.getBoundingClientRect().bottom)+compensation<=innerHeight-8:active.getBoundingClientRect().top+compensation>=headerHeight()-8;
 }
 function wheel(event){stop();if(event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||interactive(event.target)){intent=0;return;}const direction=Math.sign(event.deltaY);intent=canSnap(direction,event.deltaY)?direction:0;if(intent<0)readFloor=null;schedule();}
 function touchStart(event){stopMotion();touchForward=canSnap(1);touchBackward=canSnap(-1);if(event.touches.length===1&&!interactive(event.target))touchY=event.touches[0].clientY;else touchY=NaN;}
 function touchEnd(event){if(!Number.isFinite(touchY))return;const direction=Math.sign(touchY-event.changedTouches[0].clientY);intent=(direction>0?touchForward:touchBackward)?direction:0;if(intent<0)readFloor=null;schedule();}
 function key(event){stopMotion();if(interactive(event.target))return;const direction=keyDirection(event);intent=direction&&canSnap(direction)?direction:0;if(intent<0)readFloor=null;schedule();}
 function click(event){if(interactive(event.target))stopMotion();}
 function pointer(event){if(event.pointerType==='mouse')stopMotion();}
 const listeners=[['scroll',scroll],['wheel',wheel],['touchstart',touchStart],['touchend',touchEnd],['keydown',key],['click',click],['pointerdown',pointer]];
 for(const [name,handler] of listeners)window.addEventListener(name,handler,{passive:true});
 measure();
 return {mobile:true,placeScene,
  captureLocation(){const header=headerHeight(),panel=panels.filter(p=>p.getBoundingClientRect().top<=header+1).at(-1)||panels[0];return {kind:'mobile-chapter',id:panel.dataset.panel,offset:scrollY-(scrollY+panel.getBoundingClientRect().top-header),progress,floor:readFloor?{id:readFloor.id,progress:readFloor.progress}:null};},
  restoreLocation(saved){stopMotion();measure();const panel=panels.find(p=>p.dataset.panel===saved.id);if(!panel)return;const heading=scrollY+panel.getBoundingClientRect().top-headerHeight(),floor=saved.floor&&map.stops.find(s=>s.id===saved.floor.id);readFloor=floor?{...floor,progress:saved.floor.progress}:null;scrollTo({top:heading+saved.offset,behavior:'instant'});emit(saved.progress);},
  refresh(){stopMotion();measure();renderScroll();},
  go(p){stopMotion();const stop=map.stops.find(s=>Math.abs(s.progress-p)<1e-6);const y=stop?.y??map.position(p);readFloor=stop?{...stop,progress:p}:null;scrollTo({top:y,behavior:'instant'});emit(p);},
  destroy(){if(closed)return;closed=true;stopMotion();for(const [name,handler] of listeners)window.removeEventListener(name,handler);sceneHome.before(scene);sceneHome.remove();controlsHome.before(controls);controlsHome.remove();anchors.forEach(a=>a.remove());panels.forEach(p=>p.removeAttribute('data-scene-active'));root.classList.remove('mobile-flow');root.style.removeProperty('--mobile-scene-top');}
 };
}
