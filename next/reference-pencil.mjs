import {AEPencilCanvas} from './ae-pencil-canvas.mjs';
import {fetchFrameBlob,decodeBlob} from './building-canvas.mjs?v=reference-fit-v3';

// The approved artwork is revealed by editable, exported AE trim paths.
// Masking changes visibility only: no extra hatching is painted on the image.
export class ReferencePencilCanvas{
 constructor(canvas,data,image){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas unavailable');
  this.image=image;this.maskCanvas=document.createElement('canvas');this.artCanvas=document.createElement('canvas');
  this.maskCanvas.getBoundingClientRect=()=>canvas.getBoundingClientRect();
  this.mask=new AEPencilCanvas(this.maskCanvas,data);this.last=-1;this.key='';
 }
 draw(progress){
  const p=Math.max(0,Math.min(1,Number(progress)||0));this.mask.pixelLimit=(innerWidth<=700?2800000:5600000)/(this.mask.layers.length+4);this.mask.draw(p);
  const {width:w,height:h}=this.maskCanvas,key=w+'x'+h;
  if(key===this.key&&p===this.last)return;
  if(key!==this.key){
   this.canvas.width=w;this.canvas.height=h;this.artCanvas.width=w;this.artCanvas.height=h;this.key=key;
   const art=this.artCanvas.getContext('2d');art.imageSmoothingQuality='high';art.setTransform(...this.mask.transform);art.drawImage(this.image,100,85,830,660);
  }
  const ctx=this.ctx;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);
  if(p>0){
   ctx.drawImage(this.artCanvas,0,0);
   if(p<1){ctx.globalCompositeOperation='destination-in';ctx.drawImage(this.maskCanvas,0,0);ctx.globalCompositeOperation='source-over';}
  }
  this.last=p;Object.assign(this.canvas.dataset,{source:'approved-reference-ae-mask',draw:p.toFixed(4),strokes:this.maskCanvas.dataset.strokes,bufferBytes:String(Number(this.maskCanvas.dataset.bufferBytes)+w*h*8)});
 }
 release(){this.mask.release();this.image.close?.();this.canvas.width=this.canvas.height=this.artCanvas.width=this.artCanvas.height=1;this.key='';this.last=-1;}
}
export async function loadReferencePencil(canvas,{base,signal}){
 const readMask=async()=>{
  if(globalThis.DecompressionStream)try{
   const r=await fetch(new URL('assets/sketch/reveal-v4.json.gz',base),{signal});if(!r.ok)throw Error('Compressed mask unavailable');
   return await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
  }catch(error){if(signal.aborted)throw error;}
  const r=await fetch(new URL('assets/sketch/reveal-v4.json',base),{signal});if(!r.ok)throw Error('Reference mask unavailable');return r.json();
 };
 const [data,blob]=await Promise.all([
  readMask(),
  fetchFrameBlob(new URL('assets/sketch/reference-v4.webp',base),signal)
 ]);
 const image=await decodeBlob(blob,signal);
 try{return new ReferencePencilCanvas(canvas,data,image);}catch(error){image.close?.();throw error;}
}
