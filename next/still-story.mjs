import {stages} from './stages.mjs';

// Images remain separate from HTML copy and are shared by RU, EN and ME.
export function showStillStory(panels,{manifest,base=import.meta.url}={}){
 for(const panel of panels){
  panel.inert=false;panel.removeAttribute('aria-hidden');
  if(panel.querySelector('.stage-still'))continue;
  const id=panel.dataset.panel,frame=stages.find(stage=>stage.id===id)?.end;
  const picture=panel.ownerDocument.createElement('picture');picture.className='stage-still';
  // The adjacent heading describes the state; repeating it as alt adds no information.
  const source=panel.ownerDocument.createElement('source'),image=panel.ownerDocument.createElement('img');
  const file=profile=>id==='strategy'?`sketch-${profile}.webp`:(manifest?.profiles[profile]?.frames[frame]?.file||`frames/${profile}/${String(frame).padStart(3,'0')}.webp`);
  source.media='(max-width:700px)';source.srcset=new URL(file('mobile'),base).href;
  image.src=new URL(file('desktop'),base).href;image.alt='';image.loading='lazy';image.decoding='async';image.width=1000;image.height=800;
  picture.append(source,image);panel.append(picture);
 }
}
