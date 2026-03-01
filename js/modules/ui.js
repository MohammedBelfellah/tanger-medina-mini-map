/**
 * UI Module
 * Destination marker + Route drawing utilities
 * Compatible with routing.js + gps-simulator.js + navigation.js
 */

let destinationMarker = null;

// Single source of truth for route visuals
let routeGroup = null; // L.LayerGroup
let routeMainLine = null; // L.Polyline (main)
let routeGlowLine = null; // L.Polyline (glow/overlay)

/**
 * Add destination marker to map
 */
function addDestinationMarker(lat, lng) {
  clearDestinationMarker();

  destinationMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: "destination-marker",
      html: '<i class="fas fa-flag-checkered" style="color:#e74c3c;font-size:24px;text-shadow:2px 2px 4px rgba(0,0,0,0.3);"></i>',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    }),
  }).addTo(map);

  return destinationMarker;
}

/**
 * Clear destination marker
 */
function clearDestinationMarker() {
  if (destinationMarker) {
    map.removeLayer(destinationMarker);
    destinationMarker = null;
  }
}

/**
 * Get destination marker
 */
function getDestinationMarker() {
  return destinationMarker;
}

/**
 * Draw route on map
 * @param {Array} path - array of [lng, lat] coords
 * @returns {L.LayerGroup|null}
 */
function drawRoute(path) {
  clearRoute();

  if (!path || path.length < 2) return null;

  // Convert [lng,lat] -> [lat,lng]
  const latLngs = path.map((c) => [c[1], c[0]]);

  // Create a group so everything is removable in one call
  routeGroup = L.layerGroup();

  // Main route line
  routeMainLine = L.polyline(latLngs, {
    color: "#8e44ad",
    weight: 6,
    opacity: 0.85,
    lineJoin: "round",
    lineCap: "round",
  });

  // Glow line on top
  routeGlowLine = L.polyline(latLngs, {
    color: "#a855f7",
    weight: 4,
    opacity: 1,
    lineJoin: "round",
    lineCap: "round",
  });

  // Optional: small start/end dots
  const start = latLngs[0];
  const end = latLngs[latLngs.length - 1];

  const startDot = L.circleMarker(start, {
    radius: 5,
    color: "#ffffff",
    weight: 2,
    fillColor: "#27ae60",
    fillOpacity: 1,
  });

  const endDot = L.circleMarker(end, {
    radius: 5,
    color: "#ffffff",
    weight: 2,
    fillColor: "#e74c3c",
    fillOpacity: 1,
  });

  routeGroup.addLayer(routeMainLine);
  routeGroup.addLayer(routeGlowLine);
  routeGroup.addLayer(startDot);
  routeGroup.addLayer(endDot);

  routeGroup.addTo(map);

  // Fit to route bounds
  map.fitBounds(routeMainLine.getBounds(), { padding: [50, 50] });

  return routeGroup;
}

/**
 * Clear route from map (ONLY the route)
 */
function clearRoute() {
  if (routeGroup) {
    map.removeLayer(routeGroup);
    routeGroup = null;
    routeMainLine = null;
    routeGlowLine = null;
  }
}

/**
 * Get current route layer (used by gps-simulator)
 * We'll return the MAIN polyline if it exists,
 * because it supports getLatLngs() cleanly.
 */
function getRouteLayer() {
  return routeMainLine || null;
}

/**
 * Show arrival popup + vibration
 */
function showArrivalPopup() {
  if (destinationMarker) {
    destinationMarker.bindPopup("You have arrived!").openPopup();
  }

  // Mobile vibration (optional)
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}