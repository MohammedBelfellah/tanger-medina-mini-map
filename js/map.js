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

  // Load and display streets
  loadStreets();
}

function renderMedianaBoundary(geojsonData) {
  // Display only the boundary
  L.geoJSON(geojsonData, {
    style: {
      color: "#FF0000",
      weight: 3,
      opacity: 0.8,
      fillOpacity: 0.1,
      fillColor: "#ff4800",
    },
  }).addTo(map);

  console.log("Medina boundary rendered");
}

function renderStreets(geojsonData) {
  // Display streets with different styles based on importance
  L.geoJSON(geojsonData, {
    style: function (feature) {
      const importance = feature.properties.importance;

      // Style based on street importance
      if (importance === "high") {
        return {
          color: "#2E4057",
          weight: 4,
          opacity: 0.9,
        };
      } else if (importance === "medium") {
        return {
          color: "#4A6FA5",
          weight: 3,
          opacity: 0.8,
        };
      } else {
        return {
          color: "#7C98B3",
          weight: 2,
          opacity: 0.7,
        };
      }
    },
    onEachFeature: function (feature, layer) {
      // Add popup with street name
      if (feature.properties && feature.properties.name) {
        layer.bindPopup(
          `<strong>${feature.properties.name}</strong><br>Type: ${feature.properties.type}`,
        );
      }
    },
  }).addTo(map);

  console.log("Streets rendered");
}
