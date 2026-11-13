const aborted=()=>new DOMException('Frame request cancelled','AbortError');
// Small compressed-byte cache, independent of the much larger decoded-image pool.
export class EncodedFrames{
 constructor({count,load,byteLimit=8_000_000,concurrency=6}){
  Object.assign(this,{count,load,byteLimit,concurrency});this.cache=new Map();this.jobs=new Map();this.queue=[];this.prefetched=new Set();this.bytes=0;this.active=0;this.current=0;this.closed=false;
 }
 focus(index){this.current=index;this.queue.sort((a,b)=>Number(b.demand)-Number(a.demand)||Math.abs(a.index-index)-Math.abs(b.index-index));}
 prefetch(start,end){
  if(this.closed)return;
  for(let i=Math.max(0,start);i<=Math.min(this.count-1,end);i++)if(!this.prefetched.has(i)){this.prefetched.add(i);this.enqueue(i,false).catch(()=>{});}
 }
 read(index,signal){
  if(this.closed||signal?.aborted)return Promise.reject(aborted());
  const result=this.cache.has(index)?Promise.resolve(this.cache.get(index)):this.enqueue(index,true);
  if(!signal)return result;
  return new Promise((resolve,reject)=>{
   const cancel=()=>{signal.removeEventListener('abort',cancel);reject(aborted());};signal.addEventListener('abort',cancel,{once:true});
   result.then(value=>{signal.removeEventListener('abort',cancel);if(signal.aborted)reject(aborted());else resolve(value);},error=>{signal.removeEventListener('abort',cancel);reject(error);});
  });
 }
 enqueue(index,demand){
  if(this.cache.has(index))return Promise.resolve(this.cache.get(index));
  let job=this.jobs.get(index);
  if(!job){
   job={index,demand,controller:new AbortController()};job.promise=new Promise((resolve,reject)=>Object.assign(job,{resolve,reject}));
   this.jobs.set(index,job);this.queue.push(job);
  }else if(demand)job.demand=true;
  this.focus(this.current);this.pump();return job.promise;
 }
 pump(){
  if(this.closed)return;
  while(this.active<this.concurrency&&this.queue.length){
   const job=this.queue.shift();this.active++;
   Promise.resolve().then(()=>this.load(job.index,job.controller.signal)).then(blob=>{
    if(this.closed)return;
    if(blob.size<=this.byteLimit){
     this.cache.set(job.index,blob);this.bytes+=blob.size;
     while(this.bytes>this.byteLimit){
      const farthest=[...this.cache.keys()].sort((a,b)=>Math.abs(b-this.current)-Math.abs(a-this.current))[0];
      this.bytes-=this.cache.get(farthest).size;this.cache.delete(farthest);
     }
    }
    job.resolve(blob);
   }).catch(job.reject).finally(()=>{this.active--;this.jobs.delete(job.index);this.pump();});
  }
 }
 close(){this.closed=true;for(const job of this.jobs.values()){job.controller.abort();job.reject(aborted());}this.jobs.clear();this.queue=[];this.cache.clear();this.bytes=0;}
}
