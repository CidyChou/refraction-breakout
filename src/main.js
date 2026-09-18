import { VIEW, BALANCE } from './config.js';
import { createState } from './state.js';
import { UI } from './ui.js';
import { Renderer } from './renderer.js';
import { Game } from './game.js';
import { AudioEngine } from './audio.js';
import { GMPanel } from './gm.js';

const canvas=document.querySelector('#game'),state=createState(),ui=new UI(),audio=new AudioEngine(),game=new Game(state,ui,audio),renderer=new Renderer(canvas,state),gm=new GMPanel(game,state,audio);
ui.bind({
  onStart:()=>{audio.ensure();audio.uiConfirm();game.reset()},onRestart:()=>{audio.ensure();audio.uiConfirm();game.reset()},onUpgrade:i=>game.chooseUpgrade(i),onSoundToggle:()=>ui.setSoundEnabled(audio.toggle()),
  onOpenRecruit:()=>{audio.ensure();game.openRecruit({free:false,source:'shop'})},onChooseRecruit:i=>game.chooseRecruit(i),onCancelRecruit:()=>game.cancelRecruit(),onFighterAction:()=>game.openSelectedFighterAction(),onChooseEvolve:i=>game.chooseEvolution(i),onCancelEvolve:()=>game.cancelEvolve(),onRepairCore:()=>game.repairCore(),
});
ui.setSoundEnabled(audio.isEnabled());ui.sync(state);
function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*VIEW.width,y:(e.clientY-r.top)/r.height*VIEW.height}}
let drag=null;
canvas.addEventListener('pointerdown',e=>{
  audio.ensure();const p=pointerPos(e),st=state.game.state;
  if(st==='placing'){game.placePending(p.x,p.y);return}
  if(!['playing','intermission'].includes(st))return;
  const sel=game.getSelectedFighter(),handle=game.getAimHandle();
  if(sel&&handle&&Math.hypot(handle.x-p.x,handle.y-p.y)<17){drag={mode:'aim',uid:sel.uid};canvas.setPointerCapture?.(e.pointerId);game.setFighterAim(sel.uid,p.x,p.y);return}
  const f=game.findFighterAt(p.x,p.y,26);
  if(f){game.selectFighter(f.uid);drag={mode:'move',uid:f.uid,offX:p.x-f.x,offY:p.y-f.y,origX:f.x,origY:f.y,moved:false};canvas.setPointerCapture?.(e.pointerId);return}
  if(sel&&sel.type!=='support'){drag={mode:'aim',uid:sel.uid};canvas.setPointerCapture?.(e.pointerId);game.setFighterAim(sel.uid,p.x,p.y)}
});
canvas.addEventListener('pointermove',e=>{
  const p=pointerPos(e);if(state.game.state==='placing'){game.setPlacementPreview(p.x,p.y);return}if(!drag)return;
  if(drag.mode==='aim')game.setFighterAim(drag.uid,p.x,p.y);
  else if(drag.mode==='move'){const f=game.getFighter(drag.uid);if(!f)return;const nx=p.x-drag.offX,ny=p.y-drag.offY;if(Math.hypot(nx-drag.origX,ny-drag.origY)>4)drag.moved=true;game.moveFighter(drag.uid,nx,ny)}
});
function endPointer(){
  if(!drag)return;if(drag.mode==='move'&&drag.moved){
    const merged=game.tryMerge(drag.uid);
    if(!merged&&game.hasCollision(drag.uid,30)){game.moveFighter(drag.uid,drag.origX,drag.origY);game.banner('不同类型 / 星级不能合成',.75)}
  }drag=null;
}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
addEventListener('keydown',e=>{
  audio.ensure();if(e.code==='F2'||e.code==='Backquote'){e.preventDefault();gm.toggle();return}if(e.code==='Escape'&&gm.open){gm.toggle(false);return}const tag=document.activeElement?.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;
  if(e.key.toLowerCase()==='r')game.reset();if(state.game.state==='upgrade'&&['1','2','3'].includes(e.key))game.chooseUpgrade(Number(e.key)-1);if(state.game.state==='recruit'&&['1','2','3'].includes(e.key))game.chooseRecruit(Number(e.key)-1);if(state.game.state==='evolve'&&['1','2'].includes(e.key))game.chooseEvolution(Number(e.key)-1);if(state.game.state==='title'&&(e.code==='Space'||e.code==='Enter'))game.reset();if(['gameover','victory'].includes(state.game.state)&&(e.code==='Space'||e.code==='Enter'))game.reset();
});
let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;game.update(dt*(state.game.gmTimeScale||1));renderer.draw();ui.sync(state);gm.sync();requestAnimationFrame(loop)}requestAnimationFrame(loop);
