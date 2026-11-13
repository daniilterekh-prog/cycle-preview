const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const ramp=(p,a,b)=>smooth((p-a)/(b-a));
export const ENTRY_SHARE=125/1669;
export function splitProgress(value){const p=clamp(value);return {entry:clamp(p/ENTRY_SHARE),story:clamp((p-ENTRY_SHARE)/(1-ENTRY_SHARE))};}
export const joinStory=story=>ENTRY_SHARE+(1-ENTRY_SHARE)*clamp(story);
export function entryVisuals(value){
 const p=clamp(value);
 return {fade:ramp(p,.06,.66),nav:ramp(p,.50,.90),copy:ramp(p,.66,1),scene:ramp(p,.68,1),ink:.012*ramp(p,.68,1)};
}
