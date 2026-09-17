import { UPGRADES } from './upgrades.js';

export class GMPanel{
  constructor(game,state,audio){
    this.game=game;this.state=state;this.audio=audio;this.open=false;this.last='';
    this.el=document.querySelector('#gmPanel');this.toggleBtn=document.querySelector('#gmToggle');this.closeBtn=document.querySelector('#gmClose');
    this.status=document.querySelector('#gmRunStatus');this.skillList=document.querySelector('#gmSkillList');
    this.waveInput=document.querySelector('#gmWaveInput');this.xpInput=document.querySelector('#gmXpInput');this.cdInput=document.querySelector('#gmCdInput');this.bounceInput=document.querySelector('#gmBounceInput');this.timeScale=document.querySelector('#gmTimeScale');
    this.pauseBtn=document.querySelector('#gmPauseBtn');this.invincibleBtn=document.querySelector('#gmInvincibleBtn');
    this.buildSkills();this.bind();
  }
  buildSkills(){
    this.skillList.innerHTML='';
    UPGRADES.forEach(u=>{const b=document.createElement('button');b.type='button';b.className='gm-skill';b.dataset.skill=u.id;b.innerHTML=`<span class="gm-skill-icon">${u.icon}</span><span class="gm-skill-copy"><strong>${u.name}</strong><small data-level="${u.id}">LV.0</small></span><b>+1</b>`;b.onclick=()=>{this.audio?.ensure();this.game.gmUpgrade(u.id);this.sync(true)};this.skillList.appendChild(b)});
  }
  bind(){
    this.toggleBtn.onclick=()=>this.toggle();this.closeBtn.onclick=()=>this.toggle(false);
    this.el.querySelector('[data-gm="kill-wave"]').onclick=()=>this.act(()=>this.game.gmKillWave());
    this.el.querySelector('[data-gm="trigger-upgrade"]').onclick=()=>this.act(()=>this.game.gmTriggerUpgrade());
    this.el.querySelector('[data-gm="restore-core"]').onclick=()=>this.act(()=>this.game.gmRestoreCore());
    this.el.querySelector('[data-gm="clear-bullets"]').onclick=()=>this.act(()=>this.game.gmClearBullets());
    this.pauseBtn.onclick=()=>this.act(()=>this.game.gmTogglePause());
    this.invincibleBtn.onclick=()=>this.act(()=>this.game.gmToggleInvincible());
    document.querySelector('#gmJumpWave').onclick=()=>this.act(()=>this.game.gmJumpWave(this.waveInput.value));
    document.querySelector('#gmAddXp').onclick=()=>this.act(()=>this.game.gmAddXp(this.xpInput.value));
    document.querySelector('#gmSetCd').onclick=()=>this.act(()=>this.game.gmSetFireCd(this.cdInput.value));
    document.querySelector('#gmSetBounce').onclick=()=>this.act(()=>this.game.gmSetRicochets(this.bounceInput.value));
    this.timeScale.onchange=()=>this.act(()=>this.game.gmSetTimeScale(this.timeScale.value));
    document.querySelector('#gmResetBuild').onclick=()=>this.act(()=>this.game.gmResetBuild());
    document.querySelector('#gmMaxWalls').onclick=()=>this.act(()=>this.game.gmMaxWalls());
    document.querySelector('#gmMaxBounce').onclick=()=>this.act(()=>this.game.gmSetRicochets(this.state.player.ricochets+5));
    document.querySelector('#gmSpawnEnemy').onclick=()=>this.act(()=>this.game.gmSpawnEnemy(document.querySelector('#gmEnemyType').value));
  }
  act(fn){this.audio?.ensure();fn();this.audio?.uiConfirm();this.sync(true)}
  toggle(force){this.open=force??!this.open;this.el.classList.toggle('open',this.open);this.toggleBtn.classList.toggle('active',this.open);this.el.setAttribute('aria-hidden',this.open?'false':'true');if(this.open)this.sync(true)}
  sync(force=false){
    const {game:g,player:p,enemies}=this.state;const levels=g.upgradeLevels||{};
    const sig=[g.wave,enemies.filter(e=>!e.dead).length,g.xp,g.nextXp,g.core,g.gmPaused,g.gmInvincible,g.gmTimeScale,p.fireCd,p.ricochets,...UPGRADES.map(u=>levels[u.id]||0)].join('|');
    if(!force&&sig===this.last)return;this.last=sig;
    this.status.textContent=`W${g.wave||0} · E${enemies.filter(e=>!e.dead).length} · XP ${g.xp}/${g.nextXp}`;
    this.pauseBtn.textContent=g.gmPaused?'恢复游戏':'暂停游戏';this.pauseBtn.classList.toggle('on',g.gmPaused);
    this.invincibleBtn.textContent=g.gmInvincible?'无敌 ON':'核心无敌';this.invincibleBtn.classList.toggle('on',g.gmInvincible);
    if(document.activeElement!==this.cdInput)this.cdInput.value=p.fireCd.toFixed(2);if(document.activeElement!==this.bounceInput)this.bounceInput.value=p.ricochets;this.timeScale.value=String(g.gmTimeScale||1);
    UPGRADES.forEach(u=>{const el=this.skillList.querySelector(`[data-level="${u.id}"]`);if(el)el.textContent=`LV.${levels[u.id]||0}`});
  }
}
