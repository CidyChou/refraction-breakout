export class RuntimePerformance {
  constructor(state) {
    this.state = state;
    this.avgMs = 16.7;
    this.avgFps = 60;
    this.sampleTimer = 0;
    this.quality = 'high';
    state.perf ??= {};
  }

  sample(frameMs, dt) {
    this.avgMs += (frameMs - this.avgMs) * 0.06;
    this.avgFps = 1000 / Math.max(1, this.avgMs);
    this.sampleTimer += dt;
    if (this.sampleTimer < 0.35) return;
    this.sampleTimer = 0;

    const s = this.state;
    const pressure = s.bullets.length + s.enemies.length * 2 + s.particles.length * 0.35;
    if (this.avgMs > 24 || pressure > 520) this.quality = 'low';
    else if (this.avgMs > 18.5 || pressure > 330) this.quality = 'medium';
    else this.quality = 'high';

    Object.assign(s.perf, {
      fps: Math.round(this.avgFps),
      frameMs: Math.round(this.avgMs * 10) / 10,
      quality: this.quality,
      pressure: Math.round(pressure),
    });
  }
}
