// Only an actual player failure selects the still story. Motion preferences
// control interpolation in the scroll timeline, never access to the building.
// Generation checks prevent late network responses from reviving a stopped player.
export function createStoryMode({loadManifest,animate,still,capture=()=>null,restore=()=>{}}){
 let manifest,controller,stop,version=0,destroyed=false;
 function cancel(){version++;controller?.abort();controller=null;}
 function stopPlayer(){stop?.();stop=null;}
 function enterStill(reason,position=capture()){
  cancel();stopPlayer();still(reason);restore(position);
 }
 async function refresh(){
  if(destroyed)return;
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
 const ready=refresh();
 return {ready,retry:refresh,
  fail(){if(!destroyed)enterStill('error');},
  destroy(){if(destroyed)return;destroyed=true;cancel();stopPlayer();}
 };
}
