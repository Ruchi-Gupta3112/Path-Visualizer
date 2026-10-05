(function (root) {
  "use strict";

  class MinHeap {
    constructor() { this.items = []; }
    push(item) {
      const a = this.items;
      a.push(item);
      let i = a.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (a[parent].priority <= a[i].priority) break;
        [a[parent], a[i]] = [a[i], a[parent]];
        i = parent;
      }
    }
    pop() {
      const a = this.items;
      if (!a.length) return null;
      const first = a[0];
      const last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        while (true) {
          let smallest = i;
          const left = i * 2 + 1;
          const right = left + 1;
          if (left < a.length && a[left].priority < a[smallest].priority) smallest = left;
          if (right < a.length && a[right].priority < a[smallest].priority) smallest = right;
          if (smallest === i) break;
          [a[i], a[smallest]] = [a[smallest], a[i]];
          i = smallest;
        }
      }
      return first;
    }
    get length() { return this.items.length; }
  }

  function findPath({ rows, cols, start, goal, walls, algorithm = "astar" }) {
    const total = rows * cols;
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1 ||
        !Number.isInteger(start) || !Number.isInteger(goal) ||
        start < 0 || goal < 0 || start >= total || goal >= total ||
        (algorithm !== "astar" && algorithm !== "dijkstra")) {
      throw new Error("Invalid grid or algorithm");
    }
    const blocked = walls instanceof Set ? walls : new Set(walls || []);
    if (blocked.has(start) || blocked.has(goal)) return { visited: [], path: [], found: false };
    const distance = Array(total).fill(Infinity);
    const previous = Array(total).fill(-1);
    const closed = new Uint8Array(total);
    const visited = [];
    const heap = new MinHeap();
    const heuristic = (index) => algorithm === "astar"
      ? Math.abs(Math.floor(index / cols) - Math.floor(goal / cols)) + Math.abs(index % cols - goal % cols)
      : 0;

    distance[start] = 0;
    heap.push({ index: start, priority: heuristic(start) });
    while (heap.length) {
      const current = heap.pop().index;
      if (closed[current]) continue;
      closed[current] = 1;
      visited.push(current);
      if (current === goal) break;
      const row = Math.floor(current / cols);
      const col = current % cols;
      const neighbors = [];
      if (row > 0) neighbors.push(current - cols);
      if (col < cols - 1) neighbors.push(current + 1);
      if (row < rows - 1) neighbors.push(current + cols);
      if (col > 0) neighbors.push(current - 1);
      for (const next of neighbors) {
        if (blocked.has(next) || closed[next]) continue;
        const nextDistance = distance[current] + 1;
        if (nextDistance >= distance[next]) continue;
        distance[next] = nextDistance;
        previous[next] = current;
        heap.push({ index: next, priority: nextDistance + heuristic(next) });
      }
    }

    if (!closed[goal]) return { visited, path: [], found: false };
    const path = [];
    for (let index = goal; index !== -1; index = previous[index]) path.push(index);
    path.reverse();
    return { visited, path, found: true };
  }

  root.PathAlgorithms = { findPath };
  if (typeof module !== "undefined" && module.exports) module.exports = { findPath };
})(globalThis);
