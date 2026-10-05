(function () {
  "use strict";

  const { findPath } = globalThis.PathAlgorithms;
  const gridElement = document.querySelector("#grid");
  const statusElement = document.querySelector("#status");
  const algorithmElement = document.querySelector("#algorithm");
  const speedElement = document.querySelector("#speed");
  const visualizeButton = document.querySelector("#visualize");
  const stopButton = document.querySelector("#stop");
  const cells = [];
  const state = {
    rows: 16, cols: 28, start: 0, goal: 0,
    walls: new Set(), visited: new Set(), path: new Set(),
    tool: "wall", running: false, runToken: 0, dragAction: null
  };

  function announce(message, kind = "normal") {
    statusElement.textContent = message;
    statusElement.dataset.kind = kind;
  }

  function updateStats(visited = "—", length = "—") {
    document.querySelector("#visited-count").textContent = String(visited);
    document.querySelector("#path-length").textContent = String(length);
    document.querySelector("#algorithm-name").textContent = algorithmElement.value === "astar" ? "A*" : "Dijkstra";
  }

  function cancelAnimation() {
    state.runToken++;
    state.running = false;
    visualizeButton.disabled = false;
    stopButton.disabled = true;
  }

  function clearResults() {
    cancelAnimation();
    state.visited.clear();
    state.path.clear();
    updateStats();
    renderGrid();
  }

  function cellDescription(index) {
    const row = Math.floor(index / state.cols) + 1;
    const col = index % state.cols + 1;
    const kind = index === state.start ? "start" : index === state.goal ? "goal" : state.walls.has(index) ? "wall" : "empty";
    return `Row ${row}, column ${col}, ${kind}`;
  }

  function renderGrid() {
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      cell.classList.toggle("start", index === state.start);
      cell.classList.toggle("goal", index === state.goal);
      cell.classList.toggle("wall", state.walls.has(index));
      cell.classList.toggle("explored", state.visited.has(index));
      cell.classList.toggle("path", state.path.has(index));
      cell.setAttribute("aria-label", cellDescription(index));
    }
  }

  function makeGrid(rows, cols) {
    cancelAnimation();
    state.rows = rows;
    state.cols = cols;
    state.start = Math.floor(rows / 2) * cols + Math.floor(cols / 5);
    state.goal = Math.floor(rows / 2) * cols + Math.floor(cols * 4 / 5);
    state.walls.clear();
    state.visited.clear();
    state.path.clear();
    state.dragAction = null;
    cells.length = 0;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < rows * cols; index++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = index;
      cell.setAttribute("role", "gridcell");
      cell.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        state.dragAction = index === state.start ? "start" : index === state.goal ? "goal" : state.tool;
        if (state.dragAction === "wall") state.dragAction = state.walls.has(index) ? "remove-wall" : "add-wall";
        applyTool(index);
      });
      fragment.append(cell);
      cells.push(cell);
    }
    gridElement.replaceChildren(fragment);
    gridElement.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    gridElement.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
    gridElement.style.minWidth = `${cols * 22}px`;
    gridElement.style.aspectRatio = `${cols} / ${rows}`;
    document.querySelector("#grid-size-label").textContent = `${cols} × ${rows} grid`;
    updateStats();
    renderGrid();
    announce("Grid ready. Draw walls, then visualize the path.");
  }

  function applyTool(index) {
    if (state.running) cancelAnimation();
    const action = state.dragAction || state.tool;
    if (action === "start" && index !== state.goal) {
      state.start = index;
      state.walls.delete(index);
    } else if (action === "goal" && index !== state.start) {
      state.goal = index;
      state.walls.delete(index);
    } else if (index !== state.start && index !== state.goal) {
      if (action === "add-wall" || action === "wall") state.walls.add(index);
      if (action === "remove-wall" || action === "erase") state.walls.delete(index);
    }
    state.visited.clear();
    state.path.clear();
    updateStats();
    renderGrid();
    announce("Grid updated. Visualize when you're ready.");
  }

  gridElement.addEventListener("pointermove", (event) => {
    if (!state.dragAction) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".cell");
    if (target && gridElement.contains(target)) applyTool(Number(target.dataset.index));
  });
  window.addEventListener("pointerup", () => { state.dragAction = null; });
  window.addEventListener("pointercancel", () => { state.dragAction = null; });
  gridElement.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    const target = event.target.closest(".cell");
    if (target) applyTool(Number(target.dataset.index));
  });

  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tool = button.dataset.tool;
      document.querySelectorAll("[data-tool]").forEach((tool) => {
        const active = tool === button;
        tool.classList.toggle("active", active);
        tool.setAttribute("aria-pressed", String(active));
      });
      announce(`${button.textContent.trim()} tool selected.`);
    });
  });

  algorithmElement.addEventListener("change", () => {
    clearResults();
    document.querySelector("#algorithm-description").textContent = algorithmElement.value === "astar"
      ? "Uses a distance estimate to explore toward the goal."
      : "Explores outward by distance to guarantee the shortest path.";
    announce(`${algorithmElement.value === "astar" ? "A* Search" : "Dijkstra's Algorithm"} selected.`);
  });

  speedElement.addEventListener("input", () => {
    const value = Number(speedElement.value);
    document.querySelector("#speed-label").textContent = value < 34 ? "Slow" : value < 75 ? "Medium" : "Fast";
  });

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  visualizeButton.addEventListener("click", async () => {
    if (state.running) return;
    clearResults();
    const token = ++state.runToken;
    state.running = true;
    visualizeButton.disabled = true;
    stopButton.disabled = false;
    const algorithm = algorithmElement.value;
    const result = findPath({
      rows: state.rows, cols: state.cols, start: state.start, goal: state.goal,
      walls: state.walls, algorithm
    });
    const delay = Math.max(5, Math.round(70 - Number(speedElement.value) * 0.64));
    announce("Exploring the grid…");
    for (let i = 0; i < result.visited.length; i++) {
      if (token !== state.runToken) return;
      state.visited.add(result.visited[i]);
      cells[result.visited[i]].classList.add("explored");
      document.querySelector("#visited-count").textContent = String(i + 1);
      await wait(delay);
    }
    if (token !== state.runToken) return;
    if (result.found) {
      announce("Route found! Drawing the shortest path…", "success");
      for (const index of result.path) {
        if (token !== state.runToken) return;
        state.path.add(index);
        cells[index].classList.add("path");
        await wait(Math.max(12, Math.round(delay * 0.75)));
      }
      document.querySelector("#path-length").textContent = String(result.path.length - 1);
      announce(`Shortest path found in ${result.path.length - 1} steps.`, "success");
    } else {
      document.querySelector("#path-length").textContent = "No route";
      announce("No path reaches the goal. Remove some walls and try again.", "error");
    }
    state.running = false;
    visualizeButton.disabled = false;
    stopButton.disabled = true;
  });

  stopButton.addEventListener("click", () => {
    cancelAnimation();
    announce("Animation stopped. Edit the grid or visualize again.");
  });
  document.querySelector("#clear-path").addEventListener("click", () => {
    clearResults();
    announce("Search cleared. Your walls are still here.");
  });
  document.querySelector("#clear-grid").addEventListener("click", () => {
    state.walls.clear();
    clearResults();
    announce("Walls cleared. A fresh route awaits.");
  });
  document.querySelector("#random-walls").addEventListener("click", () => {
    state.walls.clear();
    for (let index = 0; index < state.rows * state.cols; index++) {
      if (index !== state.start && index !== state.goal && Math.random() < 0.24) state.walls.add(index);
    }
    clearResults();
    announce("Random walls added. Try finding a route.");
  });
  document.querySelector("#create-grid").addEventListener("click", () => {
    const rows = Number(document.querySelector("#rows").value);
    const cols = Number(document.querySelector("#cols").value);
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 8 || rows > 24 || cols < 8 || cols > 40) {
      announce("Choose 8–24 rows and 8–40 columns.", "error");
      return;
    }
    makeGrid(rows, cols);
  });

  makeGrid(16, 28);
})();
