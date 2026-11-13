import {splitProgress,joinStory,entryVisuals} from './entry-timing.mjs';
import {createEntryTransition} from './entry-transition.mjs';
import {FrameLoader} from './frame-loader.mjs';
import {BuildingCanvas,decodeFrame} from './building-canvas.mjs';
import {createScrollTimeline} from './scroll-timeline.mjs';
import {stageForFrame} from './stages.mjs';
import {storyState,progressForFrame,solidOpacity} from './intro-timeline.mjs';
import {PencilCanvas} from './pencil-canvas.mjs';
const root=document.documentElement,experience=document.querySelector('.experience'),canvas=document.querySelector('canvas'),poster=document.querySelector('.poster'),sketch=document.querySelector('.sketch-layer'),controls=document.querySelector('.controls'),slider=document.querySelector('#scrubber'),frameOutput=document.querySelector('#frame'),phase=document.querySelector('.phase'),error=document.querySelector('.error'),enable=document.querySelector('.enable');
const renderer=new BuildingCanvas(canvas),reduce=matchMedia('(prefers-reduced-motion:reduce)'),shortLandscape=matchMedia('(orientation:landscape) and (max-height:450px)');
const panels=[...document.querySelectorAll('[data-panel]')];
let manifest,loader,aborter,timeline,profile,active=false,override=false,requested=-1,state=storyState(0),resizeRAF=0,end=0;
let pencil,pencilPromise,journeyProgress=0,entryProgress=0;
const entry=createEntryTransition();
function drawPencil(){if(active&&pencil&&state.sketch>0)pencil.draw(Math.max(state.draw,entryVisuals(entryProgress).ink));}
function ensurePencil(){
 if(pencilPromise||entryProgress<.25||state.sketch<=0||experience.getBoundingClientRect().top>=innerHeight)return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 pencilPromise=fetch('pencil.json',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('Pencil unavailable');return response.json();}).then(data=>{
  pencil=new PencilCanvas(document.querySelector('.pencil-canvas'),data);drawPencil();sketch.classList.remove('pencil-loading');sketch.classList.add('pencil-ready');
 }).catch(()=>{sketch.classList.remove('pencil-loading');sketch.classList.add('pencil-failed');root.dataset.pencilFallback='true';}).finally(()=>clearTimeout(timer));
}
const profileName=()=>innerWidth<=700?'mobile':'desktop';
function setStage(id){
 root.dataset.stage=id;phase.textContent=id==='strategy'?'Strategy — первый замысел':stageForFrame(state.frame).phase;
 document.querySelector('.camera-label').textContent=id==='final'?'FINAL / CAMERA PULLBACK':'ONE PERSPECTIVE';
 canvas.setAttribute('aria-label',id==='strategy'?'Архитектурный карандашный скетч Kagawa: открытая терраса, наружная лестница и два уровня башенки':'Строительство Kagawa: фасад, двор, свет в окнах и отдаление только в финале');
 panels.forEach(panel=>{const visible=panel.dataset.panel===id;panel.classList.toggle('active',visible);panel.inert=!visible;panel.setAttribute('aria-hidden',String(!visible));});
}
function present(){
 if(!active)return;const image=loader?.frames.get(state.frame);if(!image)return;
 renderer.draw(image,state.frame);canvas.style.opacity=String(solidOpacity(state,state.frame));error.hidden=true;root.dataset.frame=String(state.frame);root.dataset.cached=String(loader.frames.size);root.dataset.profile=profile;
}
function setProfile(){
 const next=profileName();if(profile===next&&loader)return;loader?.close();aborter?.abort();aborter=new AbortController();profile=next;const signal=aborter.signal;renderer.last=-1;requested=-1;
 loader=new FrameLoader({count:manifest.count,limit:next==='mobile'?7:5,decode:index=>decodeFrame(manifest.profiles[next].frames[index].file,signal),release:image=>{if(image.close)image.close();else image.src='';},onReady:present,onError:(_,index)=>{if(!signal.aborted&&index===state.frame&&state.stage!=='strategy')error.hidden=false;}});
}
function update(value){
 if(!active)return;journeyProgress=Math.max(0,Math.min(1,Number(value)||0));const parts=splitProgress(journeyProgress);entryProgress=parts.entry;entry.update(entryProgress);state=storyState(parts.story);root.dataset.journey=journeyProgress.toFixed(5);slider.value=String(Math.round(state.progress*1000));root.dataset.progress=state.progress.toFixed(4);
 sketch.style.opacity=String(state.sketch);ensurePencil();drawPencil();
 canvas.style.opacity=String(solidOpacity(state,renderer.last));poster.style.visibility='hidden';
 setStage(state.stage);frameOutput.value=state.stage==='strategy'?'01 / STRATEGY':`${String(state.frame+1).padStart(3,'0')} / 240`;
 if(state.preload){setProfile();if(requested!==state.frame){requested=state.frame;loader.request(state.frame);}present();}
 else {error.hidden=true;}
}
function deactivate(){
 active=false;timeline?.destroy();timeline=null;loader?.close();aborter?.abort();loader=null;profile=null;requested=-1;
 entry.destroy();root.classList.remove('animated');controls.hidden=true;poster.style.visibility='';canvas.classList.remove('ready');canvas.style.opacity='0';sketch.style.opacity='0';error.hidden=true;setStage('strategy');
}
function activate(){
 enable.hidden=!(reduce.matches&&!override)||shortLandscape.matches;
 if((reduce.matches&&!override)||shortLandscape.matches){deactivate();return;}
 if(active)return;active=true;root.classList.add('animated');entry.activate();controls.hidden=false;if(!pencil&&!pencilPromise)sketch.classList.add('pencil-loading');
 try{timeline=createScrollTimeline(experience,update);end=experience.offsetTop+experience.offsetHeight-innerHeight;update(Math.max(0,(scrollY-experience.offsetTop)/(end-experience.offsetTop)));}catch{deactivate();}
}
slider.addEventListener('input',()=>timeline?.go(joinStory(Number(slider.value)/1000)));
document.querySelectorAll('[data-seek]').forEach(button=>button.addEventListener('click',()=>timeline?.go(joinStory(button.dataset.seek==='strategy'?0:progressForFrame(Number(button.dataset.seek))))));
document.querySelector('.retry').addEventListener('click',()=>{error.hidden=true;loader?.request(state.frame);});
enable.addEventListener('click',()=>{override=true;activate();timeline?.go(0);});
reduce.addEventListener('change',()=>{override=false;activate();});shortLandscape.addEventListener('change',activate);
addEventListener('resize',()=>{const saved=scrollY>=experience.offsetTop-1&&scrollY<=end+1?journeyProgress:null,requestedY=scrollY;cancelAnimationFrame(resizeRAF);resizeRAF=requestAnimationFrame(()=>{if(!active)return;if(loader)setProfile();entry.refresh();timeline.refresh();end=experience.offsetTop+experience.offsetHeight-innerHeight;if(saved!==null&&Math.abs(scrollY-requestedY)<2)timeline.go(saved);else update(Math.max(0,(scrollY-experience.offsetTop)/(end-experience.offsetTop)));});});
addEventListener('pagehide',()=>{loader?.close();aborter?.abort();loader=null;profile=null;pencil?.release();});
addEventListener('pageshow',()=>{if(active){entry.refresh();timeline?.refresh();update(journeyProgress);}});
for(const link of document.querySelectorAll('a[href="#hero"],.site-header a[href="#top"]'))link.addEventListener('click',event=>{if(!active)return;event.preventDefault();const hero=link.hash==='#hero';timeline.go(hero?0:joinStory(0));history.replaceState(history.state,'',link.hash);if(hero)entry.focusHero();});
try{const response=await fetch('sequence.json');if(!response.ok)throw Error('Manifest unavailable');manifest=await response.json();if(manifest.count!==240||!manifest.profiles[profileName()])throw Error('Invalid manifest');activate();if(active&&location.hash){requestAnimationFrame(()=>{if(location.hash==='#hero')timeline.go(0);else if(location.hash==='#top')timeline.go(joinStory(0));else {const target=document.getElementById(location.hash.slice(1));if(target)target.scrollIntoView({block:'start',behavior:'instant'});}});}}
catch{deactivate();error.hidden=false;error.querySelector('span').textContent='Анимация недоступна. Скетч и ключевые состояния доступны ниже.';document.querySelector('.retry').hidden=true;}
