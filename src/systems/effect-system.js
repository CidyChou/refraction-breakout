import { ObjectPool } from '../core/object-pool.js';

export class EffectSystem {
  constructor(state, limits) {
    this.state = state;
    this.limits = limits;
    this.particlePool = new ObjectPool(limits.maxParticles);
    this.ringPool = new ObjectPool(limits.maxRings);
    this.floatingPool = new ObjectPool(limits.maxFloating);
  }

  clear() {
    for (const p of this.state.particles) this.particlePool.release(p);
    for (const r of this.state.rings) this.ringPool.release(r);
    for (const f of this.state.floating) this.floatingPool.release(f);
    this.state.particles.length = 0;
    this.state.rings.length = 0;
    this.state.floating.length = 0;
  }

  loadFactor() {
    const p = this.state.particles.length / this.limits.maxParticles;
    const r = this.state.rings.length / this.limits.maxRings;
    return Math.max(p, r);
  }

  particle(data, priority = 0) {
    const arr = this.state.particles;
    if (arr.length >= this.limits.maxParticles && priority < 2) return null;
    if (arr.length >= this.limits.maxParticles + 80) return null;
    const obj = this.particlePool.acquire(data);
    arr.push(obj);
    return obj;
  }

  burst(count, factory, priority = 0) {
    const load = this.loadFactor();
    const scale = load > .9 ? .28 : load > .7 ? .5 : load > .5 ? .72 : 1;
    const n = Math.max(1, Math.floor(count * scale));
    for (let i = 0; i < n; i++) this.particle(factory(i), priority);
  }

  ring(data, priority = 0) {
    const arr = this.state.rings;
    if (arr.length >= this.limits.maxRings && priority < 2) return null;
    if (arr.length >= this.limits.maxRings + 32) return null;
    const obj = this.ringPool.acquire(data);
    arr.push(obj);
    return obj;
  }

  floating(data, priority = 0) {
    const arr = this.state.floating;
    if (arr.length >= this.limits.maxFloating && priority < 2) return null;
    if (arr.length >= this.limits.maxFloating + 24) return null;
    const obj = this.floatingPool.acquire(data);
    arr.push(obj);
    return obj;
  }

  update(dt) {
    const s = this.state;
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= .985;
      p.vy *= .985;
      if (p.life <= 0) {
        const last = s.particles.pop();
        if (i < s.particles.length) s.particles[i] = last;
        this.particlePool.release(p);
      }
    }

    for (let i = s.rings.length - 1; i >= 0; i--) {
      const r = s.rings[i];
      r.t += dt;
      if (r.t >= r.life) {
        const last = s.rings.pop();
        if (i < s.rings.length) s.rings[i] = last;
        this.ringPool.release(r);
      }
    }

    for (let i = s.floating.length - 1; i >= 0; i--) {
      const f = s.floating[i];
      f.life -= dt;
      f.y -= 25 * dt;
      if (f.life <= 0) {
        const last = s.floating.pop();
        if (i < s.floating.length) s.floating[i] = last;
        this.floatingPool.release(f);
      }
    }
  }
}
