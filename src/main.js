import { VIEW } from './config.js';
import { createState } from './state.js';
import { UI } from './ui.js';
import { Renderer } from './renderer.js';
import { Game } from './game.js';
import { AudioEngine } from './audio.js';
import { GMPanel } from './gm.js';

const canvas=document.querySelector('#game');
const state=createState();
const ui=new UI();
const audio=new AudioEngine();
const game=new Game(state,ui,audio);
const renderer=new Renderer(canvas,state);
const gm=new GMPanel(game,state,audio);

ui.bind({
  onStart:()=>{audio.ensure();audio.uiConfirm();game.reset()},
  onRestart:()=>{audio.ensure();audio.uiConfirm();game.reset()},
  onUpgrade:i=>game.chooseUpgrade(i),
  onSoundToggle:()=>ui.setSoundEnabled(audio.toggle())
});
ui.setSoundEnabled(audio.isEnabled());
ui.sync(state);

function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*VIEW.width,y:(e.clientY-r.top)/r.height*VIEW.height}}
canvas.addEventListener('pointermove',e=>{if(state.game.state==='playing'){const p=pointerPos(e);game.updateAim(p.x,p.y)}});
canvas.addEventListener('pointerdown',e=>{audio.ensure();if(state.game.state==='playing'){const p=pointerPos(e);game.updateAim(p.x,p.y)}});
addEventListener('keydown',e=>{audio.ensure();if(e.code==='F2'||e.code==='Backquote'){e.preventDefault();gm.toggle();return}if(e.code==='Escape'&&gm.open){gm.toggle(false);return}const tag=document.activeElement?.tagName;if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;if(e.key.toLowerCase()==='r')game.reset();if(state.game.state==='upgrade'&&['1','2','3'].includes(e.key))game.chooseUpgrade(Number(e.key)-1);if(state.game.state==='title'&&(e.code==='Space'||e.code==='Enter'))game.reset();if(state.game.state==='gameover'&&(e.code==='Space'||e.code==='Enter'))game.reset()});

let last=performance.now();
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;game.update(dt*(state.game.gmTimeScale||1));renderer.draw();ui.sync(state);gm.sync();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
