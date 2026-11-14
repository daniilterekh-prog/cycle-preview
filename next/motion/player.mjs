import {BuildingCanvas,fetchFrameBlob,decodeBlob} from './building-canvas.mjs';
import {FrameLoader} from './frame-loader.mjs';
import {EncodedFrames} from './encoded-frames.mjs';
const $=id=>document.getElementById(id),root=document.documentElement,renderer=new BuildingCanvas($('canvas')),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let loader,encoded,manifest,profile,requested=0,displayed=-1,tick=0,prefetched=false,requestAt=0,exactLatency=0,maxDrawMs=0,painted=new Set(),layout;
function measure(){layout={start:scrollY+$('story').getBoundingClientRect().top,end:scrollY+$('story').getBoundingClientRect().bottom-innerHeight,footer:scrollY+$('review-end').getBoundingClientRect().top};}
function diagnostics(){if(!loader)return;const p=manifest.profiles[profile];$('diagnostics').textContent=`V4 ${manifest.segment} / ${manifest.signature.slice(0,12)}\n${profile} · ${p.width} × ${p.height} · ${manifest.count} кадров\nВесь профиль: ${(p.bytes/1e6).toFixed(2)} МБ; кеш сжатых: ${(encoded.bytes/1e6).toFixed(2)} МБ\nДекодировано: ${loader.frames.size} / ${loader.limit}; RGBA около ${(loader.frames.size*p.width*p.height*4/1e6).toFixed(1)} МБ\nПоказано разных состояний: ${painted.size} / ${manifest.count}\nПоследний точный кадр после запроса: ${exactLatency.toFixed(1)} мс\nМаксимальное время Canvas draw: ${maxDrawMs.toFixed(1)} мс`;}
function present(){
 if(!loader)return;const frame=loader.nearest(requested,displayed);if(!frame)return;
 const before=performance.now();renderer.draw(frame.image,frame.index);maxDrawMs=Math.max(maxDrawMs,performance.now()-before);
 displayed=frame.index;painted.add(displayed);if(displayed===requested&&requestAt){exactLatency=performance.now()-requestAt;requestAt=0;}
 $('poster').hidden=true;$('status').textContent='Прокручивайте или выбирайте состояние на шкале.';root.dataset.frame=String(manifest.start+displayed);diagnostics();
 if(!prefetched){prefetched=true;encoded.prefetch(0,manifest.count-1);}
}
function request(index){
 if(!loader)return;const next=Math.max(0,Math.min(manifest.count-1,Math.round(index)));
 if(next!==requested||!loader.wanted.length){requested=next;requestAt=performance.now();encoded.focus(requested);loader.request(requested);}
 $('scrub').value=String(requested);$('progress').value=`${manifest.start+requested} / ${manifest.end}`;present();
}
function update(){tick=0;if(!manifest||!loader||reduced.matches)return;const r=$('story').getBoundingClientRect();request(-r.top/Math.max(1,r.height-innerHeight)*(manifest.count-1));}
function schedule(){if(!tick)tick=requestAnimationFrame(update);}
function openBuffers(){
 if(loader)return;const p=manifest.profiles[profile];prefetched=false;
 encoded=new EncodedFrames({count:manifest.count,byteLimit:p.bytes+1024,concurrency:4,load:(i,signal)=>fetchFrameBlob(new URL(p.frames[i].file,import.meta.url),signal)});
 loader=new FrameLoader({count:manifest.count,limit:12,concurrency:4,decode:async(i,signal)=>decodeBlob(await encoded.read(i,signal),signal),release:image=>{if(image.close)image.close();else image.src='';},onReady:present,onError:()=>{$('status').textContent='Сохранили последний кадр. Измените положение шкалы, чтобы повторить загрузку.';}});
}
function closeBuffers(){loader?.close();encoded?.close();loader=null;encoded=null;}
function seek(index){if(!manifest)return;if(!reduced.matches){const r=$('story').getBoundingClientRect(),start=scrollY+r.top;scrollTo({top:start+Math.max(0,r.height-innerHeight)*index/(manifest.count-1),behavior:'instant'});}request(index);}
$('scrub').addEventListener('input',event=>seek(Number(event.target.value)));
$('background').addEventListener('click',()=>{const active=$('background').getAttribute('aria-pressed')!=='true';$('background').setAttribute('aria-pressed',String(active));root.style.setProperty('--paper',active?'#d8e2d6':'#fff');renderer.last=-1;present();});
addEventListener('scroll',()=>{schedule();measure();},{passive:true});
addEventListener('resize',()=>{if(!layout||!manifest)return;const inStory=scrollY>=layout.start&&scrollY<=layout.end,footerOffset=scrollY-layout.footer;measure();renderer.last=-1;if(inStory&&!reduced.matches)seek(requested);else if(footerOffset>=-80)scrollTo({top:layout.footer+footerOffset,behavior:'instant'});present();},{passive:true});
reduced.addEventListener('change',()=>{measure();if(reduced.matches)request(requested);else seek(requested);});
addEventListener('pagehide',closeBuffers);
addEventListener('pageshow',event=>{if(event.persisted&&manifest){openBuffers();request(requested);measure();}});
try{
 const response=await fetch(new URL('manifest.json',import.meta.url));if(!response.ok)throw Error('Manifest unavailable');manifest=await response.json();if(manifest.count!==16||!renderer.ctx)throw Error('Control player unavailable');
 profile=matchMedia('(pointer:coarse)').matches||innerWidth<=700?'mobile':'desktop';root.dataset.profile=profile;root.dataset.signature=manifest.signature;
 openBuffers();measure();request(0);update();
}catch{$('status').textContent='Не удалось запустить контроль движения. Сохранён первый кадр.';closeBuffers();}
