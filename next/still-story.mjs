import {stages} from './stages.mjs';

// Images remain separate from HTML copy and are shared by RU, EN and ME.
export function showStillStory(panels,{manifest,base=import.meta.url,frameRoot='frames'}={}){
 for(const panel of panels){
  panel.inert=false;panel.removeAttribute('aria-hidden');
  const id=panel.dataset.panel,frame=stages.find(stage=>stage.id===id)?.end;
  let picture=panel.querySelector('.stage-still');
  const existing=!!picture;
  if(!picture){picture=panel.ownerDocument.createElement('picture');picture.className='stage-still';}
  // The adjacent heading describes the state; repeating it as alt adds no information.
  const [source,image]=existing?[...picture.children]:[panel.ownerDocument.createElement('source'),panel.ownerDocument.createElement('img')];
  const file=profile=>id==='strategy'?`sketch-${profile}.webp`:(manifest?.profiles[profile]?.frames[frame]?.file||`${frameRoot}/${profile}/${String(frame).padStart(3,'0')}.webp`);
  source.media='(max-width:700px)';source.srcset=new URL(file('mobile'),base).href;
  image.src=new URL(file('desktop'),base).href;image.alt='';image.loading='lazy';image.decoding='async';image.width=1000;image.height=800;
  if(!existing){picture.append(source,image);panel.append(picture);}
 }
}
