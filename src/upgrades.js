export const UPGRADES = [
  {id:'ricochet',name:'折返协议',desc:'最大反弹次数 +1，让子弹有更多机会经过墙体强化',icon:'↗↘',apply:p=>p.ricochets++},
  {id:'slowwall',name:'寒霜镀层',desc:'解锁 / 强化左墙：每次反弹额外叠加 SLOW',icon:'❄',available:p=>p.slowWall<5,apply:p=>p.slowWall=Math.min(5,p.slowWall+1)},
  {id:'burnwall',name:'灼热镀层',desc:'解锁 / 强化右墙：每次反弹额外叠加 BURN',icon:'♨',available:p=>p.burnWall<5,apply:p=>p.burnWall=Math.min(5,p.burnWall+1)},
  {id:'pierce',name:'贯穿核心',desc:'主弹额外贯穿 1 个目标',icon:'⇢',apply:p=>p.pierce++},
  {id:'split',name:'裂变扩散',desc:'分裂弹无基础伤害，只负责继承与传播已获得的墙 Buff',icon:'Y',available:p=>p.slowWall>0||p.burnWall>0,apply:p=>p.split++},
  {id:'boom',name:'震荡爆破',desc:'主弹命中产生低伤害范围冲击',icon:'◎',apply:p=>p.explosive++},
  {id:'chain',name:'电弧连锁',desc:'主弹命中后低伤害跳跃至附近敌人',icon:'ϟ',apply:p=>p.chain++},
  {id:'homing',name:'微型制导',desc:'弹道会轻微向附近目标修正',icon:'⌁',apply:p=>p.homing++},
  {id:'twin',name:'双轨发射',desc:'额外发射 1 枚并行主弹',icon:'Ⅱ',apply:p=>p.shots=Math.min(5,p.shots+1)},
  {id:'speed',name:'脉冲冷却',desc:'缩短发射间隔，但保留前期判断节奏',icon:'»',apply:p=>p.fireCd=Math.max(.18,p.fireCd*.84)},
  {id:'heavy',name:'重型能量',desc:'基础伤害 +0.4，弹体略增大',icon:'◆',apply:p=>{p.damage+=.4;p.bulletSize+=.55}},
  {id:'edge',name:'墙体共振',desc:'只强化反弹后的伤害倍率，不强化直射',icon:'⌜⌟',apply:p=>p.trail++},
];
