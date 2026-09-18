import { BALANCE, COLORS } from './config.js';

export const FIGHTER_TYPES = {
  scatter:{id:'scatter',name:'散射机',short:'SCATTER',icon:'✦',accent:'#78e9ff',desc:'多弹丸、命中次数较少，擅长把场面铺满。',evolves:[{id:'prism',name:'棱镜阵列',tag:'PRISM ARRAY',desc:'弹丸更多、更稳定，适合织出长时间弹道网。'},{id:'storm',name:'风暴阵列',tag:'STORM ARRAY',desc:'更高射速与更多弹量，快速铺开全场。'}]},
  laser:{id:'laser',name:'激光机',short:'LASER',icon:'━',accent:'#d6a7ff',desc:'单发轨迹清晰，命中次数高，适合长线折返。',evolves:[{id:'prismbeam',name:'棱镜光束',tag:'PRISM BEAM',desc:'更高命中次数，适合长时间折返清场。'},{id:'overdrive',name:'过载光束',tag:'OVERDRIVE',desc:'更强伤害与射速。'}]},
  pierce:{id:'pierce',name:'穿透机',short:'PIERCE',icon:'⇢',accent:'#8fffc0',desc:'高命中次数弹丸，适合在怪堆里反复穿行。',evolves:[{id:'railgun',name:'轨道炮',tag:'RAILGUN',desc:'超高伤害、超高命中次数。'},{id:'needle',name:'针雨',tag:'NEEDLE RAIN',desc:'双发穿透，更密更快。'}]},
  aoe:{id:'aoe',name:'爆破机',short:'BLAST',icon:'◎',accent:'#ffad73',desc:'命中会制造范围伤害，适合卡在回弹节点清堆怪。',evolves:[{id:'chainblast',name:'连锁爆破',tag:'CHAIN BLAST',desc:'更频繁的爆炸与连锁冲击。'},{id:'singularity',name:'奇点炮',tag:'SINGULARITY',desc:'更慢但更大范围的重炮。'}]},
  support:{id:'support',name:'增幅装置',short:'FIELD',icon:'◇',accent:'#ffe37a',desc:'自身不攻击，子弹穿过它的场域时会获得 Buff。',evolves:[{id:'resonance',name:'灼热场域',tag:'FIRE FIELD',desc:'子弹穿过时叠加 BURN。'},{id:'command',name:'棱镜场域',tag:'PRISM FIELD',desc:'子弹穿过时增加可命中次数。'}]},
};

export function makeFighterMods(){return{
  hitCount:0,pierce:0,split:0,explosive:0,chain:0,homing:0,
  extraShots:0,fireRate:0,damage:0,bulletSize:0,ballSpeed:0,
  supportPower:0,supportRange:0
}}

let uid=1;
export function makeFighter(type=null, level=1, evolution=null, x=210, y=610, aimAngle=-Math.PI/2, star=1){
  const keys=Object.keys(FIGHTER_TYPES),id=type||keys[Math.floor(Math.random()*keys.length)];
  return {uid:`f${uid++}`,type:id,level,star,evolution,x,y,aimAngle,fireTimer:Math.random()*.35,mods:makeFighterMods(),tuneLevels:{}};
}

export function fighterCanEvolve(f){return !!f&&!f.evolution&&f.level>=4}
export function fighterIsMax(f){return !!f&&!!f.evolution&&f.level>=4}
export function fighterEvolutionMeta(f){return f?.evolution?FIGHTER_TYPES[f.type]?.evolves?.find(e=>e.id===f.evolution)||null:null}
export function sameMergeFamily(a,b){return !!a&&!!b&&a.uid!==b.uid&&a.type===b.type&&a.star===b.star&&(a.evolution||null)===(b.evolution||null)&&a.star<BALANCE.maxStar}
export function fighterUpgradeCost(f){if(!f||f.level>=4)return 0;return BALANCE.fighterUpgradeCosts[f.level]??BALANCE.fighterUpgradeCosts.at(-1)??15}

function mergedMods(a={},b={}){const out=makeFighterMods();for(const k of Object.keys(out))out[k]=Math.max(a[k]||0,b[k]||0);return out}
export function mergeFighterProgress(target,source){
  target.star=Math.min(BALANCE.maxStar,(target.star||1)+1);
  target.level=Math.max(target.level||1,source.level||1);
  target.mods=mergedMods(target.mods,source.mods);
  target.tuneLevels={...(target.tuneLevels||{})};
  for(const [k,v] of Object.entries(source.tuneLevels||{}))target.tuneLevels[k]=Math.max(target.tuneLevels[k]||0,v||0);
  return target;
}

