const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
export function partialCurve(s,value){const t=clamp(value),u=1-t;return [s[0],s[1],u*s[0]+t*s[2],u*s[1]+t*s[3],u*u*s[0]+2*u*t*s[2]+t*t*s[4],u*u*s[1]+2*u*t*s[3]+t*t*s[5]];}
export function makeSchedule(strokes){
 const ends=[];let total=0;
 for(const s of strokes){let x=s[0],y=s[1],length=0;for(let i=1;i<=8;i++){const p=partialCurve(s,i/8);length+=Math.hypot(p[4]-x,p[5]-y);[x,y]=p.slice(4);}total+=Math.max(.01,length);ends.push(total);}
 return {ends,total};
}
export function locate(schedule,value){
 const p=clamp(value);if(p===1)return {index:schedule.ends.length,t:0};
 const target=p*schedule.total;let lo=0,hi=schedule.ends.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(schedule.ends[mid]<=target)lo=mid+1;else hi=mid;}
 const start=lo?schedule.ends[lo-1]:0;return {index:lo,t:(target-start)/(schedule.ends[lo]-start)};
}
