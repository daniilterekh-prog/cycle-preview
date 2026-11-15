import {ENTRY_SHARE,joinStory} from './entry-timing.mjs';
import {progressForFrame} from './intro-timeline.mjs?v=reference-fit-v3';
const ranges=[[0,71],[72,135],[136,167],[168,191],[192,239]];
const clamp=value=>Math.max(0,Math.min(1,Number(value)||0));
function interpolate(points,value,key,result){
 if(value<=points[0][key])return points[0][result];
 for(let i=1;i<points.length;i++)if(value<=points[i][key]){const a=points[i-1],b=points[i],t=(value-a[key])/(b[key]-a[key]);return a[result]+t*(b[result]-a[result]);}
 return points.at(-1)[result];
}
export function mobileProgressMap({entryEnd,header,viewport,panels}){
 if(panels.length!==6||!(entryEnd>0))throw Error('Incomplete mobile chapter geometry');
 const points=[{y:0,progress:0},{y:entryEnd,progress:ENTRY_SHARE}],stops=[];
 function add(y,progress){points.push({y:Math.max(y,points.at(-1).y+1),progress});}
 for(const [i,panel] of panels.entries()){
  const end=i===0?joinStory(.205):joinStory(progressForFrame(ranges[i-1][1]));
  if(i>0){const start=panel.scene-Math.max(header,viewport-panel.sceneHeight-24);add(start-1,points.at(-1).progress);add(start,joinStory(progressForFrame(ranges[i-1][0])));}
  add(panel.scene-header,end);
  stops.push({id:panel.id,y:Math.max(entryEnd,panel.top-header),progress:end});
 }
 return {points,stops,progress:y=>clamp(interpolate(points,y,'y','progress')),position:p=>interpolate(points,clamp(p),'progress','y')};
}
export function nextReadStop(stops,y,direction){return direction>0?stops.find(stop=>stop.y>y+4)||null:[...stops].reverse().find(stop=>stop.y<y-4)||null;}
export function keyDirection(event){if(event.ctrlKey||event.metaKey||event.altKey)return 0;if(event.key===' ')return event.shiftKey?-1:1;return ['ArrowDown','PageDown'].includes(event.key)?1:['ArrowUp','PageUp'].includes(event.key)?-1:0;}
