const PROGRESS_KEY = 'rb-levels-v1';

export const LEVELS = [
  // Act 1 · 入门 · 10 波 · 只有普通敌人
  {
    id:1, act:1, actName:'入门', name:'门户试炼', tag:'GATE TRIAL', waves:10,
    hp:.62, speed:.86, quota:.52, duration:.82, coins:12, titan:false,
    intro:'只有最普通的杂兵。熟悉弹道、核心和放置。',
    pool:[{type:'grunt', w:10}],
  },
  {
    id:2, act:1, actName:'入门', name:'护盾阵列', tag:'SHIELD LINE', waves:10,
    hp:.68, speed:.88, quota:.58, duration:.84, coins:12, titan:false,
    intro:'正面护盾兵登场。从下方打会弹开。',
    pool:[{type:'grunt', w:8},{type:'shield', w:5}],
  },
  {
    id:3, act:1, actName:'入门', name:'游走菱形', tag:'SPINNER PATH', waves:10,
    hp:.72, speed:.90, quota:.62, duration:.86, coins:12, titan:false,
    intro:'菱形游走兵左右摆动，弹道要预判。',
    pool:[{type:'grunt', w:7},{type:'spinner', w:6}],
  },
  {
    id:4, act:1, actName:'入门', name:'混编前哨', tag:'MIXED POST', waves:10,
    hp:.78, speed:.92, quota:.68, duration:.88, coins:12, titan:false,
    intro:'杂兵、护盾、游走混编。入门三种敌人第一次凑齐。',
    pool:[{type:'grunt', w:6},{type:'shield', w:4},{type:'spinner', w:4}],
  },
  {
    id:5, act:1, actName:'入门', name:'第一闸门', tag:'FIRST GATE', waves:10,
    hp:.86, speed:.94, quota:.78, duration:.90, coins:12, titan:false,
    intro:'仍是普通敌人，但更密、更厚。10 波入门毕业。',
    pool:[{type:'grunt', w:5},{type:'shield', w:5},{type:'spinner', w:5}],
  },

  // Act 2 · 进阶 · 20 波 · 机制敌人
  {
    id:6, act:2, actName:'进阶', name:'分裂潮汐', tag:'SPLIT TIDE', waves:20,
    hp:.90, speed:.94, quota:.82, duration:.92, coins:14, titan:'last',
    intro:'分裂体被击破会变成两只小兵。最后一波出现泰坦。',
    pool:[{type:'grunt', w:5},{type:'shield', w:3},{type:'spinner', w:3},{type:'splitter', w:6}],
  },
  {
    id:7, act:2, actName:'进阶', name:'弹射回廊', tag:'BUMPER HALL', waves:20,
    hp:.94, speed:.96, quota:.86, duration:.94, coins:14, titan:'last',
    intro:'弹射体把子弹弹开。利用回弹，小心自己被打乱节奏。',
    pool:[{type:'grunt', w:4},{type:'spinner', w:3},{type:'splitter', w:3},{type:'bumper', w:6}],
  },
  {
    id:8, act:2, actName:'进阶', name:'脉冲航线', tag:'PULSE LANE', waves:20,
    hp:.98, speed:.98, quota:.90, duration:.96, coins:14, titan:'last',
    intro:'脉冲体忽快忽慢，金币船价值高但会溜走。',
    pool:[{type:'grunt', w:4},{type:'bumper', w:3},{type:'pulse', w:5},{type:'carrier', w:4}],
  },
  {
    id:9, act:2, actName:'进阶', name:'磁力暗流', tag:'MAGNET WELL', waves:20,
    hp:1.02, speed:1.00, quota:.94, duration:.98, coins:14, titan:'last',
    intro:'磁体吸引子弹。弹道会被拽弯，命中次数更珍贵。',
    pool:[{type:'grunt', w:3},{type:'pulse', w:3},{type:'splitter', w:3},{type:'magnet', w:6}],
  },
  {
    id:10, act:2, actName:'进阶', name:'联结防线', tag:'WARDEN LINE', waves:20,
    hp:1.06, speed:1.02, quota:.98, duration:1.00, coins:14, titan:'every10',
    intro:'守护者给附近敌人减伤。第 10 / 20 波各有一只泰坦。',
    pool:[{type:'grunt', w:3},{type:'shield', w:3},{type:'magnet', w:3},{type:'warden', w:6},{type:'carrier', w:2}],
  },

  // Act 3 · 终局 · 40 波 · 强敌与全谱
  {
    id:11, act:3, actName:'终局', name:'漂移群', tag:'DRIFTER SWARM', waves:40,
    hp:1.10, speed:1.04, quota:1.02, duration:1.00, coins:16, titan:'every10',
    intro:'横向漂移体很快。40 波终局开场，每 10 波一只泰坦。',
    pool:[{type:'grunt', w:3},{type:'spinner', w:3},{type:'pulse', w:3},{type:'drifter', w:7},{type:'warden', w:2}],
  },
  {
    id:12, act:3, actName:'终局', name:'再生壁垒', tag:'REGEN WALL', waves:40,
    hp:1.14, speed:1.06, quota:1.06, duration:1.02, coins:16, titan:'every10',
    intro:'再生体不烧就回血。需要持续输出或点燃。',
    pool:[{type:'grunt', w:3},{type:'shield', w:3},{type:'drifter', w:3},{type:'regen', w:6},{type:'magnet', w:2}],
  },
  {
    id:13, act:3, actName:'终局', name:'重甲推进', tag:'IRON PUSH', waves:40,
    hp:1.18, speed:1.08, quota:1.10, duration:1.04, coins:16, titan:'every10',
    intro:'重甲体血厚速慢。打不穿就会被推到核心。',
    pool:[{type:'grunt', w:2},{type:'shield', w:3},{type:'regen', w:3},{type:'tank', w:6},{type:'warden', w:3}],
  },
  {
    id:14, act:3, actName:'终局', name:'全谱压制', tag:'FULL SPECTRUM', waves:40,
    hp:1.22, speed:1.10, quota:1.14, duration:1.06, coins:16, titan:'every10',
    intro:'所有敌人类型同时出现。综合检验阵容和走位。',
    pool:[
      {type:'grunt', w:3},{type:'shield', w:3},{type:'spinner', w:2},{type:'splitter', w:3},
      {type:'pulse', w:2},{type:'bumper', w:2},{type:'drifter', w:3},{type:'magnet', w:3},
      {type:'warden', w:3},{type:'regen', w:3},{type:'tank', w:3},{type:'carrier', w:2},
    ],
  },
  {
    id:15, act:3, actName:'终局', name:'奇点突围', tag:'SINGULARITY', waves:40,
    hp:1.30, speed:1.14, quota:1.20, duration:1.08, coins:16, titan:'every10',
    intro:'最高难度。全种类、最厚血量、最密配额。通关即全破。',
    pool:[
      {type:'grunt', w:2},{type:'shield', w:3},{type:'spinner', w:2},{type:'splitter', w:3},
      {type:'pulse', w:3},{type:'bumper', w:3},{type:'drifter', w:4},{type:'magnet', w:4},
      {type:'warden', w:4},{type:'regen', w:4},{type:'tank', w:5},{type:'carrier', w:2},
    ],
  },
];

