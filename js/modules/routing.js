/**
 * Routing Module
 * Handles pathfinding using Dijkstra's algorithm
 */

let streetsData = null;
let streetGraph = null;

// Tunables
const CONNECT_TOLERANCE_M = 15; // meters (snap nodes)
const AUTO_CONNECT_M = 20;      // meters (connect nearby nodes)

function setStreetsData(data) {
  streetsData = data;
  buildStreetGraph();
}

/**
 * Convert meters to approx degrees (rough but ok at Tangier)
 */
function metersToDegrees(m) {
  // ~111,320m per degree latitude
  return m / 111320;
}

/**
 * Safely ensure coordinate is [lng,lat] numbers
 */
function normalizeCoord(coord) {
  if (!Array.isArray(coord) || coord.length < 2) return null;
  const lng = Number(coord[0]);
  const lat = Number(coord[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

/**
 * Extract all line coordinate sequences from GeoJSON (LineString + MultiLineString)
 */
function extractLineStrings(geojson) {
  const lines = [];
  if (!geojson || !Array.isArray(geojson.features)) return lines;

  geojson.features.forEach((f) => {
    const g = f && f.geometry;
    if (!g) return;

    if (g.type === "LineString" && Array.isArray(g.coordinates)) {
      lines.push(g.coordinates);
    } else if (g.type === "MultiLineString" && Array.isArray(g.coordinates)) {
      // MultiLineString: [ [ [lng,lat], ... ], [ ... ] ]
      g.coordinates.forEach((part) => {
        if (Array.isArray(part)) lines.push(part);
      });
    }
  });

  return lines;
}

/**
 * Build graph from streets GeoJSON
 */
function buildStreetGraph() {
  if (!streetsData) return;

  const CONNECT_TOL = metersToDegrees(CONNECT_TOLERANCE_M);
  const AUTO_CONNECT = metersToDegrees(AUTO_CONNECT_M);

  streetGraph = { nodes: new Map() };

  // Grid index for faster nearby search
  const cellSize = AUTO_CONNECT; // degree
  const grid = new Map(); // key -> array of nodeKeys

  const cellKey = (lng, lat) =>
    `${Math.floor(lng / cellSize)}:${Math.floor(lat / cellSize)}`;

  const coordKey = (coord) => {
    const c = normalizeCoord(coord);
    if (!c) return null;
    // 5 decimals ~ 1m-ish
    return `${c[0].toFixed(5)},${c[1].toFixed(5)}`;
  };

  const addToGrid = (nodeKey, coord) => {
    const k = cellKey(coord[0], coord[1]);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(nodeKey);
  };

  const neighborCells = (lng, lat) => {
    const cx = Math.floor(lng / cellSize);
    const cy = Math.floor(lat / cellSize);
    const keys = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        keys.push(`${cx + dx}:${cy + dy}`);
      }
    }
    return keys;
  };

  const findNearbyNode = (coord) => {
    const c = normalizeCoord(coord);
    if (!c) return null;

    let nearest = null;
    let min = CONNECT_TOL;

    const cells = neighborCells(c[0], c[1]);
    for (const ck of cells) {
      const arr = grid.get(ck);
      if (!arr) continue;

      for (const nk of arr) {
        const node = streetGraph.nodes.get(nk);
        if (!node) continue;

        const dist = Math.hypot(node.coord[0] - c[0], node.coord[1] - c[1]);
        if (dist < min) {
          min = dist;
          nearest = nk;
        }
      }
    }
    return nearest;
  };

  const getNodeKey = (coord) => {
    const c = normalizeCoord(coord);
    if (!c) return null;

    const direct = coordKey(c);
    if (direct && streetGraph.nodes.has(direct)) return direct;

    // fallback near search
    let nearest = null;
    let min = CONNECT_TOL * 2;

    const cells = neighborCells(c[0], c[1]);
    for (const ck of cells) {
      const arr = grid.get(ck);
      if (!arr) continue;

      for (const nk of arr) {
        const node = streetGraph.nodes.get(nk);
        if (!node) continue;

        const dist = Math.hypot(node.coord[0] - c[0], node.coord[1] - c[1]);
        if (dist < min) {
          min = dist;
          nearest = nk;
        }
      }
    }
    return nearest;
  };

  const lines = extractLineStrings(streetsData);

  // 1) Create nodes
  lines.forEach((coords) => {
    coords.forEach((coord) => {
      const c = normalizeCoord(coord);
      if (!c) return;

      const existing = findNearbyNode(c);
      if (!existing) {
        const k = coordKey(c);
        if (!k) return;
        if (!streetGraph.nodes.has(k)) {
          streetGraph.nodes.set(k, { coord: c, edges: [] });
          addToGrid(k, c);
        }
      }
    });
  });

  // 2) Build edges (along each line)
  lines.forEach((coords) => {
    for (let i = 0; i < coords.length - 1; i++) {
      const a = normalizeCoord(coords[i]);
      const b = normalizeCoord(coords[i + 1]);
      if (!a || !b) continue;

      const fromKey = getNodeKey(a);
      const toKey = getNodeKey(b);
      if (!fromKey || !toKey || fromKey === toKey) continue;

      const fromNode = streetGraph.nodes.get(fromKey);
      const toNode = streetGraph.nodes.get(toKey);
      if (!fromNode || !toNode) continue;

      const dist = calculateCoordDistance(fromNode.coord, toNode.coord);

      if (!fromNode.edges.some((e) => e.to === toKey)) {
        fromNode.edges.push({ to: toKey, distance: dist });
      }
      if (!toNode.edges.some((e) => e.to === fromKey)) {
        toNode.edges.push({ to: fromKey, distance: dist });
      }
    }
  });

  // 3) Auto-connect nearby nodes (grid-based, not O(n^2))
  streetGraph.nodes.forEach((nodeA, keyA) => {
    const cells = neighborCells(nodeA.coord[0], nodeA.coord[1]);
    for (const ck of cells) {
      const arr = grid.get(ck);
      if (!arr) continue;

      for (const keyB of arr) {
        if (keyA === keyB) continue;
        const nodeB = streetGraph.nodes.get(keyB);
        if (!nodeB) continue;

        const approx = Math.hypot(
          nodeA.coord[0] - nodeB.coord[0],
          nodeA.coord[1] - nodeB.coord[1]
        );

        if (approx < AUTO_CONNECT) {
          const realDist = calculateCoordDistance(nodeA.coord, nodeB.coord);

          if (!nodeA.edges.some((e) => e.to === keyB)) {
            nodeA.edges.push({ to: keyB, distance: realDist });
          }
        }
      }
    }
  });

  // stats
  let edges = 0;
  streetGraph.nodes.forEach((n) => (edges += n.edges.length));
  console.log(`Graph: ${streetGraph.nodes.size} nodes, ${Math.round(edges / 2)} edges`);
}

/**
 * Find route using Dijkstra
 * startCoord/endCoord: [lng,lat]
 */
function findRoute(startCoord, endCoord) {
  if (!streetGraph || !streetGraph.nodes || streetGraph.nodes.size === 0) {
    buildStreetGraph();
  }
  if (!streetGraph || streetGraph.nodes.size === 0) return null;

  const s = normalizeCoord(startCoord);
  const e = normalizeCoord(endCoord);
  if (!s || !e) return null;

  const startNode = findNearestGraphNode(s);
  const endNode = findNearestGraphNode(e);

  if (!startNode || !endNode) return null;

  if (startNode === endNode) {
    return { path: [s, e], distance: calculateCoordDistance(s, e) };
  }

  const distances = new Map();
  const previous = new Map();
  const visited = new Set();

  streetGraph.nodes.forEach((_, k) => distances.set(k, Infinity));
  distances.set(startNode, 0);

  while (true) {
    let current = null;
    let minDist = Infinity;

    distances.forEach((d, k) => {
      if (!visited.has(k) && d < minDist) {
        minDist = d;
        current = k;
      }
    });

    if (current === null) break;
    if (current === endNode) break;

    visited.add(current);

    const node = streetGraph.nodes.get(current);
    if (!node) continue;

    node.edges.forEach((edge) => {
      if (visited.has(edge.to)) return;
      const nd = distances.get(current) + edge.distance;
      if (nd < distances.get(edge.to)) {
        distances.set(edge.to, nd);
        previous.set(edge.to, current);
      }
    });
  }

  if (!previous.has(endNode)) return null;

  // reconstruct
  const path = [];
  let cur = endNode;
  while (cur) {
    const node = streetGraph.nodes.get(cur);
    if (node) path.unshift(node.coord);
    cur = previous.get(cur);
  }

  // add real start/end
  path.unshift(s);
  path.push(e);

  // compute distance
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += calculateCoordDistance(path[i], path[i + 1]);
  }

  return { path, distance: total };
}

/**
 * Find nearest node in graph
 */
function findNearestGraphNode(coord) {
  const c = normalizeCoord(coord);
  if (!c) return null;

  let nearest = null;
  let minDist = Infinity;

  streetGraph.nodes.forEach((node, key) => {
    const d = calculateCoordDistance(c, node.coord);
    if (d < minDist) {
      minDist = d;
      nearest = key;
    }
  });

  return nearest;
}

/**
 * Distance between [lng,lat] in meters
 */
function calculateCoordDistance(coord1, coord2) {
  const a = normalizeCoord(coord1);
  const b = normalizeCoord(coord2);
  if (!a || !b) return Infinity;

  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) *
      Math.cos((b[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}