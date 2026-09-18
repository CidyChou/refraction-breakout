import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/state.js';
import { Game } from '../src/game.js';

function makeGame(){
  const state=createState(),game=new Game(state,null,null);
  Object.assign(state.game,{state:'playing',wave:1,waveActive:false,spawnTimer:99});
  return {state,game};
}

function addEnemy(state,x,y,r=9,type='mini'){
  const enemy={eid:`test-${state.enemies.length}`,x,y,r,hp:100,maxHp:100,type,speed:0,coinValue:0,vx:0,t:0,phase:0,spin:0,dead:false,protected:0,slowT:0,slowFactor:1,slowStacks:0,burnT:0,burnDps:0,burnStacks:0,regenRate:0,spawnT:0,spawnMax:0,gravity:0,bumper:false};
  state.enemies.push(enemy);return enemy;
}

function addProjectile(game,kind,x,y,vx,vy,overrides={}){
  return game.spawnProjectile({x,y,vx,vy,r:kind==='laser'?3.4:4.5,life:2,maxLife:2,dead:false,bounces:0,hitCount:4,damage:1,splitDone:false,isSplit:false,slowBuff:0,burnBuff:0,prismBuff:0,kind,explosive:0,trailScale:1,sourceSplit:0,sourceChain:0,sourceHoming:0,fieldMask:0,hitA:null,hitAUntil:0,hitB:null,hitBUntil:0,...overrides});
}

for(const kind of ['normal','laser','pierce','aoe'])test(`${kind} uses swept collision at high speed`,()=>{
  const {state,game}=makeGame(),enemy=addEnemy(state,100,200);
  addProjectile(game,kind,40,200,1200,0);
  game.update(.08);
  assert.ok(enemy.hp<enemy.maxHp);
});

test('laser visible body can hit after its leading point has passed',()=>{
  const {state,game}=makeGame(),enemy=addEnemy(state,60,200);
  addProjectile(game,'laser',100,200,100,0);
  game.update(.01);
  assert.ok(enemy.hp<enemy.maxHp);
});

test('laser padding stays narrow enough to preserve a clear near miss',()=>{
  const {state,game}=makeGame(),enemy=addEnemy(state,60,216);
  addProjectile(game,'laser',100,200,100,0);
  game.update(.01);
  assert.equal(enemy.hp,enemy.maxHp);
});