export function fighterStats(f,_supportPower=0){
  const level=f.level||1,star=f.star||1,m=f.mods||makeFighterMods();let s;
  const lvDmg=1+(level-1)*.15,lvCd=Math.pow(.94,level-1),starDmg=1+(star-1)*.09;
  if(f.type==='scatter')s={cd:1.15,damage:.48,shots:2+star,spread:.18,kind:'normal',hitCount:star>=4?2:1,trailScale:1,explosive:0,bulletSpeedScale:1};
  else if(f.type==='laser')s={cd:1.70,damage:.42,shots:1,spread:0,kind:'laser',hitCount:2+Math.floor(star/2),trailScale:1.15,explosive:0,bulletSpeedScale:1.2};
  else if(f.type==='pierce')s={cd:1.28,damage:.78,shots:star>=4?2:1,spread:star>=4?.04:0,kind:'pierce',hitCount:3+Math.floor((star-1)/2),trailScale:1.05,explosive:0,bulletSpeedScale:1.05};
  else if(f.type==='aoe')s={cd:1.62,damage:.60,shots:1,spread:0,kind:'aoe',hitCount:1+Math.floor((star-1)/2),trailScale:1.05,explosive:1+(star-1)*.45,bulletSpeedScale:.85};
  else s={cd:999,damage:0,shots:0,spread:0,kind:'support',hitCount:0,trailScale:1,explosive:0,bulletSpeedScale:1};

  s.damage*=lvDmg*starDmg*(1+(m.damage||0)*.18);
  s.cd*=lvCd*Math.pow(.90,m.fireRate||0);
  s.shots+=m.extraShots||0;
  s.hitCount+=m.hitCount||0;
  s.explosive+=m.explosive||0;
  s.chain=m.chain||0;
  s.homing=m.homing||0;
  s.split=m.split||0;
  s.bulletSize=m.bulletSize||0;
  s.ballSpeed=(m.ballSpeed||0);

  if(f.evolution==='prism'){s.shots+=1;s.spread=.15;s.hitCount+=1}
  if(f.evolution==='storm'){s.shots+=4;s.damage*=.76;s.cd*=.82;s.spread=.20}
  if(f.evolution==='prismbeam'){s.hitCount+=1;s.trailScale=1.45;s.damage*=1.08}
  if(f.evolution==='overdrive'){s.cd*=.72;s.damage*=1.36;s.hitCount+=1;s.trailScale=1.2}
  if(f.evolution==='railgun'){s.cd*=1.15;s.damage*=1.58;s.hitCount+=2;s.trailScale=1.2}
  if(f.evolution==='needle'){s.cd*=.78;s.damage*=.74;s.shots+=1;s.spread=.05;s.hitCount+=1}
  if(f.evolution==='chainblast'){s.cd*=.82;s.damage*=.92;s.explosive+=1;s.chain=(s.chain||0)+1}
  if(f.evolution==='singularity'){s.cd*=1.18;s.damage*=1.34;s.explosive+=2.2;s.trailScale=1.25;s.hitCount+=1}

  if(f.gmCdOverride)s.cd=f.gmCdOverride;
  if(f.gmRicochetsOverride)s.hitCount=Math.max(1,f.gmRicochetsOverride);
  return s;
}

export function supportRange(f){
  if(!f||f.type!=='support')return 0;
  const star=f.star||1,m=f.mods||{};
  return (f.evolution==='command'?150:112)+(star-1)*10+(m.supportRange||0)*16;
}

export function supportFieldType(f){
  if(!f||f.type!=='support')return null;
  if(f.evolution==='resonance')return 'fire';
  if(f.evolution==='command')return 'prism';
  return 'ice';
}

export function supportFieldColor(f){
  const type=supportFieldType(f);
  if(type==='fire')return COLORS.burn;
  if(type==='prism')return COLORS.prism;
  return COLORS.slow;
}

export function supportFieldStrength(f){
  if(!f||f.type!=='support')return 0;
  const lv=f.level||1,star=f.star||1,m=f.mods||{};
  return Math.max(1,Math.round(1+(lv-1)*.35+(star-1)*.25+(m.supportPower||0)*.5));
}

// Kept for compatibility; support now affects bullets by field crossing, not passive stat aura.
export function supportContribution(){return 0}