export function getLevel(id){
  return LEVELS.find(l=>l.id===id)||LEVELS[0];
}

export function nextLevel(id){
  return LEVELS.find(l=>l.id===(id||0)+1)||null;
}

export function titanOnWave(level, wave){
  if(!level||!wave)return false;
  if(level.titan==='last')return wave===level.waves;
  if(level.titan==='every10')return wave%10===0;
  return false;
}

export function pickEnemy(level, wave, rng=Math.random){
  const pool=(level?.pool||[]).filter(p=>wave>=(p.from||1));
  if(!pool.length)return 'grunt';
  let total=0;for(const p of pool)total+=p.w||1;
  let roll=rng()*total;
  for(const p of pool){roll-=p.w||1;if(roll<=0)return p.type}
  return pool[0].type;
}

export function loadProgress(){
  try{
    const raw=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}');
    const cleared=Math.max(0, Math.min(LEVELS.length, Number(raw.cleared)||0));
    const last=Math.max(1, Math.min(LEVELS.length, Number(raw.last)||1));
    return {cleared, last};
  }catch{
    return {cleared:0, last:1};
  }
}

export function saveProgress(partial){
  const cur=loadProgress();
  const next={
    cleared:Math.max(cur.cleared, Number(partial.cleared??cur.cleared)||0),
    last:Math.max(1, Number(partial.last??cur.last)||cur.last),
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  return next;
}

export function markLevelCleared(id){
  return saveProgress({cleared:id, last:id});
}

export function isLevelUnlocked(id, cleared=loadProgress().cleared){
  return id===1||id<=cleared+1;
}

export function unlockAllLevels(){
  return saveProgress({cleared:LEVELS.length});
}
