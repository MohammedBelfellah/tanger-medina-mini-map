/**
 * GPS Simulator for Testing Live Navigation
 * Author: Mohammed Belfellah
 */

let simulationInterval = null;
let simulationPath = [];
let simulationIndex = 0;
let simulationSpeed = 1000;

/**
 * Start simulating GPS movement along the current route
 */
function startSimulation() {
  if (!isNavigating || !currentDestination) {
    console.log("Please start navigation first");
    return;
  }

  if (!routeLayer) {
    console.log("No route found");
    return;
  }

  const latLngs = routeLayer.getLatLngs();
  simulationPath = latLngs.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
  simulationIndex = 0;

  if (simulationPath.length < 2) {
    console.log("Route too short");
    return;
  }

  console.log("Starting simulation...");

  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  simulationInterval = setInterval(() => {
    if (simulationIndex >= simulationPath.length) {
      stopSimulation();
      console.log("Arrived at destination");
      return;
    }

    const pos = simulationPath[simulationIndex];
    updateUserPosition(pos.lat, pos.lng, true);
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
    console.log("Simulation stopped");
  }
}

/**
 * Set simulation speed
 */
function setSimulationSpeed(ms) {
  simulationSpeed = ms;
  console.log("Speed set to " + ms + "ms");

  if (simulationInterval) {
    stopSimulation();
    startSimulation();
  }
}

/**
 * Teleport to a specific location
 */
function teleportTo(lat, lng) {
  updateUserPosition(lat, lng, true);
}

/**
 * Move position by offset
 */
function nudge(latOffset, lngOffset) {
  if (!userLocation) {
    console.log("Location not set");
    return;
  }

  latOffset = latOffset || 0.0001;
  lngOffset = lngOffset || 0;

  updateUserPosition(
    userLocation.lat + latOffset,
    userLocation.lng + lngOffset,
    true,
  );
}

/**
 * Simulate walking a custom path
 */
function simulateCustomPath(points) {
  if (!Array.isArray(points) || points.length < 2) {
    console.log("Provide array of {lat, lng} points");
    return;
  }

  simulationPath = points;
  simulationIndex = 0;

  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  simulationInterval = setInterval(() => {
    if (simulationIndex >= simulationPath.length) {
      stopSimulation();
      return;
    }

    const pos = simulationPath[simulationIndex];
    updateUserPosition(pos.lat, pos.lng, true);
    simulationIndex++;
  }, simulationSpeed);
}

console.log("GPS Simulator loaded");
