import { BALANCE } from './config.js';

export class UI {
  constructor(){
    this.score=document.querySelector('#scoreValue');
    this.wave=document.querySelector('#waveValue');
    this.xpFill=document.querySelector('#xpFill');
    this.core=document.querySelector('#coreDots');
    this.slow=document.querySelector('#slowWallLevel');
    this.burn=document.querySelector('#burnWallLevel');
    this.leftBadge=document.querySelector('.left-badge');
    this.rightBadge=document.querySelector('.right-badge');
    this.cd=document.querySelector('#cdValue');
    this.bounce=document.querySelector('#bounceValue');
    this.damage=document.querySelector('#damageValue');
    this.soundToggle=document.querySelector('#soundToggle');
    this.banner=document.querySelector('#banner');
    this.title=document.querySelector('#titleScreen');
    this.upgrade=document.querySelector('#upgradeScreen');
    this.gameover=document.querySelector('#gameoverScreen');
    this.upgradeList=document.querySelector('#upgradeList');
    this.resultScore=document.querySelector('#resultScore');
    this.resultWave=document.querySelector('#resultWave');
    this.last={};
    this.coreDots=Array.from({length:3},()=>{const dot=document.createElement('i');this.core.appendChild(dot);return dot});
  }
  bind({onStart,onRestart,onUpgrade,onSoundToggle}){
    document.querySelector('#startBtn').onclick=onStart;
    document.querySelector('#restartBtn').onclick=onRestart;
    this.onUpgrade=onUpgrade;
    this.soundToggle.onclick=onSoundToggle;
  }

  setSoundEnabled(enabled){
    if(!this.soundToggle)return;
    this.soundToggle.classList.toggle('muted',!enabled);
    this.soundToggle.textContent=enabled?'SFX ON':'SFX OFF';
    this.soundToggle.setAttribute('aria-pressed',enabled?'true':'false');
  }
  setText(el,key,value){if(this.last[key]===value)return;this.last[key]=value;el.textContent=value}
  sync(s){
    const {game,player}=s;
    this.setText(this.score,'score',String(Math.floor(game.score)).padStart(6,'0'));
    this.setText(this.wave,'wave',String(game.wave||1));
    const xp=Math.min(100,game.nextXp?game.xp/game.nextXp*100:0);
    if(this.last.xp!==xp){this.last.xp=xp;this.xpFill.style.width=`${xp}%`}
    if(this.last.core!==game.core){this.last.core=game.core;this.coreDots.forEach((d,i)=>d.classList.toggle('active',i<game.core))}
    this.setText(this.slow,'slow',player.slowWall>0?`SLOW · LV.${player.slowWall}`:'REFLECT · DMG');
    this.setText(this.burn,'burn',player.burnWall>0?`BURN · LV.${player.burnWall}`:'REFLECT · DMG');
    this.leftBadge.classList.toggle('buff-active',player.slowWall>0);
    this.rightBadge.classList.toggle('buff-active',player.burnWall>0);
    this.setText(this.cd,'cd',`CD ${player.fireCd.toFixed(2)}s`);
    this.setText(this.bounce,'bounce',`BOUNCE ${player.ricochets}`);
    const direct=Math.round(BALANCE.directMultiplier*100),reflect=Math.round((BALANCE.reflectedBase+BALANCE.reflectedPerBounce+(player.trail-1)*BALANCE.wallResonancePerLevel)*100);
    this.setText(this.damage,'damage',`DIRECT ${direct}% · REFLECT ${reflect}%`);
    if(this.last.state!==game.state){this.last.state=game.state;this.title.classList.toggle('visible',game.state==='title');this.upgrade.classList.toggle('visible',game.state==='upgrade');this.gameover.classList.toggle('visible',game.state==='gameover')}
    const showBanner=game.bannerT>0;
    if(showBanner){this.setText(this.banner,'banner',game.banner);this.banner.classList.add('visible')}else this.banner.classList.remove('visible');
    if(game.state==='gameover'){this.setText(this.resultScore,'resultScore',String(Math.floor(game.score)).padStart(6,'0'));this.setText(this.resultWave,'resultWave',`突破至 WAVE ${game.wave}`)}
  }
  showUpgrades(choices){
    this.upgradeList.innerHTML='';
    this.upgrade.classList.remove('upgrade-reveal');
    // Restart the overlay animation even when upgrades happen back-to-back.
    void this.upgrade.offsetWidth;
    this.upgrade.classList.add('upgrade-reveal');

    const category=id=>{
      if(['slowwall','burnwall','ricochet','edge'].includes(id))return 'WALL MOD';
      if(['boom','chain'].includes(id))return 'IMPACT';
      return 'WEAPON';
    };
    const theme=id=>id==='slowwall'?'theme-cyan':id==='burnwall'?'theme-orange':id==='edge'||id==='ricochet'?'theme-violet':'theme-neutral';

    choices.forEach((u,i)=>{
      const b=document.createElement('button');
      b.className=`upgrade-card ${theme(u.id)}`;
      b.style.setProperty('--i',i);
      b.innerHTML=`
        <span class="card-index">0${i+1}</span>
        <span class="card-glow" aria-hidden="true"></span>
        <span class="icon">${u.icon}</span>
        <span class="card-copy">
          <span class="card-kicker">${category(u.id)}</span>
          <strong>${u.name}</strong>
          <p>${u.desc}</p>
        </span>
        <kbd>${i+1}</kbd>`;
      b.onclick=()=>{
        if(this.upgradeList.classList.contains('choosing'))return;
        this.upgradeList.classList.add('choosing');
        b.classList.add('selected');
        Array.from(this.upgradeList.children).forEach(card=>{if(card!==b)card.classList.add('not-selected')});
        setTimeout(()=>this.onUpgrade(i),150);
      };
      this.upgradeList.appendChild(b);
    });
    this.upgradeList.classList.remove('choosing');
  }
}
