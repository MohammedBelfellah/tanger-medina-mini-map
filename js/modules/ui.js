/**
 * UI Module
 * Handles markers and map UI elements
 * Author: Mohammed Belfellah
 */

let destinationMarker = null;
let routeLayer = null;

/**
 * Add destination marker to map
 */
function addDestinationMarker(lat, lng) {
  clearDestinationMarker();

  destinationMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: "destination-marker",
      html: '<i class="fas fa-flag-checkered" style="color: #e74c3c; font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);"></i>',
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
 */
function drawRoute(path) {
  clearRoute();

  if (!path || path.length < 2) return null;

  const latLngs = path.map((coord) => [coord[1], coord[0]]);

  // Main route line
  routeLayer = L.polyline(latLngs, {
    color: "#8e44ad",
    weight: 6,
    opacity: 0.8,
  }).addTo(map);

  // Lighter line on top
  L.polyline(latLngs, {
    color: "#a855f7",
    weight: 4,
    opacity: 1,
  }).addTo(map);

  map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

  return routeLayer;
}

/**
 * Clear route from map
 */
function clearRoute() {
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }

  // Remove all purple polylines
  map.eachLayer((layer) => {
    if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
      if (
        layer.options &&
        (layer.options.color === "#8e44ad" || layer.options.color === "#a855f7")
      ) {
        map.removeLayer(layer);
      }
    }
  });
}

/**
 * Get current route layer
 */
function getRouteLayer() {
  return routeLayer;
}

/**
 * Show arrival popup
 */
function showArrivalPopup() {
  if (destinationMarker) {
    destinationMarker.bindPopup("You have arrived!").openPopup();
  }

  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}
