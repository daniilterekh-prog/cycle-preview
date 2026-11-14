export function direction(dx,dy){return Math.abs(dy)>=48&&Math.abs(dy)>Math.abs(dx)*1.3?(dy<0?1:-1):0;}
export class TransitionState{
 stage=0;busy=false;target=0;
 begin(dir){if(this.busy||![-1,1].includes(dir)||this.stage+dir<0||this.stage+dir>1)return false;this.target=this.stage+dir;this.busy=true;return true;}
 finish(){if(this.busy)this.stage=this.target;this.busy=false;}
 fail(){this.target=this.stage;this.busy=false;}
}
export function parseRange(header,size){
 if(!header)return null;const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))return false;
 let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));let end=m[1]?(m[2]?Number(m[2]):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start||(!m[1]&&Number(m[2])===0))return false;
 return {start,end:Math.min(end,size-1)};
}
