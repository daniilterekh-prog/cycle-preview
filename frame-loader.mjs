// Bounded, current-first adaptation of the existing frame-pool approach.
// Stale completions are released; distant endpoints are never pinned.
export class FrameLoader{
 constructor({count,limit=5,decode,release=()=>{},onReady=()=>{},onError=()=>{}}){
  Object.assign(this,{count,limit:Math.max(1,limit),decode,release,onReady,onError});
  this.frames=new Map();this.pending=new Set();this.failed=new Set();this.wanted=[];this.closed=false;
 }
 request(index){
  if(this.closed)return;
  this.failed.clear();
  const n=Math.max(0,Math.min(this.count-1,Math.round(index)));
  this.wanted=Array.from({length:this.count},(_,i)=>i).sort((a,b)=>Math.abs(a-n)-Math.abs(b-n)).slice(0,this.limit);
  for(const [i,img] of this.frames)if(!this.wanted.includes(i)){this.frames.delete(i);this.release(img);}
  this.pump();
 }
 pump(){
  if(this.closed)return;
  while(this.pending.size<2){
   const index=this.wanted.find(i=>!this.frames.has(i)&&!this.pending.has(i)&&!this.failed.has(i));if(index===undefined)break;
   this.pending.add(index);
   Promise.resolve().then(()=>this.decode(index)).then(img=>{
    if(this.closed||!this.wanted.includes(index)){this.release(img);return;}
    this.frames.set(index,img);this.onReady(index);
   }).catch(error=>{this.failed.add(index);if(!this.closed)this.onError(error,index);}).finally(()=>{
    this.pending.delete(index);
    // A failed frame is retried only on the next explicit request.
    this.pump();
   });
  }
 }
 close(){this.closed=true;for(const img of this.frames.values())this.release(img);this.frames.clear();this.wanted=[];}
}
