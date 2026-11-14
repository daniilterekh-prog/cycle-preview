// Only a system preference or an actual player failure selects the still story.
// Generation checks prevent late network responses from reviving a stopped player.
export function createStoryMode({preference,loadManifest,animate,still,capture=()=>null,restore=()=>{}}){
 let manifest,controller,stop,version=0,destroyed=false;
 function cancel(){version++;controller?.abort();controller=null;}
 function stopPlayer(){stop?.();stop=null;}
 function enterStill(reason,position=capture()){
  cancel();stopPlayer();still(reason);restore(position);
 }
 async function refresh(){
  if(destroyed)return;
  if(preference.matches){enterStill('reduced-motion');return;}
  cancel();const current=version;
  controller=new AbortController();const signal=controller.signal;
  try{
   const data=manifest||await loadManifest(signal);
   if(destroyed||current!==version||signal.aborted)return;
   manifest=data;controller=null;
   const position=capture();stopPlayer();stop=animate(data);restore(position);
  }catch{
   if(!destroyed&&current===version&&!signal.aborted)enterStill('error');
  }
 }
 const change=()=>{void refresh();};preference.addEventListener('change',change);
 const ready=refresh();
 return {ready,retry:refresh,
  fail(){if(!destroyed)enterStill(preference.matches?'reduced-motion':'error');},
  destroy(){if(destroyed)return;destroyed=true;cancel();stopPlayer();preference.removeEventListener('change',change);}
 };
}
