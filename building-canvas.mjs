export class BuildingCanvas{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.key='';this.last=-1;}
 resize(){
  const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),scale=Math.min(dpr,Math.sqrt(1200000/Math.max(1,r.width*r.height)));
  const w=Math.max(1,Math.round(r.width*scale)),h=Math.max(1,Math.round(r.height*scale)),key=w+'x'+h;
  if(this.key===key)return false;this.key=key;this.canvas.width=w;this.canvas.height=h;this.last=-1;return true;
 }
 draw(image,index){
  if(!this.ctx)return;
  this.resize();if(this.last===index)return;const {width:w,height:h}=this.canvas;
  this.ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()||'#f7f6f3';this.ctx.fillRect(0,0,w,h);
  const ratio=Math.min(w/image.width,h/image.height),iw=image.width*ratio,ih=image.height*ratio;
  this.ctx.drawImage(image,(w-iw)/2,(h-ih)/2,iw,ih);this.last=index;this.canvas.classList.add('ready');
 }
}
export async function decodeFrame(url,signal){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000),abort=()=>controller.abort();
 signal.addEventListener('abort',abort,{once:true});if(signal.aborted)controller.abort();
 try{
  const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error(`Frame unavailable (${response.status})`);
  const blob=await response.blob();
  if(typeof createImageBitmap==='function')try{return await createImageBitmap(blob);}catch{/* Safari image decoder fallback. */}
  const objectURL=URL.createObjectURL(blob),image=new Image();
  try{image.src=objectURL;await image.decode();return image;}finally{URL.revokeObjectURL(objectURL);}
 }finally{clearTimeout(timeout);signal.removeEventListener('abort',abort);}
}
