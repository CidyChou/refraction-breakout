export class ObjectPool {
  constructor(maxFree = 512) {
    this.free = [];
    this.maxFree = maxFree;
  }

  acquire(data = null) {
    const obj = this.free.pop() || {};
    for (const key in obj) delete obj[key];
    if (data) Object.assign(obj, data);
    return obj;
  }

  release(obj) {
    if (!obj || this.free.length >= this.maxFree) return;
    this.free.push(obj);
  }
}
