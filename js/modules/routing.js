/**
 * Routing Module
 * Handles pathfinding using Dijkstra's algorithm
 * Author: Mohammed Belfellah
 */

let streetsData = null;
let streetGraph = null;

/**
 * Set streets data and build graph
 */
function setStreetsData(data) {
  streetsData = data;
  buildStreetGraph();
}

/**
 * Build graph from streets GeoJSON
 */
function buildStreetGraph() {
  if (!streetsData) return;

  streetGraph = {
    nodes: new Map(),
  };

  const CONNECT_TOLERANCE = 0.00015; // ~15 meters
  const AUTO_CONNECT_DIST = 0.0002; // ~20 meters

  const coordKey = (coord) => `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;

  // Find nearby existing node
  const findNearbyNode = (coord) => {
    let nearest = null;
    let minDist = CONNECT_TOLERANCE;

    streetGraph.nodes.forEach((node, key) => {
      const dist = Math.sqrt(
        Math.pow(node.coord[0] - coord[0], 2) +
          Math.pow(node.coord[1] - coord[1], 2),
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = key;
      }
    });
    return nearest;
  };

  // First pass: Create nodes
  streetsData.features.forEach((feature) => {
    feature.geometry.coordinates.forEach((coord) => {
      const existingKey = findNearbyNode(coord);
      if (!existingKey) {
        const key = coordKey(coord);
        if (!streetGraph.nodes.has(key)) {
          streetGraph.nodes.set(key, { coord: coord, edges: [] });
        }
      }
    });
  });

  // Get node key for coordinate
  const getNodeKey = (coord) => {
    const directKey = coordKey(coord);
    if (streetGraph.nodes.has(directKey)) return directKey;

    let nearest = null;
    let minDist = CONNECT_TOLERANCE * 2;

    streetGraph.nodes.forEach((node, key) => {
      const dist = Math.sqrt(
        Math.pow(node.coord[0] - coord[0], 2) +
          Math.pow(node.coord[1] - coord[1], 2),
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = key;
      }
    });
    return nearest;
  };

  // Second pass: Build edges
  streetsData.features.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
      const fromKey = getNodeKey(coords[i]);
      const toKey = getNodeKey(coords[i + 1]);

      if (fromKey && toKey && fromKey !== toKey) {
        const dist = calculateCoordDistance(
          streetGraph.nodes.get(fromKey).coord,
          streetGraph.nodes.get(toKey).coord,
        );

        const fromNode = streetGraph.nodes.get(fromKey);
        const toNode = streetGraph.nodes.get(toKey);

        // Add bidirectional edges
        if (!fromNode.edges.some((e) => e.to === toKey)) {
          fromNode.edges.push({ to: toKey, distance: dist });
        }
        if (!toNode.edges.some((e) => e.to === fromKey)) {
          toNode.edges.push({ to: fromKey, distance: dist });
        }
      }
    }
  });

  // Third pass: Auto-connect nearby nodes
  const nodesArray = Array.from(streetGraph.nodes.entries());
  for (let i = 0; i < nodesArray.length; i++) {
    for (let j = i + 1; j < nodesArray.length; j++) {
      const [keyA, nodeA] = nodesArray[i];
      const [keyB, nodeB] = nodesArray[j];

      const dist = Math.sqrt(
        Math.pow(nodeA.coord[0] - nodeB.coord[0], 2) +
          Math.pow(nodeA.coord[1] - nodeB.coord[1], 2),
      );

      if (dist < AUTO_CONNECT_DIST) {
        const realDist = calculateCoordDistance(nodeA.coord, nodeB.coord);

        if (!nodeA.edges.some((e) => e.to === keyB)) {
          nodeA.edges.push({ to: keyB, distance: realDist });
        }
        if (!nodeB.edges.some((e) => e.to === keyA)) {
          nodeB.edges.push({ to: keyA, distance: realDist });
        }
      }
    }
  }

  let totalEdges = 0;
  streetGraph.nodes.forEach((node) => (totalEdges += node.edges.length));
  console.log(
    `Graph: ${streetGraph.nodes.size} nodes, ${totalEdges / 2} edges`,
  );
}

/**
 * Find route using Dijkstra's algorithm
 */
function findRoute(startCoord, endCoord) {
  if (!streetGraph || streetGraph.nodes.size === 0) {
    buildStreetGraph();
  }

  const startNode = findNearestGraphNode(startCoord);
  const endNode = findNearestGraphNode(endCoord);

  if (!startNode || !endNode) {
    console.log("Could not find start or end node");
    return null;
  }

  if (startNode === endNode) {
    return {
      path: [startCoord, endCoord],
      distance: calculateCoordDistance(startCoord, endCoord),
    };
  }

  // Dijkstra's algorithm
  const distances = new Map();
  const previous = new Map();
  const visited = new Set();

  streetGraph.nodes.forEach((_, key) => distances.set(key, Infinity));
  distances.set(startNode, 0);

  while (true) {
    let current = null;
    let minDist = Infinity;

    distances.forEach((dist, key) => {
      if (!visited.has(key) && dist < minDist) {
        minDist = dist;
        current = key;
      }
    });

    if (current === null || current === endNode) break;

    visited.add(current);

    const currentNode = streetGraph.nodes.get(current);
    if (currentNode && currentNode.edges) {
      currentNode.edges.forEach((edge) => {
        if (!visited.has(edge.to)) {
          const newDist = distances.get(current) + edge.distance;
          if (newDist < distances.get(edge.to)) {
            distances.set(edge.to, newDist);
            previous.set(edge.to, current);
          }
        }
      });
    }
  }

  if (!previous.has(endNode) && startNode !== endNode) {
    console.log("No path found");
    return null;
  }

  // Reconstruct path
  const path = [];
  let current = endNode;

  while (current) {
    const node = streetGraph.nodes.get(current);
    if (node) path.unshift(node.coord);
    current = previous.get(current);
  }

  if (path.length > 0) {
    path.unshift(startCoord);
    path.push(endCoord);
  }

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += calculateCoordDistance(path[i], path[i + 1]);
  }

  return path.length >= 2 ? { path, distance: totalDistance } : null;
}

/**
 * Find nearest node in graph
 */
function findNearestGraphNode(coord) {
  let nearest = null;
  let minDist = Infinity;

  streetGraph.nodes.forEach((node, key) => {
    const dist = calculateCoordDistance(coord, node.coord);
    if (dist < minDist) {
      minDist = dist;
      nearest = key;
    }
  });

  return nearest;
}

/**
 * Calculate distance between coordinates (meters)
 */
function calculateCoordDistance(coord1, coord2) {
  const R = 6371000;
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLng = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[1] * Math.PI) / 180) *
      Math.cos((coord2[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
