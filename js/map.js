// Map functionality
let map;

function initializeMap() {
  // Initialize Leaflet map centered on Tangier Medina
  map = L.map("map").setView([35.788, -5.809], 16);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  console.log("Map initialized");

  // Load and display medina boundary
  loadMedianaBoundary();
}

function renderMedianaBoundary(geojsonData) {
  // Display only the boundary
  L.geoJSON(geojsonData, {
    style: {
      color: "#FF0000",
      weight: 3,
      opacity: 0.8,
      fillOpacity: 0.1,
      fillColor: "#FF0000",
    },
  }).addTo(map);

  console.log("Medina boundary rendered");
}
