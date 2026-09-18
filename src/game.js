import { VIEW, BALANCE, COLORS } from './config.js';
import { TAU, rand, clamp, lerp, compactByFlag, compactByLife } from './utils.js';
import { UPGRADES, fighterUpgradeChoices } from './upgrades.js';
import { FIGHTER_TYPES, makeFighter, fighterStats, supportRange, supportFieldType, supportFieldStrength, fighterCanEvolve, sameMergeFamily, fighterUpgradeCost, mergeFighterProgress } from './fighters.js';

export class Game{
  constructor(state,ui,audio){
    this.s=state;this.ui=ui;this.audio=audio;this.upgradeRevealToken=0;this.enemyUid=1;
    for(let i=0;i<90;i++)state.stars.push({x:rand(0,VIEW.width),y:rand(0,VIEW.height),s:rand(.4,1.8),a:rand(.15,.8),v:rand(4,18)});
  }

  reset(){
    const s=this.s,g=s.game,p=s.player;
    Object.assign(g,{state:'playing',resumeState:'playing',time:0,score:0,kills:0,wave:0,maxWave:BALANCE.totalWaves,xp:0,nextXp:9,core:BALANCE.maxCore,coins:BALANCE.startingCoins,shopCost:BALANCE.shopBaseCost,shopBuys:0,repairCost:BALANCE.repairBaseCost,repairBuys:0,shake:0,flash:0,breakthrough:0,spawnTimer:0,enemyQuota:0,enemySpawned:0,waveActive:false,waveElapsed:0,waveDuration:18,bossSpawned:false,upgradeChoices:[],upgradeTarget:null,upgradeCost:0,recruitChoices:[],recruitFree:false,recruitSource:'shop',evolveChoices:[],evolveTarget:null,pendingFighter:null,placementX:VIEW.width/2,placementY:560,intermissionTimer:0,banner:'',bannerT:0,combo:0,comboT:0,gmPaused:false,gmInvincible:false,gmTimeScale:1,rewardText:''});
    Object.assign(p,{bulletSpeed:470,coinGain:1,expGain:1});
    s.bullets.length=s.enemies.length=s.particles.length=s.rings.length=s.floating.length=0;
    s.fighters.battle=[];s.fighters.selectedUid=null;
    this.openRecruit({free:true,source:'starter'});
    this.ui?.refreshCombat?.(s,this);
  }

  banner(text,time=1.1){this.s.game.banner=text;this.s.game.bannerT=time}
  fighters(){return this.s.fighters.battle}
  getFighter(uid){return this.fighters().find(f=>f.uid===uid)||null}
  getSelectedFighter(){return this.getFighter(this.s.fighters.selectedUid)}
  hasAttackFighter(){return this.fighters().some(f=>f.type!=='support')}
  fighterCapacityFull(){return this.fighters().length>=BALANCE.maxFighters}

  startWave({silent=false,preserveState=false}={}){
    const g=this.s.game;
    if(!this.hasAttackFighter()){this.banner('至少需要 1 架攻击战机',1.1);return false}
    if(g.wave>=BALANCE.totalWaves){this.completeRun();return false}
    g.wave++;if(!preserveState){g.state='playing';g.resumeState='playing'}g.waveActive=true;g.enemySpawned=0;g.waveElapsed=0;g.bossSpawned=false;
    g.enemyQuota=Math.min(Math.round(BALANCE.waveBaseQuota+g.wave*BALANCE.waveQuotaPerWave),BALANCE.waveQuotaCap);
    g.waveDuration=Math.min(BALANCE.waveDurationBase+g.wave*BALANCE.waveDurationPerWave,BALANCE.waveDurationCap);
    g.spawnTimer=.42;if(!silent)this.banner(g.wave%10===0?`MILESTONE · WAVE ${g.wave}`:`WAVE ${g.wave}`,1.15);return true;
  }

