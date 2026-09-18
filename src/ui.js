import { BALANCE } from './config.js';
import { FIGHTER_TYPES, fighterEvolutionMeta, fighterStats, fighterCanEvolve, fighterIsMax, fighterUpgradeCost, supportFieldType } from './fighters.js';

export class UI{
  constructor(){
    const $=s=>document.querySelector(s);
    this.score=$('#scoreValue');this.coins=$('#coinValue');this.wave=$('#waveValue');this.xpFill=$('#xpFill');this.coreDots=[...document.querySelectorAll('#coreDots i, #coreDots span')];
    if(!this.coreDots.length){const wrap=$('#coreDots');for(let i=0;i<BALANCE.maxCore;i++){const el=document.createElement('i');wrap.appendChild(el);this.coreDots.push(el)}}
    this.title=$('#titleScreen');this.upgrade=$('#upgradeScreen');this.prep=$('#prepScreen');this.recruit=$('#recruitScreen');this.evolve=$('#evolveScreen');this.gameover=$('#gameoverScreen');this.victory=$('#victoryScreen');
    this.banner=$('#banner');this.buyBtn=$('#battleBuyBtn');this.buyCost=$('#battleBuyCost');this.repairBtn=$('#battleRepairBtn');this.repairCost=$('#battleRepairCost');this.fighterActionBtn=$('#battleEvolveBtn');
    this.fighterCount=$('#fighterCount');this.selectedName=$('#selectedFighterName');this.selectedStars=$('#selectedFighterStars');this.selectedTrait=$('#selectedFighterTrait');this.waveStatus=$('#waveStatus');this.dock=$('#battleDock');this.placementHint=$('#placementHint');
    this.leftBadge=$('.left-badge');this.rightBadge=$('.right-badge');this.slow=$('#slowWallLevel');this.burn=$('#burnWallLevel');this.cd=$('#cdValue');this.bounce=$('#bounceValue');this.damage=$('#damageValue');
    this.soundToggle=$('#soundToggle');this.startBtn=$('#startBtn');this.restartBtn=$('#restartBtn');this.victoryRestartBtn=$('#victoryRestartBtn');
    this.upgradeEyebrow=$('#upgradeEyebrow');this.upgradeTitle=$('#upgradeTitle');this.upgradeSubtitle=$('#upgradeSubtitle');this.upgradeList=$('#upgradeList');
    this.recruitEyebrow=$('#recruitEyebrow');this.recruitTitle=$('#recruitTitle');this.recruitDesc=$('#recruitDesc');this.recruitList=$('#recruitList');this.recruitCancel=$('#recruitCancelBtn');
    this.evolveList=$('#evolveList');this.resultScore=$('#resultScore');this.resultWave=$('#resultWave');this.victoryScore=$('#victoryScore');
    this.last={};
  }

  bind(handlers){
    this.onStart=handlers.onStart;this.onRestart=handlers.onRestart;this.onUpgrade=handlers.onUpgrade;this.onSoundToggle=handlers.onSoundToggle;this.onOpenRecruit=handlers.onOpenRecruit;this.onChooseRecruit=handlers.onChooseRecruit;this.onCancelRecruit=handlers.onCancelRecruit;this.onFighterAction=handlers.onFighterAction;this.onChooseEvolve=handlers.onChooseEvolve;this.onCancelEvolve=handlers.onCancelEvolve;this.onRepairCore=handlers.onRepairCore;
    this.startBtn?.addEventListener('click',()=>this.onStart?.());this.restartBtn?.addEventListener('click',()=>this.onRestart?.());this.victoryRestartBtn?.addEventListener('click',()=>this.onRestart?.());this.soundToggle?.addEventListener('click',()=>this.onSoundToggle?.());
    this.buyBtn?.addEventListener('click',()=>this.onOpenRecruit?.());this.fighterActionBtn?.addEventListener('click',()=>this.onFighterAction?.());this.repairBtn?.addEventListener('click',()=>this.onRepairCore?.());this.recruitCancel?.addEventListener('click',()=>this.onCancelRecruit?.());document.querySelector('#evolveCancelBtn')?.addEventListener('click',()=>this.onCancelEvolve?.());
  }

  setText(el,key,value){if(!el)return;if(this.last[key]===value)return;this.last[key]=value;el.textContent=value}
  setSoundEnabled(v){if(this.soundToggle){this.soundToggle.textContent=v?'SFX ON':'SFX OFF';this.soundToggle.setAttribute('aria-pressed',String(v))}}
  selected(s){return s.fighters.battle.find(f=>f.uid===s.fighters.selectedUid)||null}
  refreshCombat(){}

