import {splitProgress,joinStory,entryVisuals} from './entry-timing.mjs';
import {createEntryTransition} from './entry-transition.mjs';
import {FrameLoader} from './frame-loader.mjs?v=encoded-buffer-2';
import {BuildingCanvas,fetchFrameBlob,decodeBlob} from './building-canvas.mjs?v=encoded-buffer-2';
import {EncodedFrames} from './encoded-frames.mjs?v=encoded-buffer-2';
import {createScrollTimeline} from './scroll-timeline.mjs';
import {stageForFrame,stages} from './stages.mjs';
import {storyState,progressForFrame,solidOpacity} from './intro-timeline.mjs?v=encoded-buffer-2';
import {PencilCanvas} from './pencil-canvas.mjs';
import {AEPencilCanvas} from './ae-pencil-canvas.mjs';
import {loadAEPencil} from './load-ae-pencil.mjs';
import {imageProfile,posterNeeded,manifestURL} from './presentation.mjs?v=manifest-version-1';
import {captureLocation,restoreLocation} from './resize-position.mjs';
import {translator} from './language.mjs?v=story-access-1';
import {createStoryMode} from './story-mode.mjs';
import {showStillStory} from './still-story.mjs?v=versioned-stills-1';
const t=translator();
const root=document.documentElement,experience=document.querySelector('.experience'),canvas=document.querySelector('canvas'),poster=document.querySelector('.poster'),sketch=document.querySelector('.sketch-layer'),controls=document.querySelector('.controls'),slider=document.querySelector('#scrubber'),frameOutput=document.querySelector('#frame'),phase=document.querySelector('.phase'),error=document.querySelector('.error');
const renderer=new BuildingCanvas(canvas);
const panels=[...document.querySelectorAll('[data-panel]')];
panels.forEach(panel=>{panel.id=`stage-${panel.dataset.panel}`;});
let manifest,loader,aborter,timeline,profile,active=false,requested=-1,state=storyState(0),resizeRAF=0,end=0;
let pencil,pencilPromise,pencilAborter,journeyProgress=0,entryProgress=0;
let encoded;
let layoutSnapshot;
const sectionAnchors=()=>[...document.querySelectorAll('main>.page-section,footer')].filter(el=>!el.hidden).map(el=>({id:el.id,top:scrollY+el.getBoundingClientRect().top})).filter(el=>el.id);
function measureLayout(){layoutSnapshot={start:experience.offsetTop,end:experience.offsetTop+experience.offsetHeight-innerHeight,header:document.querySelector('.site-header').offsetHeight,anchors:sectionAnchors()};}
root.dataset.playerBuild='homepage-v4-1';
const entry=createEntryTransition();
function syncPoster(){poster.style.visibility=posterNeeded({pencilPainted:!!pencil,sketchOpacity:state.sketch,frame:renderer.last,solidOpacity:Number(canvas.style.opacity)})?'visible':'hidden';}
function drawPencil(){if(active&&pencil&&state.sketch>0)pencil.draw(Math.max(state.draw,entryVisuals(entryProgress).ink));syncPoster();}
function ensurePencil(){
 if(pencilPromise||entryProgress<.25||state.sketch<=0||experience.getBoundingClientRect().top>=innerHeight)return;
 const controller=pencilAborter=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 const read=async file=>{const response=await fetch(new URL(file,import.meta.url),{signal:controller.signal});if(!response.ok)throw Error('Pencil unavailable');return response.json();};
 pencilPromise=loadAEPencil({base:import.meta.url,signal:controller.signal}).then(data=>new AEPencilCanvas(document.querySelector('.pencil-canvas'),data)).catch(async error=>{if(controller.signal.aborted)throw error;root.dataset.pencilFallback='legacy-vector';return new PencilCanvas(document.querySelector('.pencil-canvas'),await read('pencil.json'));}).then(instance=>{
  if(controller.signal.aborted){instance.release();return;}pencil=instance;root.dataset.pencilSource=pencil instanceof AEPencilCanvas?'after-effects':'legacy-vector';drawPencil();sketch.classList.remove('pencil-loading');sketch.classList.add('pencil-ready');
 }).catch(()=>{if(pencilAborter===controller&&!controller.signal.aborted){sketch.classList.remove('pencil-loading');sketch.classList.add('pencil-failed');root.dataset.pencilFallback='true';}}).finally(()=>clearTimeout(timer));
}
const profileName=()=>imageProfile(innerWidth,innerHeight,matchMedia('(pointer:coarse)').matches);
function setStage(id){
 if(root.dataset.stage===id)return;
 root.dataset.stage=id;phase.textContent=t(id==='strategy'?'Strategy — первый замысел':stageForFrame(state.frame).phase);
 document.querySelector('.camera-label').textContent=id==='final'?'FINAL / CAMERA PULLBACK':'ONE PERSPECTIVE';
 canvas.setAttribute('aria-label',t(id==='strategy'?'Архитектурный карандашный скетч Kagawa: открытая терраса, наружная лестница и два уровня башенки':'Строительство Kagawa: фасад, двор, свет в окнах и отдаление только в финале'));
 panels.forEach(panel=>{const visible=panel.dataset.panel===id;panel.classList.toggle('active',visible);panel.inert=!visible;panel.setAttribute('aria-hidden',String(!visible));});
}
function present(){
 if(!active)return;const stage=stageForFrame(state.frame),ready=loader?.nearest(state.frame,renderer.last,{min:stage.start,max:stage.end});if(!ready)return;
 renderer.draw(ready.image,ready.index);canvas.style.opacity=String(solidOpacity(state,ready.index));syncPoster();error.hidden=true;root.dataset.frame=String(ready.index);root.dataset.cached=String(loader.frames.size);root.dataset.profile=profile;root.dataset.encodedBytes=String(encoded?.bytes||0);
}
function setProfile(){
 const next=profileName();if(profile===next&&loader)return;loader?.close();encoded?.close();aborter?.abort();aborter=new AbortController();profile=next;const signal=aborter.signal;renderer.last=-1;requested=-1;
 const source=encoded=new EncodedFrames({count:manifest.count,byteLimit:next==='mobile'?5_000_000:8_000_000,load:(index,fetchSignal)=>fetchFrameBlob(new URL(manifest.profiles[next].frames[index].file,import.meta.url),fetchSignal)});
 loader=new FrameLoader({count:manifest.count,limit:next==='mobile'?16:12,decode:async(index,frameSignal)=>decodeBlob(await source.read(index,frameSignal),frameSignal),release:image=>{if(image.close)image.close();else image.src='';},onReady:present,onError:(_,index)=>{if(!signal.aborted&&index===state.frame&&state.stage!=='strategy'){if(renderer.last<0)modes.fail();else error.hidden=false;}}});
}
function update(value){
 if(!active)return;journeyProgress=Math.max(0,Math.min(1,Number(value)||0));const parts=splitProgress(journeyProgress);entryProgress=parts.entry;entry.update(entryProgress);state=storyState(parts.story);root.dataset.journey=journeyProgress.toFixed(5);slider.value=String(Math.round(state.progress*1000));root.dataset.progress=state.progress.toFixed(4);
 sketch.style.opacity=String(state.sketch);ensurePencil();drawPencil();
 canvas.style.opacity=String(solidOpacity(state,renderer.last));syncPoster();
 setStage(state.stage);frameOutput.value=state.stage==='strategy'?'01 / STRATEGY':`${String(state.frame+1).padStart(3,'0')} / 240`;
 if(entryProgress>=.25||state.preload){
  setProfile();
  if(requested!==state.frame){
   requested=state.frame;root.dataset.requestedFrame=String(requested);encoded.focus(state.frame);loader.request(state.frame);
   const stage=stageForFrame(state.frame);encoded.prefetch(stage.start,stage.end);
   if(state.frame>(stage.start+stage.end)/2&&stage.end<manifest.count-1){const next=stageForFrame(stage.end+1);encoded.prefetch(next.start,next.end);}
  }
  if(state.preload)present();
 }
 else {error.hidden=true;}
}
function deactivate(){
 active=false;timeline?.destroy();timeline=null;loader?.close();encoded?.close();aborter?.abort();loader=null;profile=null;requested=-1;
 pencilAborter?.abort();pencil?.release();pencil=null;pencilPromise=null;sketch.classList.remove('pencil-ready','pencil-loading','pencil-failed');
 canvas.width=canvas.height=1;renderer.key='';renderer.last=-1;
 entry.destroy();root.classList.remove('animated');controls.hidden=true;poster.style.visibility='';canvas.classList.remove('ready');canvas.style.opacity='0';sketch.style.opacity='0';error.hidden=true;
}
function activate(){
 if(active)return;if(!renderer.ctx)throw Error('Canvas unavailable');active=true;root.classList.remove('scene-failed','story-static');root.dataset.storyMode='animated';root.classList.add('animated');delete root.dataset.stage;entry.activate();controls.hidden=false;error.hidden=true;if(!pencil&&!pencilPromise)sketch.classList.add('pencil-loading');
 try{timeline=createScrollTimeline(experience,update);end=experience.offsetTop+experience.offsetHeight-innerHeight;update(Math.max(0,(scrollY-experience.offsetTop)/(end-experience.offsetTop)));measureLayout();}catch(reason){deactivate();throw reason;}
}
slider.addEventListener('input',()=>timeline?.go(joinStory(Number(slider.value)/1000)));
document.querySelectorAll('[data-seek]').forEach(button=>button.addEventListener('click',()=>timeline?.go(joinStory(button.dataset.seek==='strategy'?0:progressForFrame(Number(button.dataset.seek))))));
document.querySelector('.retry').addEventListener('click',()=>{if(!active){void modes.retry();return;}error.hidden=true;loader?.request(state.frame);});
addEventListener('resize',()=>{const saved=captureLocation({y:scrollY,...layoutSnapshot});cancelAnimationFrame(resizeRAF);resizeRAF=requestAnimationFrame(()=>{if(!active)return;if(loader)setProfile();entry.refresh();timeline.refresh();end=experience.offsetTop+experience.offsetHeight-innerHeight;measureLayout();const y=restoreLocation(saved,layoutSnapshot);if(saved.kind==='story')timeline.go(saved.progress);else{scrollTo({top:y,behavior:'instant'});update(Math.max(0,(y-experience.offsetTop)/(end-experience.offsetTop)));}});});
document.fonts?.ready.then(()=>{if(active)measureLayout();});
addEventListener('load',()=>{if(active)measureLayout();});
document.addEventListener('toggle',()=>{if(active)measureLayout();},true);
addEventListener('pagehide',()=>{loader?.close();encoded?.close();aborter?.abort();loader=null;profile=null;pencil?.release();});
addEventListener('pageshow',()=>{if(active){entry.refresh();timeline?.refresh();update(journeyProgress);}});
for(const link of document.querySelectorAll('a[href="#hero"],a[href="#top"]'))link.addEventListener('click',event=>{if(!active)return;event.preventDefault();const hero=link.hash==='#hero';timeline.go(hero?0:joinStory(.205));history.replaceState(history.state,'',link.hash);if(hero)entry.focusHero();});
function progressForStage(id){return id==='strategy'?joinStory(.205):joinStory(progressForFrame(stages.find(stage=>stage.id===id)?.end||0));}
function resumeLanguage(){const value=root.dataset.resumeJourney;if(value===undefined)return false;delete root.dataset.resumeJourney;if(active)timeline.go(Number(value));else{const parts=splitProgress(Number(value));const id=parts.entry<.5?'hero':`stage-${storyState(parts.story).stage}`;document.getElementById(id)?.scrollIntoView({block:'start',behavior:'instant'});}return true;}
document.addEventListener('cycle:resume-language',resumeLanguage);
function captureModeLocation(){
 const header=document.querySelector('.site-header').offsetHeight,box=experience.getBoundingClientRect();
 if(active&&scrollY>=experience.offsetTop&&scrollY<=experience.offsetTop+experience.offsetHeight-innerHeight+1){return entryProgress<.5?{kind:'hero',y:0}:{kind:'stage',id:state.stage};}
 if(!active&&box.top<=header&&box.bottom>header){const panel=panels.filter(panel=>panel.getBoundingClientRect().top<=header+1).at(-1)||panels[0];return {kind:'stage',id:panel.dataset.panel};}
 return captureLocation({y:scrollY,start:-1,end:-1,header,anchors:[{id:'hero',top:0},...sectionAnchors()]});
}
function restoreModeLocation(saved){
 if(!saved)return;
 if(saved.kind==='stage'){if(active)timeline.go(progressForStage(saved.id));else document.getElementById(`stage-${saved.id}`)?.scrollIntoView({block:'start',behavior:'instant'});}
 else if(saved.kind==='hero'){scrollTo({top:0,behavior:'instant'});if(active)timeline.go(0);}
 else{const y=restoreLocation(saved,{start:experience.offsetTop,end:experience.offsetTop+experience.offsetHeight-innerHeight,anchors:[{id:'hero',top:0},...sectionAnchors()]});scrollTo({top:y,behavior:'instant'});if(active)update((y-experience.offsetTop)/(experience.offsetHeight-innerHeight));}
}
const modes=createStoryMode({preference:matchMedia('(prefers-reduced-motion: reduce)'),
 loadManifest:async signal=>{const response=await fetch(manifestURL(import.meta.url),{signal});if(!response.ok)throw Error('Manifest unavailable');const data=await response.json();if(data.count!==240||!data.profiles?.[profileName()])throw Error('Invalid manifest');return data;},
 animate:data=>{manifest=data;activate();return deactivate;},
 still:reason=>{root.dataset.storyMode=reason;root.classList.add('story-static');root.classList.toggle('scene-failed',reason==='error');showStillStory(panels,{manifest,base:import.meta.url,frameRoot:root.dataset.frameRoot||'frames'});error.hidden=reason!=='error';if(reason==='error')error.querySelector('span').textContent=t('Не удалось загрузить анимацию. Все направления доступны ниже.');},
 capture:captureModeLocation,restore:restoreModeLocation
});
await modes.ready;
requestAnimationFrame(()=>{if(resumeLanguage())return;if(location.hash){if(active&&location.hash==='#hero')timeline.go(0);else if(active&&location.hash==='#top')timeline.go(joinStory(.205));else if(active&&location.hash.startsWith('#stage-'))timeline.go(progressForStage(location.hash.slice(7)));else document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start',behavior:'instant'});}});
