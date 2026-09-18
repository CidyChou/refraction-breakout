export const VIEW = { width: 420, height: 760 };
export const COLORS = {
  slow:'#63ddff',
  burn:'#ff8a4c',
  prism:'#c79bff',
  support:'#ffe787',
  white:'#f7fbff',
  danger:'#ff647e',
  violet:'#9f86ff',
  gold:'#ffe787'
};

export const BALANCE = {
  totalWaves:40,
  baseDamage:1,

  // Slow-horde pacing: many enemies, slower movement, higher tankiness.
  enemyBaseHp:3.3,
  enemyHpPerWave:.64,
  enemyBaseSpeed:20.5,
  enemySpeedPerWave:.42,
  enemySpeedWaveCap:14,
  enemyPressurePerWave:.006,
  enemyPressureCap:1.20,

  waveBaseQuota:10,
  waveQuotaPerWave:1.6,
  waveQuotaCap:64,
  waveDurationBase:16,
  waveDurationPerWave:.20,
  waveDurationCap:24,
  minSpawnInterval:.30,

  startingCoins:12,
  shopBaseCost:8,
  shopCostStep:4,
  shopCostCap:40,
  repairBaseCost:15,
  repairCostStep:5,
  fighterUpgradeCosts:[0,7,12,18],
  maxStar:4,
  evolveCost:20,
  maxCore:3,
  maxFighters:12,
  placement:{minX:42,maxX:378,minY:165,maxY:625},
  fighterRadius:18,
  mergeRadius:30,
  aimHandleDistance:44,
  projectileBottom:657,
  portal:{x:58,y:108,width:304,height:48,spawnY:112,minX:76,maxX:344},
  maxSlowStacks:12,
  maxBurnStacks:20,
};