  sync(s){
    const g=s.game,f=this.selected(s),stats=f?fighterStats(f,0):null;
    this.setText(this.score,'score',String(Math.floor(g.score)).padStart(6,'0'));this.setText(this.coins,'coins',String(g.coins));this.setText(this.wave,'wave',`${g.wave}/${g.maxWave}`);
    const xp=Math.min(100,g.nextXp?g.xp/g.nextXp*100:0);if(this.last.xp!==xp){this.last.xp=xp;this.xpFill.style.width=`${xp}%`}if(this.last.core!==g.core){this.last.core=g.core;this.coreDots.forEach((d,i)=>d.classList.toggle('active',i<g.core))}

    this.setText(this.slow,'slow','LEFT / RIGHT / TOP');this.setText(this.burn,'burn','PURE REFLECT');this.leftBadge?.classList.remove('buff-active');this.rightBadge?.classList.remove('buff-active');
    this.setText(this.cd,'cd',f?`${FIGHTER_TYPES[f.type].short} · ${'★'.repeat(f.star||1)} · LV.${f.level}`:`FIGHTERS ${s.fighters.battle.length}`);
    this.setText(this.bounce,'bounce',stats&&f?.type!=='support'?`HIT ${stats.hitCount}`:f?.type==='support'?`FIELD ${(supportFieldType(f)||'ice').toUpperCase()}`:'PINBALL LOOP');
    this.setText(this.damage,'damage',f?.type!=='support'&&stats?`DMG ${stats.damage.toFixed(2)} · SHOT ${stats.shots}`:'WALLS REFLECT FOREVER · BOTTOM DROPS');

    if(this.last.state!==g.state){this.last.state=g.state;this.title?.classList.toggle('visible',g.state==='title');this.upgrade?.classList.toggle('visible',g.state==='upgrade');this.recruit?.classList.toggle('visible',g.state==='recruit');this.evolve?.classList.toggle('visible',g.state==='evolve');this.gameover?.classList.toggle('visible',g.state==='gameover');this.victory?.classList.toggle('visible',g.state==='victory')}
    if(g.bannerT>0){this.setText(this.banner,'banner',g.banner);this.banner?.classList.add('visible')}else this.banner?.classList.remove('visible');
    if(g.state==='gameover'){this.setText(this.resultScore,'resultScore',String(Math.floor(g.score)).padStart(6,'0'));this.setText(this.resultWave,'resultWave',`到达 WAVE ${g.wave}/${g.maxWave}`)}
    if(g.state==='victory')this.setText(this.victoryScore,'victoryScore',String(Math.floor(g.score)).padStart(6,'0'));
    this.syncBattleControls(s);
  }

  syncBattleControls(s){
    const g=s.game,active=['playing','intermission','placing'].includes(g.state);this.dock?.classList.toggle('visible',active);this.placementHint?.classList.toggle('visible',g.state==='placing');
    this.setText(this.buyCost,'buyCost',`${g.shopCost}¢`);if(this.buyBtn)this.buyBtn.disabled=!['playing','intermission'].includes(g.state)||g.coins<g.shopCost||s.fighters.battle.length>=BALANCE.maxFighters;
    this.setText(this.repairCost,'repairCost',`${g.repairCost}¢`);if(this.repairBtn)this.repairBtn.disabled=!['playing','intermission'].includes(g.state)||g.core>=BALANCE.maxCore||g.coins<g.repairCost;
    this.setText(this.fighterCount,'fighterCount',`${s.fighters.battle.length}/${BALANCE.maxFighters}`);this.setText(this.waveStatus,'waveStatus',g.state==='intermission'?`NEXT ${Math.max(0,g.intermissionTimer).toFixed(1)}s`:`WAVE ${g.wave}/${g.maxWave}`);
    const f=this.selected(s);if(!f){this.selectedName.textContent='点击战机选择';this.selectedStars.textContent='';this.selectedTrait.textContent='星级靠合成 · 等级靠金币';this.fighterActionBtn.hidden=true;return}
    const m=FIGHTER_TYPES[f.type],e=fighterEvolutionMeta(f),stats=fighterStats(f,0);this.selectedName.textContent=e?e.tag:m.short;this.selectedStars.textContent=`${'★'.repeat(f.star||1)} · LV.${f.level}`;
    this.selectedTrait.textContent=f.type==='support'?`场域 ${supportFieldType(f).toUpperCase()} · 子弹穿过才会获得 Buff`:`角度 ${Math.round(f.aimAngle*180/Math.PI)}° · HIT ${stats.hitCount}`;
    this.fighterActionBtn.hidden=false;this.fighterActionBtn.classList.remove('upgrade-mode','max-mode');
    if((f.level||1)<4){const cost=fighterUpgradeCost(f);this.fighterActionBtn.classList.add('upgrade-mode');this.fighterActionBtn.disabled=g.coins<cost||!['playing','intermission'].includes(g.state);this.fighterActionBtn.innerHTML=`UPGRADE <b>${cost}¢</b>`}
    else if(fighterCanEvolve(f)){this.fighterActionBtn.disabled=g.coins<BALANCE.evolveCost||!['playing','intermission'].includes(g.state);this.fighterActionBtn.innerHTML=`EVOLVE <b>${BALANCE.evolveCost}¢</b>`}
    else if(fighterIsMax(f)){this.fighterActionBtn.classList.add('max-mode');this.fighterActionBtn.disabled=true;this.fighterActionBtn.innerHTML=`MAXED <b>LV.4</b>`}
  }

