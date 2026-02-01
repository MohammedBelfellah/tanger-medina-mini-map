/**
 * Tanger Medina Mini-Map
 * Map functionality module
 * Author: Mohammed Belfellah
 */

let map;

/**
 * Initialize the Leaflet map with custom settings
 */
function initializeMap() {
  // Map bounds: Morocco region (prevents panning too far away)
  const bounds = L.latLngBounds(
    L.latLng(27.5, -15.0), // Southwest corner
    L.latLng(40.0, 0.0), // Northeast corner
  );

  // Create map instance
  map = L.map("map", {
    minZoom: 6,
    maxZoom: 19,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0,
    attributionControl: false,
  }).setView([35.788, -5.809], 16); // Center on Old Medina

  // Custom attribution with Morocco flag
  L.control
    .attribution({
      prefix:
        '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flag_of_Morocco.svg/1280px-Flag_of_Morocco.svg.png" style="height: 14px; vertical-align: middle; margin-right: 5px;"> Mohammed Belfellah | Tanger Medina Mini-Map',
    })
    .addTo(map);

  // Base map layer (CartoDB Positron - clean, minimal style)
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    { maxZoom: 19 },
  ).addTo(map);

  // Labels pane (rendered on top of everything)
  map.createPane("labelsPane");
  map.getPane("labelsPane").style.zIndex = 700;
  map.getPane("labelsPane").style.pointerEvents = "none";

  // Map labels layer
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
    { pane: "labelsPane", maxZoom: 19 },
  ).addTo(map);

  // Load medina boundary data
  loadMedinaBoundary();
}

/**
 * Render the Old Medina boundary polygon on the map
 * @param {Object} geojsonData - GeoJSON data for the medina boundary
 */
function renderMedinaBoundary(geojsonData) {
  const medinaLayer = L.geoJSON(geojsonData, {
    style: {
      color: "#E63946", // Red border
      weight: 3,
      opacity: 0.9,
      fillColor: "#FFEAEA", // Light pink fill
      fillOpacity: 0.4,
    },
  }).addTo(map);

  // Fit map view to show the medina
  map.fitBounds(medinaLayer.getBounds(), { padding: [50, 50] });

  // Add place labels
  addMedinaLabels();
}

/**
 * Add text labels for key places inside the Old Medina
 */
function addMedinaLabels() {
  // Custom pane for labels
  if (!map.getPane("customLabelsPane")) {
    map.createPane("customLabelsPane");
    map.getPane("customLabelsPane").style.zIndex = 680;
  }

  // Key places in the Old Medina
  const places = [
    { name: "OLD MEDINA", lat: 35.786, lng: -5.811, size: "large" },
    { name: "Kasbah", lat: 35.788, lng: -5.808, size: "medium" },
    { name: "Petit Socco", lat: 35.785, lng: -5.812, size: "medium" },
    { name: "Grand Mosque", lat: 35.7865, lng: -5.8095, size: "small" },
    { name: "Bab Fahs", lat: 35.783, lng: -5.81, size: "small" },
    { name: "Dar el Makhzen", lat: 35.789, lng: -5.809, size: "small" },
  ];

  // Create label markers
  places.forEach((place) => {
    const sizeClass =
      place.size === "large"
        ? "label-large"
        : place.size === "medium"
          ? "label-medium"
          : "label-small";

    const icon = L.divIcon({
      className: `map-label ${sizeClass}`,
      html: `<span>${place.name}</span>`,
      iconSize: [100, 20],
      iconAnchor: [50, 10],
    });

    L.marker([place.lat, place.lng], {
      icon: icon,
      pane: "customLabelsPane",
      interactive: false,
    }).addTo(map);
  });
}
