const clamp=value=>Math.max(0,Math.min(1,value));
// Capture against the previous layout, before viewport units change on rotation.
export function captureLocation({y,start,end,header=0,anchors=[]}){
 if(y>=start&&y<=end)return {kind:'story',progress:clamp((y-start)/Math.max(1,end-start))};
 const section=[...anchors].sort((a,b)=>a.top-b.top).filter(a=>a.top<=y+header+1).at(-1)||anchors[0];
 return section?{kind:'section',id:section.id,offset:y-section.top}:{kind:'absolute',y};
}
export function restoreLocation(location,{start,end,anchors=[]}){
 if(location.kind==='story')return start+clamp(location.progress)*Math.max(0,end-start);
 if(location.kind==='section'){const section=anchors.find(a=>a.id===location.id);return section?Math.max(0,section.top+location.offset):end;}
 return Math.max(0,location.y||0);
}
