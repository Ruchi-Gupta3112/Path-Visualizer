# Pathfinder Lab

An interactive pathfinding visualizer built with HTML, CSS, and JavaScript.

## Run

Open `index.html` in Chrome, Edge, or another modern browser. Keep `index.html`, `styles.css`, `algorithms.js`, and `app.js` together in the same folder. No server or installation is needed.

## Explore

1. Select **Wall** and click or drag across squares to place obstacles.
2. Select **Start** or **Goal**, then click a square to move that point. You can also drag the existing start or goal marker.
3. Choose **A\* Search** or **Dijkstra's Algorithm** and select **Visualize path**.
4. Use the speed slider, grid size controls, random walls, and clear buttons to try different layouts.

Both algorithms use four-direction movement and equal-cost steps. The yellow route is a shortest path when one exists. The explored count shows how many nodes each search visited; A\* uses Manhattan distance to guide its search.
