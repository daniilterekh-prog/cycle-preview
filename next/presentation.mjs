export const imageProfile=(width,height,coarse)=>width<=700||(coarse&&Math.min(width,height)<=700)?'mobile':'desktop';
export const posterNeeded=({pencilPainted,sketchOpacity,frame,solidOpacity})=>!(pencilPainted&&sketchOpacity>0)&&!(frame>=0&&solidOpacity>0);
export function manifestURL(moduleURL){
 const source=new URL(moduleURL),target=new URL('sequence.json',source),version=source.searchParams.get('v');
 if(version)target.searchParams.set('v',version);
 return target;
}