  formationX(i,count,type){const m=48;if(type===0)return lerp(m,VIEW.width-m,(i+.5)/Math.max(1,count))+Math.sin(i*1.7)*12;if(type===1)return VIEW.width/2+Math.sin(i/(Math.max(1,count-1))*Math.PI*2)*130;return lerp(m,VIEW.width-m,(i+.5)/Math.max(1,count))}
  chooseEnemyType(w){
    const r=Math.random();
    if(w>=12&&r<.07)return'tank';
    if(w>=9&&r<.13)return'regen';
    if(w>=5&&r<.19)return'magnet';
    if(w>=6&&r<.25)return'carrier';
    if(w>=5&&r<.34)return'drifter';
    if(w>=4&&r<.43)return'warden';
    if(w>=4&&r<.52)return'pulse';
    if(w>=3&&r<.62)return'bumper';
    if(w>=3&&r<.71)return'splitter';
    if(w>=2&&r<.82)return'spinner';
    if(w>=2&&r<.91)return'shield';
    return'grunt';
  }
  spawnEnemy(forcedType=null,countTowardWave=true){
    const s=this.s,g=s.game,n=g.enemySpawned,q=g.enemyQuota,d=Math.max(1,g.wave),type=forcedType||this.chooseEnemyType(d);
    let x=type==='titan'?VIEW.width/2:this.formationX(n,q,(d+n)%3),hp=BALANCE.enemyBaseHp+(d-1)*BALANCE.enemyHpPerWave,radius=15,speed=BALANCE.enemyBaseSpeed+Math.min(BALANCE.enemySpeedWaveCap,d*BALANCE.enemySpeedPerWave),coinValue=1,regenRate=0;
    // Type speed is deliberately varied: tanks anchor the horde, light units create pressure.
    if(type==='grunt'){speed*=1.18;radius=14}
    if(type==='shield'){hp*=1.45;radius=18;speed*=.90}
    if(type==='spinner'){hp*=1.10;radius=16;speed*=1.28}
    if(type==='splitter'){hp*=1.24;radius=17;speed*=1.04}
    if(type==='pulse'){hp*=1.20;radius=16;speed*=1.22}
    if(type==='bumper'){hp*=1.12;radius=16;speed*=1.16;coinValue=2}
    if(type==='warden'){hp*=1.75;radius=19;speed*=.74}
    if(type==='drifter'){hp*=1.04;radius=14;speed*=1.55}
    if(type==='magnet'){hp*=1.55;radius=19;speed*=.86;coinValue=2}
    if(type==='tank'){hp*=3.25;radius=24;speed*=.48;coinValue=3}
    if(type==='regen'){hp*=1.55;radius=18;speed*=.84;regenRate=.12+.012*d;coinValue=2}
    if(type==='carrier'){hp*=1.15;radius=16;speed*=1.34;coinValue=5}
    if(type==='titan'){hp*=8.2;radius=31;speed*=.38;coinValue=12}
    hp=Math.round(hp*2)/2;
    const portal=BALANCE.portal||{spawnY:112,minX:76,maxX:344};
    x=type==='titan'?VIEW.width/2:clamp(x,portal.minX,portal.maxX);
    const emerge=type==='titan'?.62:.42;
    s.enemies.push({eid:`e${this.enemyUid++}`,x,y:portal.spawnY+rand(-5,5),r:radius,hp,maxHp:hp,type,speed,coinValue,regenRate,vx:type==='drifter'?rand(-54,54):0,t:rand(0,10),phase:rand(0,TAU),spin:rand(-1.25,1.25)||.7,dead:false,protected:0,slowT:0,slowFactor:1,slowStacks:0,burnT:0,burnDps:0,burnStacks:0,spawnT:emerge,spawnMax:emerge,gravity:type==='magnet'?105:0,bumper:type==='bumper'});
    if(countTowardWave)g.enemySpawned++;
  }

  fighterSupport(){return 0}

  shootFromFighter(f,angle,stats,shotIndex=0){
    const p=this.s.player,offset=(shotIndex-(stats.shots-1)/2)*stats.spread,a=angle+offset,muzzle=19,x=f.x+Math.cos(a)*muzzle,y=f.y+Math.sin(a)*muzzle;
    const sp=p.bulletSpeed*(stats.bulletSpeedScale||1)*(1+(stats.ballSpeed||0)*.08);
    const life=stats.life;
    this.s.bullets.push({
      x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      r:stats.kind==='laser'?3.4:(5+(stats.bulletSize||0)*.35)*(stats.kind==='aoe'?1.15:.9),
      life,maxLife:life,dead:false,bounces:0,hitCount:Math.max(1,stats.hitCount),damage:BALANCE.baseDamage*stats.damage,
      splitDone:false,isSplit:false,slowBuff:0,burnBuff:0,prismBuff:0,kind:stats.kind,explosive:stats.explosive,
      sourceLevel:f.level,sourceStar:f.star,sourceType:f.type,sourceUid:f.uid,trailScale:stats.trailScale||1,evolution:f.evolution||null,
      sourceSplit:stats.split||0,sourceChain:stats.chain||0,sourceHoming:stats.homing||0,fieldContacts:{},hitLocks:{}
    });
  }
  fireFighters(dt){
    for(const f of this.fighters()){
      if(f.type==='support')continue;
      f.fireTimer-=dt;const stats=fighterStats(f,this.fighterSupport(f));
      if(f.fireTimer<=0){
        f.fireTimer=stats.cd;this.audio?.shoot();
        for(let k=0;k<stats.shots;k++)this.shootFromFighter(f,f.aimAngle,stats,k);
        this.s.rings.push({x:f.x+Math.cos(f.aimAngle)*18,y:f.y+Math.sin(f.aimAngle)*18,r:4,max:21,t:0,life:.12,color:FIGHTER_TYPES[f.type].accent});
      }
    }
  }

