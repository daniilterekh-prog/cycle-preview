import {storyState,progressForFrame} from './intro-timeline.mjs';
// Use the painted source frame, not an ahead-of-buffer scroll target.
export function fragmentLayers(segment,sourceFrame){
 if(segment!=='entry')return {solid:1,sketch:0,draw:0};
 const state=storyState(progressForFrame(sourceFrame));
 return {solid:state.solid,sketch:state.sketch,draw:state.draw};
}
