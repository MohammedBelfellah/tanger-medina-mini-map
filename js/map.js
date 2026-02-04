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
        '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flag_of_Morocco.svg/1280px-Flag_of_Morocco.svg.png" style="height: 14px; vertical-align: middle; margin-right: 5px;"> Tanger Medina Mini-Map',
    })
    .addTo(map);

  // Base map layer (Stamen Toner Lite via Stadia Maps)
  // API key is domain-restricted in Stadia Maps dashboard for security
  const STADIA_API_KEY = "18627d38-4099-488c-981c-41a1c7cf5a98";

  L.tileLayer(
    `https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`,
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a>',
    },
  ).addTo(map);

  // Load medina boundary data
  loadMedinaBoundary();

  // Load medina streets data
  loadMedinaStreets();

  // Load points of interest
  loadPOIs();
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
 * Render the medina streets on the map
 * Dead-end streets in orange, connected streets in brown
 * @param {Object} geojsonData - GeoJSON data for the streets
 */
function renderMedinaStreets(geojsonData) {
  // Build a map of all endpoints to detect connections
  const endpointCount = {};
  const tolerance = 0.00005; // ~5 meters tolerance for matching points

  // Round coordinates to detect nearby points as same
  const roundCoord = (coord) => {
    return `${Math.round(coord[0] / tolerance) * tolerance},${Math.round(coord[1] / tolerance) * tolerance}`;
  };

  // Count how many streets connect at each endpoint
  geojsonData.features.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    const start = roundCoord(coords[0]);
    const end = roundCoord(coords[coords.length - 1]);

    endpointCount[start] = (endpointCount[start] || 0) + 1;
    endpointCount[end] = (endpointCount[end] || 0) + 1;
  });

  // Render streets with different colors based on connectivity
  L.geoJSON(geojsonData, {
    style: function (feature) {
      const coords = feature.geometry.coordinates;
      const start = roundCoord(coords[0]);
      const end = roundCoord(coords[coords.length - 1]);

      // Dead-end: one endpoint connects to only 1 street (itself)
      const isDeadEnd = endpointCount[start] === 1 || endpointCount[end] === 1;

      if (isDeadEnd) {
        return {
          color: "#E67E22", // Orange for dead-end streets
          weight: 3,
          opacity: 0.9,
          dashArray: "5, 5", // Dashed line for dead-ends
        };
      } else {
        return {
          color: "#2C3E50", // Dark blue-gray for connected streets
          weight: 3,
          opacity: 0.9,
        };
      }
    },
  }).addTo(map);
}

/**
 * Render POIs on the map with colored markers and popups
 * @param {Object} geojsonData - GeoJSON data for POIs
 */
function renderPOIs(geojsonData) {
  // Color mapping for POI types
  const typeColors = {
    square: "#3498db", // Blue
    culture: "#9b59b6", // Purple
    museum: "#e67e22", // Orange
    street: "#27ae60", // Green
    monument: "#e74c3c", // Red
    viewpoint: "#1abc9c", // Teal
    cafe: "#f39c12", // Yellow
    gate: "#8e44ad", // Dark purple for gates (Bab)
  };

  L.geoJSON(geojsonData, {
    pointToLayer: function (feature, latlng) {
      const poiType = feature.properties.type;
      const color = typeColors[poiType] || "#E63946";

      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });
    },
    onEachFeature: function (feature, layer) {
      if (feature.properties) {
        const { name, type, short_description } = feature.properties;
        layer.bindPopup(`
          <strong>${name}</strong><br>
          <em>${type}</em><br>
          <small>${short_description}</small>
        `);
      }
    },
  }).addTo(map);
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
