let simulationInterval = null;
let simulationPath = [];
let simulationIndex = 0;

// ms between steps
let simulationSpeed = 700;

// optional smoothing: add intermediate points
const INTERPOLATE_STEPS = 2;

function getRoutePathFromLayer(routeLayer) {
  const latLngs = routeLayer.getLatLngs();
  // routeLayer is polyline => array of LatLng
  return latLngs.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
}

function interpolatePath(points, steps) {
  if (!steps || steps < 1) return points;
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    out.push(a);
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      out.push({
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
      });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * Start simulating GPS movement along the current route
 */
function startSimulation() {
  if (typeof getIsNavigating !== "function" || !getIsNavigating()) {
    console.log("Start navigation first.");
    return;
  }

  if (typeof getRouteLayer !== "function") {
    console.log("UI route layer missing.");
    return;
  }

  const routeLayer = getRouteLayer();
  if (!routeLayer) {
    console.log("No route found.");
    return;
  }

  const basePath = getRoutePathFromLayer(routeLayer);
  if (!basePath || basePath.length < 2) {
    console.log("Route too short.");
    return;
  }

  simulationPath = interpolatePath(basePath, INTERPOLATE_STEPS);
  simulationIndex = 0;

  console.log("Starting GPS simulation...");

  stopSimulation(); // ensure only one interval

  simulationInterval = setInterval(() => {
    if (simulationIndex >= simulationPath.length) {
      stopSimulation();
      console.log("Arrived at destination (simulation).");
      return;
    }

    const pos = simulationPath[simulationIndex];

    if (typeof updateUserPosition === "function") {
      updateUserPosition(pos.lat, pos.lng, true);
    }

    simulationIndex++;
  }, simulationSpeed);
}

/**
 * Stop the GPS simulation
 */
function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log("Simulation stopped.");
  }
}

/**
 * Set simulation speed
 */
function setSimulationSpeed(ms) {
  const v = Number(ms);
  if (!Number.isFinite(v) || v < 80) return;

  simulationSpeed = v;
  console.log("Speed set to " + ms + "ms");

  if (simulationInterval) {
    startSimulation(); // restart with new speed
  }
}

/**
 * Teleport to a specific location
 */
function teleportTo(lat, lng) {
  if (typeof updateUserPosition === "function") {
    updateUserPosition(Number(lat), Number(lng), true);
  }
}

/**
 * Move position by offset
 */
function nudge(latOffset = 0.0001, lngOffset = 0) {
  const loc = typeof getUserLocation === "function" ? getUserLocation() : null;
  if (!loc) {
    console.log("Location not set.");
    return;
  }

  if (typeof updateUserPosition === "function") {
    updateUserPosition(loc.lat + latOffset, loc.lng + lngOffset, true);
  }
}

/**
 * Simulate walking a custom path
 */
function simulateCustomPath(points) {
  if (!Array.isArray(points) || points.length < 2) {
    console.log("Provide array of {lat, lng} points");
    return;
  }

  simulationPath = interpolatePath(points, INTERPOLATE_STEPS);
  simulationIndex = 0;

  stopSimulation();

  simulationInterval = setInterval(() => {
    if (simulationIndex >= simulationPath.length) {
      stopSimulation();
      return;
    }

    const pos = simulationPath[simulationIndex];

    if (typeof updateUserPosition === "function") {
      updateUserPosition(pos.lat, pos.lng, true);
    }

    simulationIndex++;
  }, simulationSpeed);
}

console.log("GPS Simulator loaded ✅");