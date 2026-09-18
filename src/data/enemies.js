export const ENEMY_TYPES = {
  grunt:{hp:1,radius:14,speed:1.18,coin:1,shape:'triangle',color:'#ff6276'},
  shield:{hp:1.45,radius:18,speed:.90,coin:1,shape:'square',color:'#ffcc67',shield:true},
  spinner:{hp:1.10,radius:16,speed:1.28,coin:1,shape:'diamond',color:'#60e6ff'},
  splitter:{hp:1.24,radius:17,speed:1.04,coin:1,shape:'hex',color:'#ff76b7',splitter:true},
  pulse:{hp:1.20,radius:16,speed:1.22,coin:1,shape:'circle',color:'#ff9d69'},
  bumper:{hp:1.12,radius:16,speed:1.16,coin:2,shape:'diamond-cross',color:'#ff75c8',bumper:true},
  warden:{hp:1.75,radius:19,speed:.74,coin:1,shape:'hex-core',color:'#8f7cff',protector:true},
  drifter:{hp:1.04,radius:14,speed:1.55,coin:1,shape:'triangle',color:'#68ffc4',drifter:true},
  magnet:{hp:1.55,radius:19,speed:.86,coin:2,shape:'oct-magnet',color:'#9a8cff',gravity:105},
  tank:{hp:3.25,radius:24,speed:.48,coin:3,shape:'square',color:'#ff6e63'},
  regen:{hp:1.55,radius:18,speed:.84,coin:2,shape:'hex-plus',color:'#77ff9b',regen:true},
  carrier:{hp:1.15,radius:16,speed:1.34,coin:5,shape:'diamond',color:'#ffe064'},
  titan:{hp:8.2,radius:31,speed:.38,coin:12,shape:'oct',color:'#f2a1ff',boss:true},
  mini:{hp:.34,radius:9,speed:1,coin:0,shape:'circle',color:'#edf4ff'},
};

export function enemyType(id){return ENEMY_TYPES[id]||ENEMY_TYPES.grunt}
