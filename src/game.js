import { VIEW, BALANCE, COLORS } from './config.js';
import { TAU, rand, clamp, lerp, compactByFlag, compactByLife } from './utils.js';
import { UPGRADES } from './upgrades.js';

export class Game{
  constructor(state,ui,audio){this.s=state;this.ui=ui;this.audio=audio;this.waveTransitionToken=0;for(let i=0;i<90;i++)state.stars.push({x:rand(0,VIEW.width),y:rand(0,VIEW.height),s:rand(.4,1.8),a:rand(.15,.8),v:rand(4,18)})}
  reset(){const s=this.s,g=s.game,p=s.player;Object.assign(g,{state:'playing',time:0,score:0,kills:0,wave:0,xp:0,nextXp:8,core:3,shake:0,flash:0,breakthrough:0,spawnTimer:0,enemyQuota:0,enemySpawned:0,waveActive:false,aimAngle:-Math.PI/2,upgradeChoices:[],banner:'',bannerT:0,combo:0,comboT:0,burstBuff:0,upgradeLevels:{},gmPaused:false,gmInvincible:false,gmTimeScale:1});Object.assign(p,{x:VIEW.width/2,y:VIEW.height-74,r:18,fireCd:BALANCE.baseFireCd,fireTimer:0,damage:BALANCE.baseDamage,bulletSpeed:470,bulletSize:5,ricochets:1,pierce:0,shots:1,spread:.11,explosive:0,split:0,chain:0,homing:0,trail:1,slowWall:0,burnWall:0});s.bullets.length=s.enemies.length=s.particles.length=s.rings.length=s.floating.length=0;this.waveTransitionToken++;this.startWave()}
  startWave(){const g=this.s.game;this.waveTransitionToken++;g.wave++;g.waveActive=true;g.enemySpawned=0;g.enemyQuota=Math.min(BALANCE.waveBaseQuota+g.wave*BALANCE.waveQuotaPerWave,BALANCE.waveQuotaCap);g.spawnTimer=.28;this.banner(`WAVE ${g.wave}`,1.2)}
  banner(text,time=1.1){this.s.game.banner=text;this.s.game.bannerT=time}
  formationX(i,count,type){const m=48;if(type===0)return lerp(m,VIEW.width-m,(i+.5)/count)+Math.sin(i*1.7)*12;if(type===1)return VIEW.width/2+Math.sin(i/(Math.max(1,count-1))*Math.PI*2)*130;return lerp(m,VIEW.width-m,(i+.5)/count)}
  spawnEnemy(forcedType=null,countTowardWave=true){
    const s=this.s,g=s.game,n=g.enemySpawned,q=g.enemyQuota,d=g.wave,x=this.formationX(n,q,d%3);
    let type=forcedType||'grunt',roll=Math.random();
    if(!forcedType&&d>=2&&roll<.14)type='shield';
    else if(!forcedType&&d>=2&&roll<.27)type='spinner';
    else if(!forcedType&&d>=3&&roll<.39)type='splitter';
    else if(!forcedType&&d>=4&&roll<.50)type='pulse';
    else if(!forcedType&&d>=4&&roll<.60)type='warden';
    else if(!forcedType&&d>=5&&roll<.70)type='drifter';

    let hp=BALANCE.enemyBaseHp+Math.max(0,d-1)*BALANCE.enemyHpPerWave,radius=15,speed=BALANCE.enemyBaseSpeed+Math.min(BALANCE.enemySpeedWaveCap,d*BALANCE.enemySpeedPerWave);
    if(type==='shield'){hp*=1.35;radius=18;speed*=.78}
    if(type==='spinner'){hp*=1.08;radius=16;speed*=.94}
    if(type==='splitter'){hp*=1.24;radius=17;speed*=.86}
    if(type==='pulse'){hp*=1.18;radius=16;speed*=.88}
    if(type==='warden'){hp*=1.65;radius=19;speed*=.68}
    if(type==='drifter'){hp*=1.05;radius=14;speed*=1.02}

    hp=Math.round(hp*2)/2;
    s.enemies.push({
      x:clamp(x,28,VIEW.width-28),y:-35-rand(0,60),r:radius,hp,maxHp:hp,type,speed,
      vx:type==='drifter'?rand(-45,45):0,t:rand(0,10),phase:rand(0,TAU),spin:rand(-1.25,1.25)||.7,
      dead:false,protected:0,slowT:0,slowFactor:1,slowStacks:0,burnT:0,burnDps:0,burnStacks:0
    });
    if(countTowardWave)g.enemySpawned++;
  }
  shoot(angle=this.s.game.aimAngle,power=1,x=null,y=null,inheritedBounces=0,slow=0,burn=0,isSplit=false){
    const p=this.s.player,sp=p.bulletSpeed*power;
    if(x===null||y===null){const muzzle=24;x=p.x+Math.cos(angle)*muzzle;y=p.y+Math.sin(angle)*muzzle}
    this.s.bullets.push({x,y,vx:Math.cos(angle)*sp,vy:Math.sin(angle)*sp,r:p.bulletSize*(isSplit?.72:1),life:isSplit?2.7:4.5,dead:false,bounces:inheritedBounces,maxBounces:p.ricochets,pierce:isSplit?0:p.pierce,damage:isSplit?0:p.damage,splitDone:isSplit,isSplit,slowBuff:slow,burnBuff:burn})
  }
  impactDamage(b){const p=this.s.player;if(b.isSplit)return 0;if(b.bounces<=0)return b.damage*BALANCE.directMultiplier;const per=BALANCE.reflectedPerBounce+(p.trail-1)*BALANCE.wallResonancePerLevel;return b.damage*(BALANCE.reflectedBase+b.bounces*per)}
  fireVolley(){const p=this.s.player,a=this.s.game.aimAngle,mx=p.x+Math.cos(a)*24,my=p.y+Math.sin(a)*24;this.audio?.shoot();for(let i=0;i<p.shots;i++)this.shoot(a+(i-(p.shots-1)/2)*p.spread);this.s.rings.push({x:mx,y:my,r:6,max:28,t:0,life:.14});this.s.game.shake=Math.max(this.s.game.shake,1.5)}
  explode(x,y,power,damage,exclude=null){const radius=34+power*10;this.s.rings.push({x,y,r:6,max:radius,t:0,life:.28});for(let i=0;i<14+power*3;i++){const a=rand(0,TAU),sp=rand(45,160);this.s.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.2,.5),max:.5,size:rand(1,3),kind:'spark'})}for(const e of this.s.enemies){if(e.dead||e===exclude)continue;if(Math.hypot(e.x-x,e.y-y)<radius+e.r)this.hitEnemy(e,Math.max(.08,damage*.45),null,true)}}
  chainFrom(source,count,damage){let cur=source,used=new Set([source]);for(let n=0;n<count;n++){let best=null,bd=115;for(const e of this.s.enemies){if(e.dead||used.has(e))continue;const d=Math.hypot(e.x-cur.x,e.y-cur.y);if(d<bd){bd=d;best=e}}if(!best)break;this.s.rings.push({x:cur.x,y:cur.y,x2:best.x,y2:best.y,r:0,max:0,t:0,life:.12,kind:'arc'});this.hitEnemy(best,Math.max(.08,damage*.42),null,true);used.add(best);cur=best}}
  applyBuffs(e,b){if(!b)return;if(b.slowBuff>0){this.audio?.buff('slow',b.slowBuff);e.slowStacks=Math.min(BALANCE.maxSlowStacks,(e.slowStacks||0)+b.slowBuff);e.slowT=Math.min(6.5,Math.max(e.slowT||0,2.0)+.18*b.slowBuff);e.slowFactor=Math.max(.18,1-e.slowStacks*.075);this.s.rings.push({x:e.x,y:e.y,r:e.r*.75,max:e.r+12,t:0,life:.22,color:COLORS.slow})}if(b.burnBuff>0){this.audio?.buff('burn',b.burnBuff);e.burnStacks=Math.min(BALANCE.maxBurnStacks,(e.burnStacks||0)+b.burnBuff);e.burnT=Math.min(7.5,Math.max(e.burnT||0,2.2)+.20*b.burnBuff);e.burnDps=.16+e.burnStacks*.16;this.s.rings.push({x:e.x,y:e.y,r:e.r*.55,max:e.r+10,t:0,life:.2,color:COLORS.burn})}}
  hitEnemy(e,damage,b=null,special=false){if(e.dead)return false;if(e.protected>0&&e.type!=='warden')damage*=.35;if(e.type==='shield'&&b&&b.bounces===0){b.vx*=-.75;b.vy*=-.75;this.s.rings.push({x:e.x,y:e.y-6,r:e.r,max:e.r+14,t:0,life:.14});return false}this.applyBuffs(e,b);e.hp-=damage;if(damage>0)this.audio?.hit(!!(b&&b.bounces>0));if(damage>0)this.s.floating.push({x:e.x,y:e.y-4,text:`DMG ${damage.toFixed(2)}`,life:.48,color:b&&b.bounces>0?'#8cf7ff':'rgba(255,255,255,.7)'});if(e.hp<=0)this.killEnemy(e);return true}
  killEnemy(e){if(e.dead)return;e.dead=true;this.audio?.kill();const g=this.s.game;g.kills++;const points=100+g.combo*12;g.score+=points;g.xp++;g.combo=Math.min(99,g.combo+1);g.comboT=1.4;this.s.floating.push({x:e.x,y:e.y,text:`SCORE +${points}`,life:.7});for(let i=0;i<16;i++){const a=rand(0,TAU),sp=rand(35,160);this.s.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand(.25,.7),max:.7,size:rand(1.2,3.5),kind:e.type})}this.s.rings.push({x:e.x,y:e.y,r:e.r*.5,max:e.r*2.4,t:0,life:.25});g.shake=Math.max(g.shake,4);if(e.type==='splitter')for(let k=0;k<2;k++)this.s.enemies.push({x:e.x+(k?10:-10),y:e.y,r:9,hp:Math.max(1.25,e.maxHp*.34),maxHp:Math.max(1.25,e.maxHp*.34),type:'mini',speed:e.speed*1.04,vx:k?35:-35,t:0,phase:rand(0,TAU),spin:k?.9:-.9,dead:false,protected:0,slowT:0,slowFactor:1,slowStacks:0,burnT:0,burnDps:0,burnStacks:0});if(g.xp>=g.nextXp&&g.state==='playing'){g.xp-=g.nextXp;g.nextXp=Math.floor(g.nextXp*1.38+2);this.openUpgrade()}}
  openUpgrade(){
    const g=this.s.game,p=this.s.player;g.state='upgrade';
    const available=UPGRADES.filter(u=>!u.available||u.available(p));
    let choices=[...available].sort(()=>Math.random()-.5).slice(0,3);
    if(p.slowWall===0&&p.burnWall===0){
      const wallChoices=available.filter(u=>u.id==='slowwall'||u.id==='burnwall');
      const wall=wallChoices[Math.floor(Math.random()*wallChoices.length)];
      const rest=available.filter(u=>u!==wall).sort(()=>Math.random()-.5).slice(0,2);
      choices=[wall,...rest].sort(()=>Math.random()-.5);
    }
    g.upgradeChoices=choices;this.audio?.upgradeReady();this.ui.showUpgrades(choices);
    const revealToken=(this.upgradeRevealToken||0)+1;this.upgradeRevealToken=revealToken;
    choices.forEach((_,i)=>setTimeout(()=>{
      if(this.s.game.state==='upgrade'&&this.upgradeRevealToken===revealToken)this.audio?.upgradeCard(i);
    },100+i*150));
  }
  applyUpgrade(u,{announce=true}={}){const g=this.s.game;if(!u)return false;u.apply(this.s.player);g.upgradeLevels??={};g.upgradeLevels[u.id]=(g.upgradeLevels[u.id]||0)+1;if(announce){this.audio?.uiConfirm();this.banner(u.name,1.1)}return true}
  chooseUpgrade(i){const g=this.s.game,u=g.upgradeChoices[i];if(!u)return;this.applyUpgrade(u);g.state='playing'}
  finishWave(delay=900){const g=this.s.game;if(!g.waveActive)return;g.waveActive=false;g.breakthrough=1.5;g.burstBuff=1.8;g.score+=500+g.wave*80;this.audio?.breakthrough();this.banner('BREAK THROUGH',1.4);g.flash=.35;const token=++this.waveTransitionToken;setTimeout(()=>{if(token===this.waveTransitionToken&&g.state!=='gameover'&&!g.waveActive)this.startWave()},delay)}
  gmUpgrade(id){const u=UPGRADES.find(v=>v.id===id);if(!u)return false;this.applyUpgrade(u,{announce:false});const lv=this.s.game.upgradeLevels?.[id]||1;this.audio?.uiConfirm();this.banner(`GM · ${u.name} +1`,.75);return lv}
  gmKillWave(){const g=this.s.game;if(g.wave<=0)this.startWave();g.state='playing';for(const e of this.s.enemies)e.dead=true;this.s.enemies.length=0;g.enemySpawned=g.enemyQuota;this.finishWave(420)}
  gmJumpWave(target){const g=this.s.game,n=clamp(Math.floor(Number(target)||1),1,999);this.waveTransitionToken++;this.s.enemies.length=this.s.bullets.length=this.s.particles.length=this.s.rings.length=this.s.floating.length=0;g.state='playing';g.waveActive=false;g.wave=n-1;g.enemySpawned=0;g.combo=0;g.comboT=0;this.startWave();this.banner(`GM · WAVE ${n}`,.8);return n}
  gmTriggerUpgrade(){const g=this.s.game;if(g.state==='title'||g.state==='gameover')g.state='playing';this.openUpgrade()}
  gmAddXp(amount=10){const g=this.s.game;g.xp+=Math.max(0,Number(amount)||0);if(g.state==='playing'&&g.xp>=g.nextXp){g.xp-=g.nextXp;g.nextXp=Math.floor(g.nextXp*1.38+2);this.openUpgrade()}return g.xp}
  gmRestoreCore(){this.s.game.core=3;this.banner('GM · CORE RESTORED',.7)}
  gmSetFireCd(value){this.s.player.fireCd=clamp(Number(value)||BALANCE.baseFireCd,.05,3);return this.s.player.fireCd}
  gmSetRicochets(value){this.s.player.ricochets=clamp(Math.floor(Number(value)||0),0,20);return this.s.player.ricochets}
  gmSetTimeScale(value){this.s.game.gmTimeScale=clamp(Number(value)||1,.1,5);return this.s.game.gmTimeScale}
  gmTogglePause(){const g=this.s.game;g.gmPaused=!g.gmPaused;this.banner(g.gmPaused?'GM · PAUSED':'GM · RESUME',.65);return g.gmPaused}
  gmToggleInvincible(){const g=this.s.game;g.gmInvincible=!g.gmInvincible;this.banner(g.gmInvincible?'GM · CORE GOD MODE':'GM · GOD MODE OFF',.7);return g.gmInvincible}
  gmClearBullets(){this.s.bullets.length=0;this.s.rings.length=0;this.banner('GM · BULLETS CLEARED',.6)}
  gmMaxWalls(){const p=this.s.player,g=this.s.game;p.slowWall=5;p.burnWall=5;g.upgradeLevels??={};g.upgradeLevels.slowwall=Math.max(5,g.upgradeLevels.slowwall||0);g.upgradeLevels.burnwall=Math.max(5,g.upgradeLevels.burnwall||0);this.banner('GM · WALL BUFF MAX',.7)}
  gmResetBuild(){const p=this.s.player,g=this.s.game;Object.assign(p,{fireCd:BALANCE.baseFireCd,damage:BALANCE.baseDamage,bulletSpeed:470,bulletSize:5,ricochets:1,pierce:0,shots:1,spread:.11,explosive:0,split:0,chain:0,homing:0,trail:1,slowWall:0,burnWall:0});g.upgradeLevels={};this.s.bullets.length=0;this.banner('GM · BUILD RESET',.7)}
  gmSpawnEnemy(type='grunt'){const allowed=['grunt','shield','spinner','splitter','pulse','warden','drifter'];if(!allowed.includes(type))type='grunt';const g=this.s.game;if(g.wave<=0){g.state='playing';this.startWave()}else if(g.state==='title'||g.state==='gameover')g.state='playing';this.spawnEnemy(type,false);this.banner(`GM · SPAWN ${type.toUpperCase()}`,.6)}
  updateAim(x,y){const p=this.s.player,dx=x-p.x,dy=y-(p.y-10);let a=Math.atan2(dy,dx);if(a>0)a=-Math.PI/2;this.s.game.aimAngle=clamp(a,-Math.PI+.18,-.18)}
  update(dt){const s=this.s,g=s.game,p=s.player;if(g.gmPaused)return;g.time+=dt;g.flash=Math.max(0,g.flash-dt*2);g.shake=Math.max(0,g.shake-dt*16);g.bannerT=Math.max(0,g.bannerT-dt);g.breakthrough=Math.max(0,g.breakthrough-dt);g.burstBuff=Math.max(0,g.burstBuff-dt);if(g.comboT>0){g.comboT-=dt;if(g.comboT<=0)g.combo=0}for(const st of s.stars){st.y+=st.v*dt*(g.breakthrough>0?2.8:1);if(st.y>VIEW.height){st.y=-3;st.x=rand(0,VIEW.width)}}if(g.state!=='playing')return;p.fireTimer-=dt;const cd=p.fireCd*(g.burstBuff>0?.62:1);if(p.fireTimer<=0){this.fireVolley();p.fireTimer=cd}if(g.waveActive){g.spawnTimer-=dt;if(g.enemySpawned<g.enemyQuota&&g.spawnTimer<=0){this.spawnEnemy();g.spawnTimer=Math.max(BALANCE.spawnIntervalMin,BALANCE.spawnIntervalStart-g.wave*.006)+Math.random()*.08}}for(const e of s.enemies)e.protected=0;for(const w of s.enemies){if(w.dead||w.type!=='warden')continue;for(const e of s.enemies)if(!e.dead&&e!==w&&Math.hypot(e.x-w.x,e.y-w.y)<90)e.protected=1}
    for(const b of s.bullets){if(b.dead)continue;b.life-=dt;if(b.life<=0){b.dead=true;continue}if(p.homing>0){let target=null,bd=120+p.homing*25;for(const e of s.enemies){if(e.dead)continue;const d=Math.hypot(e.x-b.x,e.y-b.y);if(d<bd){bd=d;target=e}}if(target){const ang=Math.atan2(target.y-b.y,target.x-b.x),cur=Math.atan2(b.vy,b.vx),diff=((ang-cur+Math.PI*3)%TAU)-Math.PI,sp=Math.hypot(b.vx,b.vy),na=cur+diff*dt*(.7+p.homing*.22);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp}}b.x+=b.vx*dt;b.y+=b.vy*dt;let bounced=false,wall='';if(b.x<b.r&&b.vx<0){b.x=b.r;b.vx=Math.abs(b.vx);bounced=true;wall='left'}if(b.x>VIEW.width-b.r&&b.vx>0){b.x=VIEW.width-b.r;b.vx=-Math.abs(b.vx);bounced=true;wall='right'}if(bounced){b.bounces++;this.audio?.ricochet(wall,b.bounces);b.vx*=1.03;b.vy*=1.03;if(wall==='left'&&p.slowWall>0)b.slowBuff+=p.slowWall;else if(wall==='right'&&p.burnWall>0)b.burnBuff+=p.burnWall;const wallColor=wall==='left'&&p.slowWall>0?COLORS.slow:wall==='right'&&p.burnWall>0?COLORS.burn:'#d9f7ff';this.s.rings.push({x:b.x,y:b.y,r:3,max:28,t:0,life:.22,color:wallColor});if(b.bounces>b.maxBounces){b.dead=true;continue}}if(b.y<-30||b.y>VIEW.height+30){b.dead=true;continue}for(const e of s.enemies){if(e.dead||b.dead)continue;const rr=e.r+b.r;if((e.x-b.x)**2+(e.y-b.y)**2<=rr*rr){const dmg=this.impactDamage(b),did=this.hitEnemy(e,dmg,b);if(did){if(!b.isSplit&&p.explosive>0)this.explode(b.x,b.y,p.explosive,dmg,e);if(!b.isSplit&&p.chain>0)this.chainFrom(e,Math.min(4,Math.ceil(p.chain)),dmg);if(!b.isSplit&&p.split>0&&!b.splitDone){b.splitDone=true;const base=Math.atan2(b.vy,b.vx),count=Math.min(4,p.split+1);for(let k=0;k<count;k++)this.shoot(base+(k-(count-1)/2)*.34,.78,b.x,b.y,b.bounces,b.slowBuff,b.burnBuff,true)}if(b.pierce>0)b.pierce--;else b.dead=true}}}}
    for(const e of s.enemies){if(e.dead)continue;e.t+=dt;if(e.burnT>0){e.burnT-=dt;e.hp-=e.burnDps*dt;if(Math.random()<dt*(8+Math.min(16,e.burnStacks)))s.particles.push({x:e.x+rand(-e.r,e.r),y:e.y+rand(-e.r,e.r),vx:rand(-10,10),vy:rand(-45,-18),life:.35,max:.35,size:rand(1.5,3.5),kind:'burnfx'});if(e.hp<=0){this.killEnemy(e);continue}}else{e.burnStacks=0;e.burnDps=0}if(e.slowT>0){e.slowT-=dt;e.slowFactor=Math.max(.18,1-e.slowStacks*.075);if(Math.random()<dt*(5+Math.min(10,e.slowStacks)))s.particles.push({x:e.x+rand(-e.r,e.r),y:e.y+rand(-e.r,e.r),vx:rand(-12,12),vy:rand(-10,10),life:.3,max:.3,size:rand(1,2.5),kind:'slowfx'})}else{e.slowFactor=1;e.slowStacks=0}if(e.type==='drifter'){e.x+=e.vx*dt;if(e.x<20||e.x>VIEW.width-20)e.vx*=-1}else if(e.type==='shield')e.x+=Math.sin(e.t*1.2+e.phase)*7*dt;else if(e.type==='warden')e.x+=Math.sin(e.t*.8+e.phase)*10*dt;else if(e.type==='spinner')e.x+=Math.sin(e.t*2.4+e.phase)*18*dt;else if(e.type==='pulse')e.x+=Math.sin(e.t*1.4+e.phase)*5*dt;const pressure=Math.min(BALANCE.enemyPressureCap,1+g.wave*BALANCE.enemyPressurePerWave);const walk=.92+.16*(.5+.5*Math.sin(e.t*3.5+e.phase));const pulseStep=e.type==='pulse'?(.62+.76*(.5+.5*Math.sin(e.t*4.6+e.phase))):1;e.y+=e.speed*pressure*(e.slowT>0?e.slowFactor:1)*walk*pulseStep*dt;if(e.y>VIEW.height-112){e.dead=true;if(!g.gmInvincible)g.core--;g.flash=1;g.shake=10;g.combo=0;this.audio?.coreHit();if(!g.gmInvincible&&g.core<=0){g.state='gameover';this.audio?.gameOver();this.banner('核心失守',2)}}}
    if(g.waveActive&&g.enemySpawned>=g.enemyQuota&&!s.enemies.some(e=>!e.dead))this.finishWave()
    for(const pt of s.particles){pt.life-=dt;pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.vx*=.985;pt.vy*=.985}for(const r of s.rings)r.t+=dt;for(const f of s.floating){f.life-=dt;f.y-=26*dt}compactByFlag(s.bullets);compactByFlag(s.enemies);compactByLife(s.particles);for(let i=s.rings.length-1;i>=0;i--)if(s.rings[i].t>=s.rings[i].life)s.rings.splice(i,1);compactByLife(s.floating)
  }
}
