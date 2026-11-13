import {makeSchedule,locate,partialCurve} from './pencil-timeline.mjs';
export class PencilCanvas{
 constructor(canvas,data){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Pencil canvas unavailable');
  this.strokes=data.strokes;this.crop=data.crop;this.schedule=makeSchedule(this.strokes);
  this.base=document.createElement('canvas');this.baseCtx=this.base.getContext('2d');this.checkpoints=[];this.key='';this.completed=0;this.last=-1;
  this.marks=[Math.floor(this.strokes.length/3),Math.floor(this.strokes.length*2/3)];
 }
 resize(){
  const r=this.canvas.getBoundingClientRect(),budget=innerWidth<=700?350000:700000,dpr=Math.min(devicePixelRatio||1,1.5),scale=Math.min(dpr,Math.sqrt(budget/Math.max(1,r.width*r.height)));
  const w=Math.max(1,Math.round(r.width*scale)),h=Math.max(1,Math.round(r.height*scale)),key=w+'x'+h;if(key===this.key)return;
  this.key=key;this.canvas.width=this.base.width=w;this.canvas.height=this.base.height=h;this.checkpoints.forEach(c=>{c.image.width=c.image.height=1;});this.checkpoints=[];this.completed=0;this.last=-1;
  const ratio=Math.min(w/this.crop.width,h/this.crop.height);this.transform=[ratio,0,0,ratio,(w-this.crop.width*ratio)/2-this.crop.left*ratio,(h-this.crop.height*ratio)/2-this.crop.top*ratio];
 }
 stroke(ctx,s,t=1){const p=t===1?s:partialCurve(s,t);ctx.globalAlpha=s[6];ctx.lineWidth=s[7];ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.quadraticCurveTo(...p.slice(2,6));ctx.stroke();}
 setup(ctx){ctx.setTransform(...this.transform);ctx.strokeStyle='#514a3e';ctx.lineCap='round';}
 clear(ctx){ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
 draw(progress){
  const started=performance.now();this.resize();if(progress===this.last)return;
  const {index,t}=locate(this.schedule,progress);const b=this.baseCtx;
  if(index<this.completed){
   this.clear(b);const cached=this.checkpoints.filter(c=>c.index<=index).at(-1);
   if(cached)b.drawImage(cached.image,0,0);this.completed=cached?.index||0;
  }
  this.setup(b);
  for(let i=this.completed;i<index;i++){
   this.stroke(b,this.strokes[i]);
   if(this.marks.includes(i+1)&&!this.checkpoints.some(c=>c.index===i+1)){
    const image=document.createElement('canvas');image.width=this.canvas.width;image.height=this.canvas.height;image.getContext('2d').drawImage(this.base,0,0);this.checkpoints.push({index:i+1,image});this.checkpoints.sort((a,b)=>a.index-b.index);
   }
  }
  this.completed=index;this.clear(this.ctx);this.ctx.drawImage(this.base,0,0);this.setup(this.ctx);
  if(index<this.strokes.length&&t>0)this.stroke(this.ctx,this.strokes[index],t);
  this.last=progress;const ms=performance.now()-started;
  Object.assign(this.canvas.dataset,{draw:progress.toFixed(4),strokes:String(index),checkpoints:String(this.checkpoints.length),bufferBytes:String((2+this.checkpoints.length)*this.canvas.width*this.canvas.height*4),drawMs:ms.toFixed(2),maxDrawMs:Math.max(Number(this.canvas.dataset.maxDrawMs)||0,ms).toFixed(2)});
 }
 release(){this.checkpoints.forEach(c=>{c.image.width=c.image.height=1;});this.checkpoints=[];this.base.width=this.base.height=this.canvas.width=this.canvas.height=1;this.key='';this.last=-1;}
}
