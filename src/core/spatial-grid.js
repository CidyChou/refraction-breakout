export class SpatialGrid {
  constructor(width, height, cellSize = 64) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = Array.from({ length: this.cols * this.rows }, () => []);
    this.queryCount = 0;
    this.candidateCount = 0;
  }

  resetStats() {
    this.queryCount = 0;
    this.candidateCount = 0;
  }

  clear() {
    for (const cell of this.cells) cell.length = 0;
    this.resetStats();
  }

  cellIndex(x, y) {
    const cx = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
    const cy = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    return cy * this.cols + cx;
  }

  insert(entity) {
    this.cells[this.cellIndex(entity.x, entity.y)].push(entity);
  }

  rebuild(entities, predicate = null) {
    this.clear();
    if (predicate) {
      for (const entity of entities) if (predicate(entity)) this.insert(entity);
    } else {
      for (const entity of entities) this.insert(entity);
    }
  }

  forEachInCircle(x, y, radius, fn) {
    this.forEachInAabb(x - radius, y - radius, x + radius, y + radius, fn);
  }

  forEachInAabb(left, top, right, bottom, fn) {
    this.queryCount++;
    const cs = this.cellSize;
    const minX = Math.max(0, Math.floor(left / cs));
    const maxX = Math.min(this.cols - 1, Math.floor(right / cs));
    const minY = Math.max(0, Math.floor(top / cs));
    const maxY = Math.min(this.rows - 1, Math.floor(bottom / cs));
    for (let cy = minY; cy <= maxY; cy++) {
      const row = cy * this.cols;
      for (let cx = minX; cx <= maxX; cx++) {
        const cell = this.cells[row + cx];
        this.candidateCount += cell.length;
        for (let i = 0; i < cell.length; i++) fn(cell[i]);
      }
    }
  }
}
