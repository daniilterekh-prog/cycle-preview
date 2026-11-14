import {prepareAEPencil,layerDrawState} from './ae-pencil-timeline.mjs';
import {partialCurve} from './pencil-timeline.mjs';
// Native Canvas rendering of the actual editable AE paths and trim keyframes.
// Bounded backing surfaces replace a multi-megabyte raster sequence.
export class AEPencilCanvas{
 constructor(canvas,data){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas unavailable');
  this.data=prepareAEPencil(data);this.layers=this.data.layers.map(layer=>({...layer,base:document.createElement('canvas'),completed:0}));this.scratch=document.createElement('canvas');this.key='';this.last=-1;
 }
 resize(){
  const rect=this.canvas.getBoundingClientRect(),budget=innerWidth<=700?350000:700000,ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(budget/Math.max(1,rect.width*rect.height))),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio)),key=w+'x'+h;
  if(key===this.key)return;this.key=key;this.last=-1;this.canvas.width=w;this.canvas.height=h;this.scratch.width=w;this.scratch.height=h;
  for(const layer of this.layers){layer.base.width=w;layer.base.height=h;layer.completed=0;}
  const scale=Math.min(w/this.data.width,h/this.data.height);this.transform=[scale,0,0,scale,(w-this.data.width*scale)/2,(h-this.data.height*scale)/2];
 }
 setup(ctx){ctx.setTransform(...this.transform);ctx.lineCap='round';ctx.strokeStyle='#33302b';}
 clear(ctx){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
 stroke(ctx,path,t=1){const p=t===1?path:partialCurve(path,t);ctx.globalAlpha=path[6];ctx.lineWidth=path[7];ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.quadraticCurveTo(...p.slice(2,6));ctx.stroke();}
 draw(progress){
  this.resize();const p=Math.max(0,Math.min(1,Number(progress)||0));if(p===this.last)return;const started=performance.now(),time=p*this.data.sampleEnd;this.clear(this.ctx);let strokes=0;
  for(const layer of [...this.layers].reverse()){
   const state=layerDrawState(layer,time),base=layer.base.getContext('2d');
   if(state.count<layer.completed){this.clear(base);layer.completed=0;}
   this.setup(base);for(let i=layer.completed;i<state.count;i++)this.stroke(base,layer.strokes[i]);layer.completed=state.count;
   const scratch=this.scratch.getContext('2d');this.clear(scratch);scratch.drawImage(layer.base,0,0);this.setup(scratch);
   if(state.partial?.t>0)this.stroke(scratch,layer.strokes[state.count],state.partial.t);
   this.ctx.globalAlpha=state.opacity;this.ctx.drawImage(this.scratch,0,0);strokes+=state.count;
  }
  this.ctx.globalAlpha=1;this.last=p;Object.assign(this.canvas.dataset,{source:'after-effects',draw:p.toFixed(4),strokes:String(strokes),bufferBytes:String((this.layers.length+2)*this.canvas.width*this.canvas.height*4),drawMs:(performance.now()-started).toFixed(2)});
 }
 release(){for(const layer of this.layers){layer.base.width=layer.base.height=1;layer.completed=0;}this.scratch.width=this.scratch.height=this.canvas.width=this.canvas.height=1;this.key='';this.last=-1;}
}
