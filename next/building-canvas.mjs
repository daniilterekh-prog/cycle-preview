// The reference finale settles lower and retains more architectural detail.
export function framePlacement(w,h,iw,ih,index){
 const t=Math.max(0,Math.min(1,(index-191)/48)),ease=t*t*t*(t*(t*6-15)+10);
 const base=Math.min(w/iw,h/ih),ratio=base*(1+.15*ease);
 return {ratio,x:(w-iw*ratio)/2,y:(h-ih*ratio)/2+ih*base*.12*ease};
}
export class BuildingCanvas{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.key='';this.last=-1;}
 resize(){
  const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),scale=Math.min(dpr,Math.sqrt(1200000/Math.max(1,r.width*r.height)));
  const w=Math.max(1,Math.round(r.width*scale)),h=Math.max(1,Math.round(r.height*scale)),key=w+'x'+h;
  if(this.key===key)return false;this.key=key;this.canvas.width=w;this.canvas.height=h;this.last=-1;return true;
 }
 draw(image,index){
  if(!this.ctx)return;
  this.resize();if(this.last===index)return;const {width:w,height:h}=this.canvas;
  this.ctx.clearRect(0,0,w,h);this.ctx.imageSmoothingEnabled=true;this.ctx.imageSmoothingQuality='high';
  const {ratio,x,y}=framePlacement(w,h,image.width,image.height,index),iw=image.width*ratio,ih=image.height*ratio;
  this.ctx.drawImage(image,x,y,iw,ih);this.last=index;this.canvas.classList.add('ready');
 }
}
export async function fetchFrameBlob(url,signal){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000),abort=()=>controller.abort();
 signal.addEventListener('abort',abort,{once:true});if(signal.aborted)controller.abort();
 try{
  const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error(`Frame unavailable (${response.status})`);
  return await response.blob();
 }finally{clearTimeout(timeout);signal.removeEventListener('abort',abort);}
}
export async function decodeBlob(blob,signal){
 if(signal.aborted)throw new DOMException('Cancelled','AbortError');
 if(typeof createImageBitmap==='function'){
  let bitmap;try{bitmap=await createImageBitmap(blob);}catch{/* Safari decoder fallback. */}
  if(bitmap){if(signal.aborted){bitmap.close();throw new DOMException('Cancelled','AbortError');}return bitmap;}
 }
 const objectURL=URL.createObjectURL(blob),image=new Image();
 try{image.src=objectURL;await image.decode();if(signal.aborted){image.src='';throw new DOMException('Cancelled','AbortError');}return image;}finally{URL.revokeObjectURL(objectURL);}
}
export async function decodeFrame(url,signal){return decodeBlob(await fetchFrameBlob(url,signal),signal);}
