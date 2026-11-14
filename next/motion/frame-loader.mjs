// Bounded decoded buffer, biased toward the user's current direction.
export class FrameLoader{
 constructor({count,limit=12,concurrency=4,decode,release=()=>{},onReady=()=>{},onError=()=>{}}){
  Object.assign(this,{count,limit:Math.max(1,limit),concurrency,decode,release,onReady,onError});
  this.frames=new Map();this.pending=new Map();this.failed=new Set();this.wanted=[];this.closed=false;this.current=-1;this.direction=1;
 }
 request(index){
  if(this.closed)return;
  this.failed.clear();
  const n=Math.max(0,Math.min(this.count-1,Math.round(index)));
  if(this.current>=0&&n!==this.current)this.direction=Math.sign(n-this.current);this.current=n;
  this.wanted=[n];const ahead=Math.ceil((this.limit-1)*.8);
  const add=i=>{if(i>=0&&i<this.count&&this.wanted.length<this.limit&&!this.wanted.includes(i))this.wanted.push(i);};
  for(let d=1;d<=ahead;d++)add(n+d*this.direction);
  for(let d=1;d<this.limit;d++)add(n-d*this.direction);
  for(let d=ahead+1;d<this.limit;d++)add(n+d*this.direction);
  for(const [i,img] of this.frames)if(!this.wanted.includes(i)){this.frames.delete(i);this.release(img);}
  for(const [i,controller] of this.pending)if(!this.wanted.includes(i))controller.abort();
  this.pump();
 }
 nearest(index,displayed=-1,{min=0,max=this.count-1}={}){
  if(this.frames.has(index))return {index,image:this.frames.get(index)};
  let best=null;
  for(const [i,image] of this.frames){
   if(i<min||i>max||Math.abs(i-index)>this.limit)continue;
   if(this.direction>0&&(i>index||(displayed<=index&&i<displayed)))continue;
   if(this.direction<0&&(i<index||(displayed>=index&&i>displayed)))continue;
   if(!best||Math.abs(i-index)<Math.abs(best.index-index))best={index:i,image};
  }
  return best;
 }
 pump(){
  if(this.closed)return;
  while(this.pending.size<this.concurrency){
   const index=this.wanted.find(i=>!this.frames.has(i)&&!this.pending.has(i)&&!this.failed.has(i));if(index===undefined)break;
   const controller=new AbortController();this.pending.set(index,controller);
   Promise.resolve().then(()=>this.decode(index,controller.signal)).then(img=>{
    if(this.closed||controller.signal.aborted||!this.wanted.includes(index)){this.release(img);return;}
    this.frames.set(index,img);this.onReady(index);
   }).catch(error=>{if(controller.signal.aborted||this.closed)return;this.failed.add(index);this.onError(error,index);}).finally(()=>{
    this.pending.delete(index);
    // A failed frame is retried only on the next explicit request.
    this.pump();
   });
  }
 }
 close(){this.closed=true;for(const controller of this.pending.values())controller.abort();for(const img of this.frames.values())this.release(img);this.frames.clear();this.wanted=[];}
}