  showUpgrades(choices,f,cost){
    this.upgradeEyebrow.textContent='SELECTED FIGHTER TUNE';this.upgradeTitle.textContent=`${FIGHTER_TYPES[f.type].short} · LV.${f.level} → LV.${Math.min(4,f.level+1)}`;this.upgradeSubtitle.textContent=`支付 ${cost}¢，选择 1 个属性。效果只属于这架战机。`;
    this.upgradeList.innerHTML='';choices.forEach((u,i)=>{const b=document.createElement('button');b.className='upgrade-card theme-neutral';b.innerHTML=`<span class="card-index">0${i+1}</span><span class="icon">${u.icon}</span><span class="card-copy"><span class="card-kicker">LOCAL ONLY</span><strong>${u.name}</strong><p>${u.desc}</p><em>仅作用于当前 ${FIGHTER_TYPES[f.type].short}</em></span><kbd>${i+1}</kbd>`;b.onclick=()=>this.onUpgrade?.(i);this.upgradeList.appendChild(b)})
  }

  showRecruit(s){
    const choices=s.game.recruitChoices,free=s.game.recruitFree,source=s.game.recruitSource,isStarter=source==='starter';
    this.recruitEyebrow.textContent=isStarter?'STARTER FIGHTER':free?'EXP REWARD':'NEW FIGHTER';
    this.recruitTitle.textContent=isStarter?'开局战机 · 三选一':free?'经验奖励 · 随机战机':'购买战机';
    this.recruitDesc.textContent=isStarter?'先选择你的第一架战机，再点击战场选择部署位置。':free?'杀敌经验满了：免费获得一次三选一随机战机奖励。':'消耗金币，从 3 架随机战机中选择 1 架，然后放到战场中。';if(this.recruitCancel)this.recruitCancel.hidden=free;
    this.recruitList.innerHTML='';choices.forEach((f,i)=>{const m=FIGHTER_TYPES[f.type],b=document.createElement('button');b.className='choice-card recruit-card';b.style.setProperty('--fighter',m.accent);b.innerHTML=`<span class="choice-no">0${i+1}</span><span class="choice-icon">${m.icon}</span><span class="choice-kicker">${m.short}</span><strong>${m.name}</strong><p>${m.desc}</p><span class="choice-action">${isStarter?'FREE · START':free?'FREE · EXP':'选择 · '+s.game.shopCost+'¢'}</span>`;b.onclick=()=>this.onChooseRecruit?.(i);this.recruitList.appendChild(b)})
  }

  showEvolve(s,f,choices){this.evolveList.innerHTML='';const m=FIGHTER_TYPES[f.type];document.querySelector('#evolveSource').textContent=`${m.short} · ${'★'.repeat(f.star||1)} · LV.4`;choices.forEach((e,i)=>{const b=document.createElement('button');b.className='choice-card evolve-card';b.style.setProperty('--fighter',m.accent);b.innerHTML=`<span class="choice-no">0${i+1}</span><span class="choice-icon">${m.icon}</span><span class="choice-kicker">EVOLUTION</span><strong>${e.name}</strong><p>${e.desc}</p><span class="choice-action">EVOLVE · ${BALANCE.evolveCost}¢</span>`;b.onclick=()=>this.onChooseEvolve?.(i);this.evolveList.appendChild(b)})}
  showVictory(s){this.victoryScore.textContent=String(Math.floor(s.game.score)).padStart(6,'0')}
}
