const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const ramp=(p,a,b)=>smooth((p-a)/(b-a));
export const ENTRY_SHARE=125/1669;
export function splitProgress(value){const p=clamp(value);return {entry:clamp(p/ENTRY_SHARE),story:clamp((p-ENTRY_SHARE)/(1-ENTRY_SHARE))};}
export const joinStory=story=>ENTRY_SHARE+(1-ENTRY_SHARE)*clamp(story);
export function entryVisuals(value){
 const p=clamp(value);
 // A longer dissolve gently overlaps Strategy's arrival, avoiding a blank beat.
 return {fade:ramp(p,0,.80),nav:ramp(p,.46,.96),copy:ramp(p,.50,1),scene:ramp(p,.54,1),ink:.012*ramp(p,.54,1)};
}
