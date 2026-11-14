import {FrameLoader} from './frame-loader.mjs';
import {BuildingCanvas,decodeFrame} from './building-canvas.mjs';
import {createScrollTimeline} from './scroll-timeline.mjs';
import {stageForFrame} from './stages.mjs';
const root=document.documentElement,experience=document.querySelector('.experience'),canvas=document.querySelector('canvas'),poster=document.querySelector('.poster'),controls=document.querySelector('.controls'),slider=document.querySelector('#scrubber'),frameOutput=document.querySelector('#frame'),phase=document.querySelector('.phase'),error=document.querySelector('.error'),enable=document.querySelector('.enable');
const renderer=new BuildingCanvas(canvas),reduce=matchMedia('(prefers-reduced-motion:reduce)'),shortLandscape=matchMedia('(orientation:landscape) and (max-height:450px)');
let manifest,loader,aborter,timeline,profile,active=false,override=false,desired=0,requested=-1,progress=0,resizeRAF=0,end=0;
const profileName=()=>innerWidth<=700?'mobile':'desktop';
const clamp=n=>Math.max(0,Math.min(1,n));
const panels=[...document.querySelectorAll('[data-panel]')];let shownStage='branding';
function setStage(index){
 const stage=stageForFrame(index);phase.textContent=stage.phase;document.querySelector(".camera-label").textContent=stage.id==="final"?"FINAL / CAMERA PULLBACK":"FIXED CAMERA";
 if(stage.id===shownStage)return;shownStage=stage.id;root.dataset.stage=stage.id;
 panels.forEach(panel=>{const visible=panel.dataset.panel===stage.id;panel.classList.toggle('active',visible);panel.inert=!visible;panel.setAttribute('aria-hidden',String(!visible));});
}
function present(){
 if(!active)return;
 const image=loader?.frames.get(desired);if(!image)return;
 renderer.draw(image,desired);poster.style.visibility='hidden';error.hidden=true;
 root.dataset.frame=String(desired);root.dataset.cached=String(loader.frames.size);root.dataset.profile=profile;
 frameOutput.value=`${String(desired+1).padStart(3,'0')} / ${manifest.count}`;
 setStage(desired);
}
function setProfile(){
 const next=profileName();if(profile===next&&loader)return;
 loader?.close();aborter?.abort();aborter=new AbortController();profile=next;
 const signal=aborter.signal;renderer.last=-1;requested=-1;
 loader=new FrameLoader({count:manifest.count,limit:next==='mobile'?7:5,
  decode:index=>decodeFrame(manifest.profiles[next].frames[index].file,signal),
  release:image=>{if(image.close)image.close();else image.src='';},onReady:present,
  onError:(_,index)=>{if(!signal.aborted&&index===desired)error.hidden=false;}
 });
}
function update(value){
 if(!active)return;progress=clamp(value);desired=Math.round(progress*(manifest.count-1));slider.value=String(desired);
 if(requested!==desired){requested=desired;loader.request(desired);}
 present();
}
function deactivate(){
 active=false;timeline?.destroy();timeline=null;loader?.close();aborter?.abort();loader=null;profile=null;requested=-1;
 root.classList.remove('animated');controls.hidden=true;poster.style.visibility='';canvas.classList.remove('ready');error.hidden=true;setStage(0);
}
function activate(){
 enable.hidden=!(reduce.matches&&!override)||shortLandscape.matches;
 if((reduce.matches&&!override)||shortLandscape.matches){deactivate();return;}
 if(active)return;
 active=true;root.classList.add('animated');controls.hidden=false;setProfile();
 try{timeline=createScrollTimeline(experience,update);end=experience.offsetTop+experience.offsetHeight-innerHeight;update(clamp((scrollY-experience.offsetTop)/(end-experience.offsetTop)));}
 catch{deactivate();}
}
function seek(index){timeline?.go(index/(manifest.count-1));}
slider.addEventListener('input',()=>seek(Number(slider.value)));
document.querySelectorAll('[data-seek]').forEach(button=>button.addEventListener('click',()=>seek(Number(button.dataset.seek))));
document.querySelector('.retry').addEventListener('click',()=>{error.hidden=true;loader?.request(desired);});
enable.addEventListener('click',()=>{override=true;activate();seek(0);});
reduce.addEventListener('change',()=>{override=false;activate();});shortLandscape.addEventListener('change',activate);
addEventListener('resize',()=>{
 const saved=scrollY>=experience.offsetTop-1&&scrollY<=end+1?progress:null;
 cancelAnimationFrame(resizeRAF);resizeRAF=requestAnimationFrame(()=>{
  if(!active)return;setProfile();timeline.refresh();end=experience.offsetTop+experience.offsetHeight-innerHeight;
  if(saved!==null)timeline.go(saved);else update(progress);
 });
});
addEventListener('pagehide',()=>{loader?.close();aborter?.abort();loader=null;profile=null;});
addEventListener('pageshow',()=>{if(active){setProfile();timeline?.refresh();update(progress);}});
try{
 const response=await fetch('sequence.json');if(!response.ok)throw Error('Manifest unavailable');manifest=await response.json();
 if(manifest.count!==240||!manifest.profiles[profileName()])throw Error('Invalid manifest');activate();
}catch{deactivate();error.hidden=false;error.querySelector('span').textContent='Анимация недоступна. Ключевые состояния доступны ниже.';document.querySelector('.retry').hidden=true;}
