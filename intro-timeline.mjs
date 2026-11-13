import {stageForFrame} from './stages.mjs';
export const BUILD_START=.23;
export const solidOpacity=(state,displayedFrame)=>state.stage==='strategy'||(state.frame<60&&displayedFrame!==state.frame)?0:state.solid;
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
export const progressForFrame=frame=>BUILD_START+(1-BUILD_START)*Math.max(0,Math.min(239,frame))/239;
export function storyState(value){
 const progress=clamp(value),raw=Math.max(0,(progress-BUILD_START)/(1-BUILD_START))*239,frame=Math.round(raw);
 return {progress,frame,stage:progress<BUILD_START?'strategy':stageForFrame(frame).id,sketch:1-smooth(raw/60),solid:smooth(raw/24),draw:clamp((progress-.005)/.19),preload:progress>=.14};
}
