const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
const ramp=(p,a,b)=>smooth((p-a)/(b-a));
export const ENTRY_SHARE=125/1669;
export function splitProgress(value){const p=clamp(value);return {entry:clamp(p/ENTRY_SHARE),story:clamp((p-ENTRY_SHARE)/(1-ENTRY_SHARE))};}
export const joinStory=story=>ENTRY_SHARE+(1-ENTRY_SHARE)*clamp(story);
export function entryVisuals(value,compact=false){
 const p=clamp(value);
 return {dock:ramp(p,.08,.86),nav:ramp(p,.48,.88),copy:ramp(p,compact?.72:.45,compact?.99:.96),scene:ramp(p,compact?.72:.58,1),handoff:ramp(p,.92,1),ink:.012*ramp(p,.58,1)};
}
