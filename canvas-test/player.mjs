import {BuildingCanvas,fetchFrameBlob,decodeBlob} from './building-canvas.mjs';
import {FrameLoader} from './frame-loader.mjs';
import {EncodedFrames} from './encoded-frames.mjs';
const $=id=>document.getElementById(id);
const renderer=new BuildingCanvas($('canvas'));
let loader,encoded,requested=0,displayed=-1,tick=0,manifest,profile,prefetched=false;
const interactive=e=>e.target.closest('input,button,a,summary');
function diagnostics(){if(!loader)return;$('diagnostics').textContent=`${profile} · ${manifest.count} кадров\nКадр ${displayed+1} / ${manifest.count} · в памяти ${loader.frames.size}\nЗагружено в кеш ${(encoded.bytes/1e6).toFixed(2)} МБ / ${(manifest.profiles[profile].bytes/1e6).toFixed(2)} МБ`}
function present(){
 if(!renderer.ctx){$('status').textContent='Canvas недоступен в этом браузере. Сохранён контрольный кадр.';return;}
 const frame=loader?.nearest(requested,displayed);if(!frame)return;
 renderer.draw(frame.image,frame.index);displayed=frame.index;
 $('poster').hidden=true;$('status').textContent='Прокрутка управляет кадром';diagnostics();
 if(!prefetched){prefetched=true;encoded.prefetch(0,manifest.count-1);}
}
function progress(){const r=$('story').getBoundingClientRect();return Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)))}
function update(){tick=0;if(!manifest)return;const p=progress();requested=Math.round(p*(manifest.count-1));$('scrub').value=Math.round(p*1000);$('progress').textContent=`${String(Math.round(p*100)).padStart(2,'0')} / 100`;encoded.focus(requested);loader.request(requested);present();}
function schedule(){if(!tick)tick=requestAnimationFrame(update)}
function seek(p){const el=$('story'),top=scrollY+el.getBoundingClientRect().top;scrollTo({top:top+(el.offsetHeight-innerHeight)*p,behavior:'instant'});update();}
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',()=>{renderer.last=-1;schedule()},{passive:true});
$('scrub').addEventListener('input',e=>seek(Number(e.target.value)/1000));
$('background').addEventListener('click',()=>{const active=$('background').getAttribute('aria-pressed')!=='true';$('background').setAttribute('aria-pressed',active);document.documentElement.style.setProperty('--paper',active?'#d8e2d6':'#fff');renderer.last=-1;present();});
addEventListener('keydown',e=>{if(interactive(e)||$('story').getBoundingClientRect().bottom<innerHeight)return;if(e.key==='Home'){e.preventDefault();seek(0)}if(e.key==='End'){e.preventDefault();seek(1)}});
addEventListener('pagehide',()=>{loader?.close();encoded?.close()});
addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
try{
 const response=await fetch('manifest.json');if(!response.ok)throw Error('Manifest unavailable');manifest=await response.json();
 // Keep the same resource profile through phone rotation; do not discard caches.
 profile=matchMedia('(pointer:coarse)').matches||innerWidth<=700?'mobile':'desktop';
 encoded=new EncodedFrames({count:manifest.count,byteLimit:Math.max(6_000_000,manifest.profiles[profile].bytes+1024),concurrency:4,load:(i,signal)=>fetchFrameBlob(`${profile}/${String(i).padStart(3,'0')}.webp`,signal)});
 loader=new FrameLoader({count:manifest.count,limit:profile==='mobile'?16:12,concurrency:4,decode:async(i,signal)=>decodeBlob(await encoded.read(i,signal),signal),release:image=>image.close?.(),onReady:present,onError:()=>{$('status').textContent='Кадр не загрузился. Прокрутите ещё раз для повтора.'}});
 update();
}catch(error){$('status').textContent='Не удалось загрузить анимацию. Обновите страницу.';console.error(error)}
