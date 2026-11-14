import {joinStory} from './entry-timing.mjs';
import {progressForFrame} from './intro-timeline.mjs';
// Reading holds use completed states: sketch, structure, finish, garden, IT, final.
export const stageStops=Object.freeze([0,joinStory(.205),...[71,135,167,191,239].map(frame=>joinStory(progressForFrame(frame)))]);
export function snapStage(value,direction){
 const progress=Math.max(0,Math.min(1,Number(value)||0));
 const resting=stageStops.find(stop=>Math.abs(stop-progress)<.0002);
 if(resting!==undefined)return resting;
 if(direction>0)return stageStops.find(stop=>stop>progress)??1;
 if(direction<0)return stageStops.findLast(stop=>stop<progress)??0;
 return progress;
}
