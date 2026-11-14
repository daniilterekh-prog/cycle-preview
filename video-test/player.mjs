import {direction,TransitionState} from './state.mjs';
import {alphaRenderer} from './alpha.mjs';
const $=s=>document.querySelector(s),scene=$('#scene'),poster=$('#poster'),canvas=$('#canvas'),format=$('#format'),next=$('#next'),back=$('#back'),status=$('#status'),loading=$('#loading');
const videos=[$('#forward'),$('#reverse')],state=new TransitionState();
let renderer=null,active=null,token=0,timer=null,frameHandle=null,frameVideo=null,frames=0,startedAt=0;
try{renderer=alphaRenderer(canvas);}catch{format.value='white';status.textContent='Совмещение прозрачности недоступно; включён просмотр на белом фоне.';}
function stopFrames(){if(frameHandle!==null){if(frameVideo?.cancelVideoFrameCallback)frameVideo.cancelVideoFrameCallback(frameHandle);else cancelAnimationFrame(frameHandle);}frameHandle=null;frameVideo=null;}
function resetVisual(){stopFrames();for(const v of videos){v.pause();v.classList.remove('visible');}canvas.classList.remove('visible');poster.src=state.stage?'warm.webp':'cold.webp';poster.classList.remove('hidden');}
function configure(){resetVisual();for(let i=0;i<2;i++){videos[i].src=(i?'reverse':'forward')+(format.value==='packed'?'-packed.mp4':format.value==='white'?'-white.mp4':'.webm');videos[i].muted=true;}update();}
function update(){next.disabled=state.busy||state.stage===1;back.disabled=state.busy||state.stage===0;format.disabled=state.busy;$('#chapter').textContent=state.stage?'02 / ОБЛИЦОВКА':'01 / КОНСТРУКЦИЯ';}
function fail(message){token++;clearTimeout(timer);state.fail();resetVisual();active=null;loading.hidden=true;$('#resume').hidden=true;status.textContent=message;update();}
function drawLoop(v,id){if(id!==token||!state.busy||document.hidden)return;try{if(v.readyState>=2){if(format.value==='packed'){renderer.draw(v);canvas.classList.add('visible');}else v.classList.add('visible');poster.classList.add('hidden');loading.hidden=true;frames++;}}catch{fail('Не удалось показать видео. Выберите другой формат и повторите.');return;}frameVideo=v;frameHandle=v.requestVideoFrameCallback?v.requestVideoFrameCallback(()=>drawLoop(v,id)):requestAnimationFrame(()=>drawLoop(v,id));}
async function play(dir){if(!state.begin(dir))return;update();const id=++token;active=dir===1?videos[0]:videos[1];frames=0;startedAt=performance.now();loading.hidden=false;status.textContent='Переход…';resetVisual();active.currentTime=0;
 timer=setTimeout(()=>fail('Загрузка задержалась. Повторите переход.'),15000);
 frameVideo=active;frameHandle=active.requestVideoFrameCallback?active.requestVideoFrameCallback(()=>drawLoop(active,id)):requestAnimationFrame(()=>drawLoop(active,id));
 try{await active.play();if(id!==token)return;}catch{if(id===token)fail('Браузер не запустил видео. Нажмите кнопку перехода ещё раз.');}
}
for(const v of videos){v.addEventListener('ended',()=>{if(v!==active||!state.busy)return;clearTimeout(timer);if(format.value==='packed')renderer.draw(v);stopFrames();state.finish();update();loading.hidden=true;status.textContent=state.stage?'Облицовка завершена':'Исходное состояние';const q=v.getVideoPlaybackQuality?.();$('#diagnostics').textContent=JSON.stringify({format:format.value,stage:state.stage,duration:v.duration,elapsedSeconds:+((performance.now()-startedAt)/1000).toFixed(2),displayCallbacks:frames,decodedFrames:q?.totalVideoFrames,droppedFrames:q?.droppedVideoFrames,viewport:[innerWidth,innerHeight]},null,2);});v.addEventListener('error',()=>{if(active===v&&state.busy)fail('Видео не загрузилось. Повторите переход или смените формат.');});}
next.onclick=()=>play(1);back.onclick=()=>play(-1);format.onchange=()=>{token++;configure();status.textContent='Формат изменён. Готово к переходу.';};
$('#background').onclick=()=>{$('#background').setAttribute('aria-pressed',String(scene.classList.toggle('tinted')));};
scene.addEventListener('keydown',e=>{if(e.target!==scene)return;if(['ArrowDown','ArrowUp'].includes(e.key)){const dir=e.key==='ArrowDown'?1:-1;if(state.busy||(dir===1?state.stage===0:state.stage===1)){e.preventDefault();play(dir);}}});
let touch=null;
scene.addEventListener('touchstart',e=>{touch=e.touches.length===1?{id:e.touches[0].identifier,x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
scene.addEventListener('touchmove',e=>{if(!touch||e.touches.length!==1){touch=null;return;}const t=e.touches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y,dir=dy<0?1:-1;if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)*1.3&&(state.busy||(dir===1?state.stage===0:state.stage===1)))e.preventDefault();},{passive:false});
scene.addEventListener('touchend',e=>{if(!touch)return;const t=[...e.changedTouches].find(t=>t.identifier===touch.id),start=touch;touch=null;if(t){const dir=direction(t.clientX-start.x,t.clientY-start.y);if(dir)play(dir);}},{passive:true});
scene.addEventListener('touchcancel',()=>touch=null,{passive:true});
let wheel=0,wheelTimer,consumed=false;
scene.addEventListener('wheel',e=>{if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{wheel=0;consumed=false;},220);const dir=e.deltaY>0?1:-1;if(state.busy||consumed||(dir===1?state.stage===0:state.stage===1)){e.preventDefault();if(state.busy||consumed)return;wheel+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);if(Math.abs(wheel)>=40){consumed=true;play(wheel>0?1:-1);}}},{passive:false});
document.addEventListener('visibilitychange',()=>{if(!state.busy||!active)return;if(document.hidden){clearTimeout(timer);active.pause();stopFrames();status.textContent='Переход приостановлен';}else resume();});
async function resume(){if(!state.busy||!active)return;try{await active.play();drawLoop(active,token);timer=setTimeout(()=>fail('Воспроизведение прервано. Повторите переход.'),15000);$('#resume').hidden=true;}catch{$('#resume').hidden=false;status.textContent='Нажмите «Продолжить»';}}
$('#resume').onclick=resume;
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('Графический контекст потерян. Выберите MP4 на белом фоне.');});
configure();