  impactDamage(b){return b.isSplit?0:b.damage*(1+(b.prismBuff||0)*.06)}
  explode(x,y,power,damage,exclude=null){const radius=32+power*14;this.s.rings.push({x,y,r:6,max:radius,t:0,life:.3,color:'#ffb17c'});for(let i=0;i<12+power*4;i++){const a=rand(0,TAU),sp=rand(40,145);this.s.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.2,.52),max:.52,size:rand(1,3),kind:'burnfx'})}for(const e of this.s.enemies){if(e.dead||e===exclude)continue;if(Math.hypot(e.x-x,e.y-y)<radius+e.r)this.hitEnemy(e,Math.max(.06,damage*.30),null,true)}}
  chainFrom(source,count,damage){let cur=source,used=new Set([source]);for(let n=0;n<count;n++){let best=null,bd=115;for(const e of this.s.enemies){if(e.dead||used.has(e))continue;const d=Math.hypot(e.x-cur.x,e.y-cur.y);if(d<bd){bd=d;best=e}}if(!best)break;this.s.rings.push({x:cur.x,y:cur.y,x2:best.x,y2:best.y,r:0,max:0,t:0,life:.12,kind:'arc'});this.hitEnemy(best,Math.max(.06,damage*.30),null,true);used.add(best);cur=best}}
  applyBuffs(e,b){if(!b)return;if(b.slowBuff>0){this.audio?.buff('slow',b.slowBuff);e.slowStacks=Math.min(BALANCE.maxSlowStacks,(e.slowStacks||0)+b.slowBuff);e.slowT=Math.min(7.5,Math.max(e.slowT||0,2.2)+.18*b.slowBuff);e.slowFactor=Math.max(.18,1-e.slowStacks*.075);this.s.rings.push({x:e.x,y:e.y,r:e.r*.75,max:e.r+12,t:0,life:.22,color:COLORS.slow})}if(b.burnBuff>0){this.audio?.buff('burn',b.burnBuff);e.burnStacks=Math.min(BALANCE.maxBurnStacks,(e.burnStacks||0)+b.burnBuff);e.burnT=Math.min(8.5,Math.max(e.burnT||0,2.4)+.20*b.burnBuff);e.burnDps=.13+e.burnStacks*.145;this.s.rings.push({x:e.x,y:e.y,r:e.r*.55,max:e.r+10,t:0,life:.2,color:COLORS.burn})}}
  hitEnemy(e,damage,b=null,silent=false){
    if(e.dead)return false;
    if(e.protected>0&&e.type!=='warden'&&e.type!=='titan')damage*=.38;
    if(e.type==='shield'&&b&&b.y>e.y){b.vx*=-.78;b.vy*=-.78;this.s.rings.push({x:e.x,y:e.y-6,r:e.r,max:e.r+14,t:0,life:.14,color:'#ffcc67'});return false}
    if(e.type==='bumper'&&b){
      const dx=b.x-e.x,dy=b.y-e.y,len=Math.max(.001,Math.hypot(dx,dy)),nx=dx/len,ny=dy/len,dot=b.vx*nx+b.vy*ny;
      b.vx=(b.vx-2*dot*nx)*.96;b.vy=(b.vy-2*dot*ny)*.96;
      this.s.rings.push({x:e.x,y:e.y,r:e.r*.7,max:e.r+18,t:0,life:.16,color:'#ff75c8'});
      damage*=.72;
    }
    this.applyBuffs(e,b);e.hp-=damage;
    if(damage>0&&!silent)this.audio?.hit(!!(b&&b.bounces>0));
    if(damage>0)this.s.floating.push({x:e.x,y:e.y-4,text:`${damage.toFixed(1)}`,life:.42,color:(b&&((b.slowBuff||0)>0||(b.burnBuff||0)>0||(b.prismBuff||0)>0))?'#8cf7ff':'rgba(255,255,255,.68)'});
    if(e.hp<=0)this.killEnemy(e);
    return true;
  }
  killEnemy(e){
    if(e.dead)return;e.dead=true;this.audio?.kill();const g=this.s.game,p=this.s.player;g.kills++;const points=90+g.combo*8,baseCoin=e.coinValue??1,coin=baseCoin<=0?0:Math.max(1,Math.round(baseCoin*p.coinGain));g.score+=points;g.coins+=coin;g.xp+=p.expGain;g.combo=Math.min(99,g.combo+1);g.comboT=1.4;if(coin>0)this.s.floating.push({x:e.x,y:e.y,text:`+${coin}¢`,life:.8,color:COLORS.gold});
    for(let i=0;i<(e.type==='titan'?28:14);i++){const a=rand(0,TAU),sp=rand(30,e.type==='titan'?190:145);this.s.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.25,.7),max:.7,size:rand(1.2,e.type==='titan'?5:3.4),kind:e.type})}
    if(e.type==='splitter')for(let k=0;k<2;k++)this.s.enemies.push({eid:`e${this.enemyUid++}`,x:e.x+(k?10:-10),y:e.y,r:9,hp:Math.max(1.6,e.maxHp*.34),maxHp:Math.max(1.6,e.maxHp*.34),type:'mini',speed:e.speed,coinValue:0,vx:k?26:-26,t:0,phase:rand(0,TAU),spin:k?.9:-.9,dead:false,protected:0,slowT:0,slowFactor:1,slowStacks:0,burnT:0,burnDps:0,burnStacks:0,regenRate:0,spawnT:0,spawnMax:0});
    if(g.xp>=g.nextXp&&g.state==='playing'){g.xp-=g.nextXp;g.nextXp=Math.floor(g.nextXp*1.40+3);this.openRecruit({free:true,source:'xp'})}
  }

  applySupportFieldBullet(b){
    for(const sup of this.fighters()){
      if(sup.type!=='support')continue;
      const range=supportRange(sup),inside=Math.hypot(b.x-sup.x,b.y-sup.y)<=range;
      const was=b.fieldContacts?.[sup.uid];
      if(inside&&!was){
        const type=supportFieldType(sup),power=supportFieldStrength(sup);
        if(type==='ice')b.slowBuff=Math.min(12,(b.slowBuff||0)+power);
        else if(type==='fire')b.burnBuff=Math.min(20,(b.burnBuff||0)+power);
        else if(type==='prism'){b.prismBuff=(b.prismBuff||0)+1;b.hitCount=Math.min(20,(b.hitCount||0)+power);b.life=Math.min((b.maxLife||b.life)+2,b.life+.9*power)}
        b.fieldContacts[sup.uid]=true;
        const color=type==='fire'?COLORS.burn:type==='prism'?COLORS.prism:COLORS.slow;
        this.s.rings.push({x:b.x,y:b.y,r:4,max:18,t:0,life:.18,color});
      }else if(!inside&&was){
        b.fieldContacts[sup.uid]=false;
      }
    }
  }

  spawnSplitFragments(b){
    if(!((b.slowBuff||0)||(b.burnBuff||0)||(b.prismBuff||0)))return;
    const base=Math.atan2(b.vy,b.vx);
    for(const off of[-.30,.30]){
      const sp=this.s.player.bulletSpeed*.76;
      this.s.bullets.push({x:b.x,y:b.y,vx:Math.cos(base+off)*sp,vy:Math.sin(base+off)*sp,r:3.2,life:2.0,maxLife:2.0,dead:false,bounces:b.bounces,hitCount:1,damage:0,splitDone:true,isSplit:true,slowBuff:b.slowBuff,burnBuff:b.burnBuff,prismBuff:b.prismBuff||0,kind:'normal',explosive:0,trailScale:1,sourceSplit:0,sourceChain:0,sourceHoming:0,fieldContacts:{},hitLocks:{}})
    }
  }

  openFighterUpgradeSelected(){
    const g=this.s.game,f=this.getSelectedFighter();if(!f||!['playing','intermission'].includes(g.state)||f.level>=4)return false;
    const cost=fighterUpgradeCost(f);if(g.coins<cost)return false;
    const choices=fighterUpgradeChoices(f,3);if(!choices.length)return false;
    g.resumeState=g.state;g.upgradeTarget=f.uid;g.upgradeCost=cost;g.upgradeChoices=choices;g.state='upgrade';this.audio?.upgradeReady();this.ui?.showUpgrades?.(choices,f,cost);
    const token=++this.upgradeRevealToken;choices.forEach((_,i)=>setTimeout(()=>{if(g.state==='upgrade'&&this.upgradeRevealToken===token)this.audio?.upgradeCard(i)},100+i*150));return true;
  }
  applyFighterUpgrade(f,u,{announce=true,levelUp=true}={}){if(!f||!u)return false;u.apply(f);f.tuneLevels=f.tuneLevels||{};f.tuneLevels[u.id]=(f.tuneLevels[u.id]||0)+1;if(levelUp)f.level=Math.min(4,(f.level||1)+1);if(announce){this.audio?.uiConfirm();this.banner(`${FIGHTER_TYPES[f.type].short} · ${u.name}`,1)}return true}
  chooseUpgrade(i){const g=this.s.game,f=this.getFighter(g.upgradeTarget),u=g.upgradeChoices[i],cost=g.upgradeCost||fighterUpgradeCost(f);if(!f||!u||g.coins<cost)return false;g.coins-=cost;this.applyFighterUpgrade(f,u);g.upgradeChoices=[];g.upgradeTarget=null;g.upgradeCost=0;g.state=g.resumeState||'playing';return true}
  cancelUpgrade(){const g=this.s.game;if(g.state==='upgrade'){g.upgradeChoices=[];g.upgradeTarget=null;g.upgradeCost=0;g.state=g.resumeState||'playing'}}

  openRecruit({free=false,source='shop'}={}){
    const g=this.s.game;if(!['playing','intermission'].includes(g.state)||(this.fighterCapacityFull()&&!free)||(!free&&g.coins<g.shopCost))return false;
    if(free&&this.fighterCapacityFull()){g.coins+=8;this.banner('阵地已满 · 战机奖励转化 +8¢',1.2);return false}
    g.resumeState=g.state;g.recruitFree=!!free;g.recruitSource=source;
    const keys=source==='starter'?['scatter','laser','pierce','aoe']:Object.keys(FIGHTER_TYPES),pool=[...keys].sort(()=>Math.random()-.5);
    g.recruitChoices=pool.slice(0,3).map(t=>makeFighter(t));g.state='recruit';this.audio?.upgradeReady();this.ui?.showRecruit?.(this.s);return true;
  }
  cancelRecruit(){const g=this.s.game;if(g.state==='recruit'&&!g.recruitFree){g.state=g.resumeState||'playing';g.recruitChoices=[];g.recruitSource='shop'}}
  chooseRecruit(i){
    const g=this.s.game,f=g.recruitChoices[i];if(!f||this.fighterCapacityFull())return false;
    if(!g.recruitFree){if(g.coins<g.shopCost)return false;g.coins-=g.shopCost;g.shopBuys++;g.shopCost=Math.min(BALANCE.shopCostCap,BALANCE.shopBaseCost+g.shopBuys*BALANCE.shopCostStep)}
    const wasFree=g.recruitFree,source=g.recruitSource;g.pendingFighter=f;g.pendingRecruitSource=source;g.recruitChoices=[];g.recruitFree=false;g.state='placing';g.placementX=VIEW.width/2;g.placementY=540;this.audio?.uiConfirm();
    this.banner(source==='starter'?'选择位置部署首架战机':wasFree?'EXP 奖励 · 放置新战机':'点击战场放置战机',1.4);return true;
  }
  setPlacementPreview(x,y){const a=BALANCE.placement;this.s.game.placementX=clamp(x,a.minX,a.maxX);this.s.game.placementY=clamp(y,a.minY,a.maxY)}
  placementValid(x,y){return !this.fighters().some(f=>Math.hypot(f.x-x,f.y-y)<34)}
  defaultAimForPosition(x,y){
    const center=VIEW.width/2;let left=x<center;if(Math.abs(x-center)<18)left=Math.random()<.5;
    const targetX=left?4:VIEW.width-4,targetY=Math.max(88,y-125);
    let a=Math.atan2(targetY-y,targetX-x);if(a>-.18)a=-.18;return clamp(a,-Math.PI+.18,-.18);
  }
  placePending(x,y){
    const g=this.s.game,f=g.pendingFighter;if(g.state!=='placing'||!f)return false;this.setPlacementPreview(x,y);x=g.placementX;y=g.placementY;if(!this.placementValid(x,y)){this.banner('位置太近，换个地方',.8);return false}
    f.x=x;f.y=y;f.aimAngle=f.type==='support'?-Math.PI/2:this.defaultAimForPosition(x,y);f.fireTimer=.15;this.fighters().push(f);this.s.fighters.selectedUid=f.uid;
    const firstRun=g.wave===0;g.pendingFighter=null;g.pendingRecruitSource=null;g.recruitSource='shop';g.state=g.resumeState||'playing';this.audio?.upgradeCard?.(0);
    if(firstRun){this.startWave();this.banner(`部署 ${FIGHTER_TYPES[f.type].short} · 开始突围`,1.1)}else this.banner(`部署 ${FIGHTER_TYPES[f.type].short} · ★`,1);return true;
  }

  selectFighter(uid){if(this.getFighter(uid)){this.s.fighters.selectedUid=uid;return true}return false}
  findFighterAt(x,y,r=24){let best=null,bd=r;for(const f of this.fighters()){const d=Math.hypot(f.x-x,f.y-y);if(d<bd){best=f;bd=d}}return best}
  nearestFighter(uid,maxDist=BALANCE.mergeRadius){const src=this.getFighter(uid);if(!src)return null;let best=null,bd=maxDist;for(const f of this.fighters()){if(f.uid===uid)continue;const d=Math.hypot(f.x-src.x,f.y-src.y);if(d<bd){best=f;bd=d}}return best}
  moveFighter(uid,x,y){const f=this.getFighter(uid);if(!f)return false;const a=BALANCE.placement;f.x=clamp(x,a.minX,a.maxX);f.y=clamp(y,a.minY,a.maxY);return true}
  setFighterAim(uid,x,y){const f=this.getFighter(uid);if(!f||f.type==='support')return false;let a=Math.atan2(y-f.y,x-f.x);if(a>-.08)a=-.08;a=clamp(a,-Math.PI+.08,-.08);f.aimAngle=a;return true}
  getAimHandle(uid=this.s.fighters.selectedUid){const f=this.getFighter(uid);if(!f||f.type==='support')return null;const d=BALANCE.aimHandleDistance;return{x:f.x+Math.cos(f.aimAngle)*d,y:f.y+Math.sin(f.aimAngle)*d}}
  tryMerge(uid){
    const src=this.getFighter(uid),target=this.nearestFighter(uid);if(!src||!target||!sameMergeFamily(src,target))return null;
    mergeFighterProgress(target,src);target.fireTimer=.08;this.s.fighters.battle=this.fighters().filter(f=>f.uid!==src.uid);this.s.fighters.selectedUid=target.uid;this.audio?.upgradeCard?.(1);this.s.rings.push({x:target.x,y:target.y,r:9,max:38,t:0,life:.34,color:FIGHTER_TYPES[target.type].accent});this.banner(`${FIGHTER_TYPES[target.type].short} · ${'★'.repeat(target.star)} · LV.${target.level}`,1.1);return target;
  }
  hasCollision(uid,minDist=25){const src=this.getFighter(uid);if(!src)return false;return this.fighters().some(f=>f.uid!==uid&&Math.hypot(f.x-src.x,f.y-src.y)<minDist)}

  openSelectedFighterAction(){
    const f=this.getSelectedFighter();if(!f)return false;
    if((f.level||1)<4)return this.openFighterUpgradeSelected();
    if(fighterCanEvolve(f))return this.openEvolveSelected();
    this.banner('该战机已达到当前形态上限',.8);return false;
  }

  openEvolveSelected(){
    const g=this.s.game,f=this.getSelectedFighter();if(!['playing','intermission'].includes(g.state)||!fighterCanEvolve(f)||g.coins<BALANCE.evolveCost)return false;
    g.resumeState=g.state;g.evolveTarget=f.uid;g.evolveChoices=FIGHTER_TYPES[f.type].evolves;g.state='evolve';this.audio?.upgradeReady();this.ui?.showEvolve?.(this.s,f,g.evolveChoices);return true;
  }
  cancelEvolve(){const g=this.s.game;if(g.state==='evolve'){g.state=g.resumeState||'playing';g.evolveChoices=[];g.evolveTarget=null}}
  chooseEvolution(i){const g=this.s.game,f=this.getFighter(g.evolveTarget),opt=g.evolveChoices[i];if(!f||!opt||g.coins<BALANCE.evolveCost)return false;g.coins-=BALANCE.evolveCost;f.evolution=opt.id;f.level=1;f.fireTimer=.05;g.evolveChoices=[];g.evolveTarget=null;g.state=g.resumeState||'playing';this.audio?.breakthrough();this.banner(`EVOLVE · ${opt.tag}`,1.25);return true}

  repairCore(){const g=this.s.game;if(!['playing','intermission'].includes(g.state)||g.core>=BALANCE.maxCore||g.coins<g.repairCost)return false;g.coins-=g.repairCost;g.core++;g.repairBuys++;g.repairCost=BALANCE.repairBaseCost+g.repairBuys*BALANCE.repairCostStep;this.audio?.uiConfirm();this.banner('CORE REPAIRED',.9);return true}
  enterIntermission(){
    const g=this.s.game;g.waveActive=false;g.breakthrough=1.2;
    if(g.wave>=BALANCE.totalWaves){this.completeRun();return}
    const cleared=g.wave,bonus=2+Math.floor(cleared/5);g.score+=350+cleared*65;g.coins+=bonus;g.rewardText=`WAVE ${cleared}/${BALANCE.totalWaves} CLEAR · +${bonus}¢`;this.audio?.breakthrough();
    const preserveState=['recruit','placing'].includes(g.state)&&g.resumeState==='playing';
    this.startWave({silent:true,preserveState});this.banner(`WAVE ${cleared} CLEAR  ·  WAVE ${g.wave}`,1.0);
  }
  completeRun(){const g=this.s.game;g.state='victory';g.waveActive=false;g.score+=5000;this.audio?.breakthrough();this.banner('CHAPTER CLEAR',2);this.ui?.showVictory?.(this.s)}

  update(dt){
    const s=this.s,g=s.game;if(g.gmPaused)return;g.time+=dt;g.flash=Math.max(0,g.flash-dt*2);g.shake=Math.max(0,g.shake-dt*15);g.bannerT=Math.max(0,g.bannerT-dt);if(g.comboT>0){g.comboT-=dt;if(g.comboT<=0)g.combo=0}
    for(const st of s.stars){st.y+=st.v*dt;if(st.y>VIEW.height){st.y=-2;st.x=rand(0,VIEW.width)}}
    // Buying/recruiting/placing fighters no longer pauses combat. Starter selection still happens before Wave 1.
    const liveOverlay=['recruit','placing'].includes(g.state)&&g.resumeState==='playing'&&g.wave>0;
    if(g.state!=='playing'&&!liveOverlay){this.updateFx(dt);return}

    this.fireFighters(dt);g.waveElapsed+=dt;g.spawnTimer-=dt;
    if(g.waveActive&&g.enemySpawned<g.enemyQuota&&g.spawnTimer<=0){this.spawnEnemy();const remain=Math.max(1,g.enemyQuota-g.enemySpawned),timeRemain=Math.max(.5,g.waveDuration-g.waveElapsed);g.spawnTimer=Math.max(BALANCE.minSpawnInterval,timeRemain/remain*rand(.74,1.30))}
    if(g.wave%10===0&&!g.bossSpawned&&g.waveElapsed>=g.waveDuration*.62){g.bossSpawned=true;this.spawnEnemy('titan',false);this.banner(`TITAN · WAVE ${g.wave}`,1)}
    for(const e of s.enemies)e.protected=0;
    for(const w of s.enemies){if(w.dead||w.type!=='warden')continue;for(const e of s.enemies){if(e.dead||e===w)continue;if(Math.hypot(e.x-w.x,e.y-w.y)<92)e.protected=1}}

    for(const b of s.bullets){
      if(b.dead)continue;
      b.life-=dt;if(b.life<=0){b.dead=true;continue}
      if(b.hitLocks){for(const k of Object.keys(b.hitLocks)){b.hitLocks[k]-=dt;if(b.hitLocks[k]<=0)delete b.hitLocks[k]}}
      // MAGNET enemies bend nearby projectile paths without auto-targeting for the player.
      for(const m of s.enemies){
        if(m.dead||m.spawnT>0||m.type!=='magnet')continue;
        const dx=m.x-b.x,dy=m.y-b.y,dist=Math.hypot(dx,dy),range=m.gravity||105;
        if(dist>8&&dist<range){const pull=(1-dist/range)*230; b.vx+=dx/dist*pull*dt; b.vy+=dy/dist*pull*dt}
      }
      if((b.sourceHoming||0)>0){let target=null,bd=110+(b.sourceHoming||0)*20;for(const e of s.enemies){if(e.dead)continue;const d=Math.hypot(e.x-b.x,e.y-b.y);if(d<bd){bd=d;target=e}}if(target){const ta=Math.atan2(target.y-b.y,target.x-b.x),cur=Math.atan2(b.vy,b.vx),diff=((ta-cur+Math.PI*3)%TAU)-Math.PI,sp=Math.hypot(b.vx,b.vy),na=cur+diff*dt*(.6+(b.sourceHoming||0)*.18);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp}}

      b.x+=b.vx*dt;b.y+=b.vy*dt;
      let wall='';
      if(b.x<b.r&&b.vx<0){b.x=b.r;b.vx=Math.abs(b.vx);wall='left'}
      else if(b.x>VIEW.width-b.r&&b.vx>0){b.x=VIEW.width-b.r;b.vx=-Math.abs(b.vx);wall='right'}
      if(b.y<b.r&&b.vy<0){b.y=b.r;b.vy=Math.abs(b.vy);wall=wall||'top'}
      if(wall){b.bounces++;this.audio?.ricochet(wall,b.bounces);const color=wall==='top'?'#d9f7ff':'rgba(140,247,255,.8)';s.rings.push({x:b.x,y:b.y,r:3,max:25,t:0,life:.18,color})}
      if(b.y>BALANCE.projectileBottom){b.dead=true;continue}

      this.applySupportFieldBullet(b);

      for(const e of s.enemies){
        if(e.dead||b.dead||e.spawnT>0)continue;
        if(b.hitLocks?.[e.eid])continue;
        const rr=e.r+b.r;if((e.x-b.x)**2+(e.y-b.y)**2>rr*rr)continue;
        const dmg=this.impactDamage(b),did=this.hitEnemy(e,dmg,b);
        if(did){
          if((b.explosive||0)>0)this.explode(b.x,b.y,b.explosive,dmg,e);
          if((b.sourceChain||0)>0)this.chainFrom(e,Math.min(4,b.sourceChain||0),dmg);
          if((b.sourceSplit||0)>0&&!b.splitDone&&((b.slowBuff||0)||(b.burnBuff||0)||(b.prismBuff||0))){b.splitDone=true;this.spawnSplitFragments(b)}
          b.hitCount--;
          b.hitLocks[e.eid]=.10;
          if(b.hitCount<=0)b.dead=true;
        }
      }
    }

    for(const e of s.enemies){
      if(e.dead)continue;e.t+=dt;
      if(e.spawnT>0){e.spawnT=Math.max(0,e.spawnT-dt);continue}
      if(e.burnT>0){e.burnT-=dt;e.hp-=e.burnDps*dt;if(Math.random()<dt*10)s.particles.push({x:e.x+rand(-e.r,e.r),y:e.y+rand(-e.r,e.r),vx:rand(-8,8),vy:rand(-35,-15),life:.35,max:.35,size:rand(1,3),kind:'burnfx'});if(e.hp<=0){this.killEnemy(e);continue}}else{e.burnStacks=0;e.burnDps=0}
      if(e.regenRate>0&&e.burnT<=0)e.hp=Math.min(e.maxHp,e.hp+e.regenRate*dt);
      if(e.slowT>0){e.slowT-=dt;e.slowFactor=Math.max(.18,1-e.slowStacks*.075)}else{e.slowFactor=1;e.slowStacks=0}
      if(e.type==='drifter'){e.x+=e.vx*dt;if(e.x<22||e.x>VIEW.width-22)e.vx*=-1}
      else if(e.type==='spinner')e.x+=Math.sin(e.t*2.8+e.phase)*26*dt;
      else if(e.type==='shield')e.x+=Math.sin(e.t*1.2+e.phase)*8*dt;
      else if(e.type==='warden')e.x+=Math.sin(e.t*.8+e.phase)*10*dt;
      else if(e.type==='magnet')e.x+=Math.sin(e.t*.95+e.phase)*9*dt;
      else if(e.type==='bumper')e.x+=Math.sin(e.t*2.1+e.phase)*15*dt;
      const pressure=Math.min(BALANCE.enemyPressureCap,1+g.wave*BALANCE.enemyPressurePerWave);
      const gait=.92+.16*(.5+.5*Math.sin(e.t*3.2+e.phase));
      const pulseStep=e.type==='pulse'?(.55+.95*(.5+.5*Math.sin(e.t*5.2+e.phase))):1;
      e.y+=e.speed*pressure*e.slowFactor*gait*pulseStep*dt;
      if(e.y>VIEW.height-103){e.dead=true;if(!g.gmInvincible)g.core--;this.audio?.coreHit();g.flash=1;g.shake=9;if(g.core<=0){g.state='gameover';this.audio?.gameOver()}}
    }
    if((g.state==='playing'||liveOverlay)&&g.waveActive&&g.enemySpawned>=g.enemyQuota&&(g.wave%10!==0||g.bossSpawned)&&!s.enemies.some(e=>!e.dead))this.enterIntermission();
    this.updateFx(dt);
  }

  updateFx(dt){const s=this.s;for(const p of s.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985}for(const r of s.rings)r.t+=dt;for(const f of s.floating){f.life-=dt;f.y-=25*dt}compactByFlag(s.bullets,'dead');compactByFlag(s.enemies,'dead');compactByLife(s.particles);for(let i=s.rings.length-1;i>=0;i--)if(s.rings[i].t>=s.rings[i].life)s.rings.splice(i,1);compactByLife(s.floating)}

  // GM helpers
  gmUpgrade(id){const f=this.getSelectedFighter(),u=UPGRADES.find(v=>v.id===id);if(!f||!u||(u.available&&!u.available(f)))return false;this.applyFighterUpgrade(f,u,{announce:false,levelUp:false});this.banner(`GM · ${FIGHTER_TYPES[f.type].short} · ${u.name} +1`,.75);return f.tuneLevels?.[id]||1}
  gmKillWave(){const g=this.s.game;for(const e of this.s.enemies)e.dead=true;this.s.enemies.length=0;g.enemySpawned=g.enemyQuota;g.bossSpawned=true;this.enterIntermission()}
  gmJumpWave(target){const g=this.s.game,n=clamp(Math.floor(Number(target)||1),1,BALANCE.totalWaves);this.s.enemies.length=this.s.bullets.length=0;g.state='playing';g.waveActive=false;g.wave=n-1;this.startWave();this.banner(`GM · WAVE ${n}`,.8);return n}
  gmTriggerUpgrade(){if(['title','gameover','victory'].includes(this.s.game.state))this.s.game.state='playing';return this.openRecruit({free:true,source:'gm'})}
  gmAddXp(amount=10){const g=this.s.game;g.xp+=Math.max(0,Number(amount)||0);if(g.state==='playing'&&g.xp>=g.nextXp){g.xp-=g.nextXp;g.nextXp=Math.floor(g.nextXp*1.40+3);this.openRecruit({free:true,source:'xp'})}return g.xp}
  gmAddCoins(amount=100){this.s.game.coins+=Math.max(0,Number(amount)||0);return this.s.game.coins}
  gmRestoreCore(){this.s.game.core=BALANCE.maxCore}
  gmClearBullets(){this.s.bullets.length=0}
  gmTogglePause(){this.s.game.gmPaused=!this.s.game.gmPaused;return this.s.game.gmPaused}
  gmToggleInvincible(){this.s.game.gmInvincible=!this.s.game.gmInvincible;return this.s.game.gmInvincible}
  gmSetFireCd(v){const f=this.getSelectedFighter();if(!f)return 0;f.gmCdOverride=clamp(Number(v)||.6,.05,3);return f.gmCdOverride}
  gmSetRicochets(v){const f=this.getSelectedFighter();if(!f)return 0;f.gmRicochetsOverride=clamp(Math.floor(Number(v)||1),1,20);return f.gmRicochetsOverride}
  gmSetTimeScale(v){this.s.game.gmTimeScale=clamp(Number(v)||1,.25,8);return this.s.game.gmTimeScale}
  gmResetBuild(){const f=this.getSelectedFighter();if(!f)return;f.mods={hitCount:0,life:0,pierce:0,split:0,explosive:0,chain:0,homing:0,extraShots:0,fireRate:0,damage:0,bulletSize:0,ballSpeed:0,supportPower:0,supportRange:0};f.tuneLevels={};f.level=1;delete f.gmCdOverride;delete f.gmRicochetsOverride}
  gmMaxWalls(){const f=this.getSelectedFighter();if(!f)return;if(f.type==='support'){f.mods.supportPower=5;f.mods.supportRange=5}else{f.mods.hitCount=5;f.mods.life=5}}
  gmSpawnEnemy(type){this.spawnEnemy(type,false)}
}
