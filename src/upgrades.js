// 金币升级只作用于当前选中的战机实例，不再修改全局。
export const UPGRADES = [
  {id:'hitcount',name:'命中延展',desc:'这架战机的主弹可命中次数 +1。',icon:'H+',available:f=>f?.type!=='support',apply:f=>f.mods.hitCount++},
  {id:'lifetime',name:'轨迹续航',desc:'这架战机的主弹存在时间 +0.8 秒。',icon:'∞',available:f=>f?.type!=='support',apply:f=>f.mods.life++},
  {id:'split',name:'Buff 碎片',desc:'命中后释放 2 个 Buff 碎片，继承现有 Buff，但没有基础伤害。',icon:'Y',available:f=>f?.type!=='support',apply:f=>f.mods.split++},
  {id:'boom',name:'震荡爆破',desc:'这架战机的主弹获得更强范围冲击。',icon:'◎',available:f=>f?.type!=='support',apply:f=>f.mods.explosive++},
  {id:'chain',name:'电弧连锁',desc:'命中后低伤害跳跃到附近敌人。',icon:'ϟ',available:f=>f?.type!=='support',apply:f=>f.mods.chain++},
  {id:'homing',name:'微型制导',desc:'弹道会轻微向附近目标修正。',icon:'⌁',available:f=>f?.type!=='support',apply:f=>f.mods.homing++},
  {id:'twin',name:'协同火控',desc:'额外发射 1 枚并行主弹。',icon:'Ⅱ',available:f=>f?.type!=='support'&&(f.mods.extraShots||0)<3,apply:f=>f.mods.extraShots=Math.min(3,(f.mods.extraShots||0)+1)},
  {id:'speed',name:'脉冲冷却',desc:'仅缩短这架战机约 10% 的射击间隔。',icon:'»',available:f=>f?.type!=='support'&&(f.mods.fireRate||0)<6,apply:f=>f.mods.fireRate=Math.min(6,(f.mods.fireRate||0)+1)},
  {id:'heavy',name:'重型能量',desc:'提高单发伤害，并让弹体更厚重。',icon:'◆',available:f=>f?.type!=='support',apply:f=>{f.mods.damage++;f.mods.bulletSize=Math.min(5,(f.mods.bulletSize||0)+1)}},
  {id:'ballspeed',name:'高能抛射',desc:'提高弹丸速度，让回弹路径更紧凑。',icon:'↟',available:f=>f?.type!=='support'&&(f.mods.ballSpeed||0)<5,apply:f=>f.mods.ballSpeed=Math.min(5,(f.mods.ballSpeed||0)+1)},
  {id:'supportpower',name:'场域增幅',desc:'提高这台装置的场域强度。',icon:'◇+',available:f=>f?.type==='support',apply:f=>f.mods.supportPower++},
  {id:'supportrange',name:'扩域线圈',desc:'扩大这台装置的 Buff 场范围。',icon:'◎+',available:f=>f?.type==='support',apply:f=>f.mods.supportRange++},
  {id:'supportfocus',name:'聚焦场域',desc:'更大幅度地提高这台装置的场域强度。',icon:'◇◇',available:f=>f?.type==='support',apply:f=>f.mods.supportPower+=2},
];

export function fighterUpgradeChoices(f,count=3){
  const pool=UPGRADES.filter(u=>!u.available||u.available(f));
  return [...pool].sort(()=>Math.random()-.5).slice(0,Math.min(count,pool.length));
}
