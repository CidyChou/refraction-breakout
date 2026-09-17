export const VIEW = { width: 420, height: 760 };
export const COLORS = {
  slow: '#63ddff', burn: '#ff8a4c', white: '#f7fbff', danger: '#ff647e', violet: '#9f86ff'
};
export const BALANCE = {
  baseFireCd: 0.60,
  baseDamage: 1,
  directMultiplier: 0.30,
  reflectedBase: 1.25,
  reflectedPerBounce: 0.45,
  wallResonancePerLevel: 0.12,
  maxSlowStacks: 12,
  maxBurnStacks: 20,

  // Horde pacing: slower pressure, higher durability, more bodies on screen.
  enemyBaseHp: 2.2,
  enemyHpPerWave: 0.45,
  enemyBaseSpeed: 11.5,
  enemySpeedPerWave: 0.42,
  enemySpeedWaveCap: 12,
  enemyPressurePerWave: 0.008,
  enemyPressureCap: 1.26,
  waveBaseQuota: 12,
  waveQuotaPerWave: 2,
  waveQuotaCap: 54,
  spawnIntervalStart: 0.30,
  spawnIntervalMin: 0.13,
};
