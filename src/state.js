import { BALANCE, VIEW } from './config.js';
export function createState(){return{
  game:{state:'title',resumeState:'playing',time:0,score:0,kills:0,wave:0,maxWave:BALANCE.totalWaves,xp:0,nextXp:9,core:BALANCE.maxCore,coins:BALANCE.startingCoins,shopCost:BALANCE.shopBaseCost,shopBuys:0,repairCost:BALANCE.repairBaseCost,repairBuys:0,shake:0,flash:0,breakthrough:0,spawnTimer:0,enemyQuota:0,enemySpawned:0,waveActive:false,waveElapsed:0,waveDuration:18,bossSpawned:false,upgradeChoices:[],upgradeTarget:null,upgradeCost:0,recruitChoices:[],recruitFree:false,recruitSource:'shop',evolveChoices:[],evolveTarget:null,pendingFighter:null,placementX:VIEW.width/2,placementY:VIEW.height*.58,intermissionTimer:0,banner:'',bannerT:0,combo:0,comboT:0,gmPaused:false,gmInvincible:false,gmTimeScale:1,rewardText:''},
  player:{bulletSpeed:470,coinGain:1,expGain:1},
  fighters:{battle:[],selectedUid:null},bullets:[],enemies:[],particles:[],rings:[],floating:[],stars:[]
}}
