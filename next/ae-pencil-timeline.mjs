import {makeSchedule,locate} from './pencil-timeline.mjs';
const clamp=value=>Math.max(0,Math.min(1,value));
export function keyValue(keys,time,fallback=100){
 if(!keys.length)return fallback;if(time<=keys[0][0])return keys[0][1];
 for(let i=1;i<keys.length;i++)if(time<=keys[i][0]){const [a,av]=keys[i-1],[b,bv]=keys[i];return av+(bv-av)*clamp((time-a)/(b-a));}
 return keys.at(-1)[1];
}
export function prepareAEPencil(data){
 if(data.version!==1||data.width!==1000||data.height!==800||!Array.isArray(data.layers))throw Error('Unsupported AE sketch');
 return {...data,layers:data.layers.map(layer=>{
  const strokes=[],runs=[];
  for(const group of layer.groups){
   if(group.trim?.mode!==2||group.trim.end.length!==2)throw Error('Unsupported AE trim mode/timing');
   const first=strokes.length,paths=group.paths.map(p=>{
    if(p.closed||p.v.length!==2)throw Error('Unsupported AE path');
    const [a,b]=p.v,control=[a[0]+p.o[0][0]*1.5,a[1]+p.o[0][1]*1.5];
    return [...a,...control,...b,group.stroke.opacity,group.stroke.width];
   });
   strokes.push(...paths);runs.push({first,count:paths.length,schedule:makeSchedule(paths),start:group.trim.end[0][0],end:group.trim.end[1][0],color:group.stroke.color});
  }
  return {name:layer.name,opacity:layer.opacity,strokes,runs};
 })};
}
export function layerDrawState(layer,time){
 let count=0,partial=null;
 for(const run of layer.runs){
  if(time>=run.end){count+=run.count;continue;}if(time<=run.start)break;
  const point=locate(run.schedule,clamp((time-run.start)/(run.end-run.start)));count+=point.index;
  partial={run,first:run.first,t:point.t};break;
 }
 return {count,partial,opacity:keyValue(layer.opacity,time)/100};
}
