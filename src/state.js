import { BALANCE, VIEW } from './config.js';

export function createState(){
  return {
    game:{state:'title',time:0,score:0,kills:0,wave:0,xp:0,nextXp:8,core:3,shake:0,flash:0,breakthrough:0,spawnTimer:0,enemyQuota:0,enemySpawned:0,waveActive:false,aimAngle:-Math.PI/2,upgradeChoices:[],banner:'',bannerT:0,combo:0,comboT:0,burstBuff:0,upgradeLevels:{},gmPaused:false,gmInvincible:false,gmTimeScale:1},
    player:{x:VIEW.width/2,y:VIEW.height-74,r:18,fireCd:BALANCE.baseFireCd,fireTimer:0,damage:BALANCE.baseDamage,bulletSpeed:470,bulletSize:5,ricochets:1,pierce:0,shots:1,spread:.11,explosive:0,split:0,chain:0,homing:0,trail:1,slowWall:0,burnWall:0},
    bullets:[], enemies:[], particles:[], rings:[], floating:[], stars:[]
  };
}
