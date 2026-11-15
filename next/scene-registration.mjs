// Reserve one common image rectangle for the sketch→construction handover.
// Text can have different line counts without moving the shared camera surface.
export function createSceneRegistration(root,scene,panels){
 const surfaces=[...scene.children].filter(e=>e.matches('.poster,canvas,.sketch-layer'));
 let key='',box;
 const clear=()=>surfaces.forEach(e=>{for(const p of ['left','top','width','height'])e.style.removeProperty(p);});
 return {invalidate(){key='';},update(stage){
  if(!['strategy','branding','design','digital','systems','final'].includes(stage)){clear();return;}
  const next=innerWidth+'x'+innerHeight;
  if(next!==key){
   clear();const saved=root.dataset.stage,active=panels.map(p=>p.classList.contains('active')),boxes=[];
   try{for(const id of (innerWidth<=700?['strategy','branding','design','digital','systems','final']:['strategy','branding'])){
    root.dataset.stage=id;panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===id));
    const r=scene.getBoundingClientRect();boxes.push({x:r.x,y:r.y,w:r.width,h:r.height});
   }}finally{root.dataset.stage=saved;panels.forEach((p,i)=>p.classList.toggle('active',active[i]));}
   const x=Math.max(...boxes.map(r=>r.x)),y=Math.max(...boxes.map(r=>r.y));
   box=innerWidth<=700?{x,y,w:Math.min(...boxes.map(r=>r.x+r.w))-x,h:Math.min(...boxes.map(r=>r.y+r.h))-y}:{...boxes[0],h:boxes[0].h-30};key=next;
  }
  const r=scene.getBoundingClientRect();for(const e of surfaces)Object.assign(e.style,{left:(box.x-r.x)+'px',top:(box.y-r.y)+'px',width:box.w+'px',height:Math.max(40,box.h)+'px'});
 },clear};
}
