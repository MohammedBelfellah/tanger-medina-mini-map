/**
 * Tanger Medina Mini-Map
 * Map functionality module
 * Author: Mohammed Belfellah
 */

let map;

/* =========================
   Helpers
   ========================= */

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPoiName(props) {
  return (
    props.name ||
    props["name:fr"] ||
    props["name:en"] ||
    props["name:ar"] ||
    "Unnamed place"
  );
}

// Normalize POI type into our 6 legend categories
function normalizePoiKey(props) {
  const amenity = props.amenity;
  const tourism = props.tourism;
  const historic = props.historic;
  const type = props.type;
  const category = props.category;

  const raw =
    (type || amenity || tourism || historic || category || "")
      .toString()
      .toLowerCase()
      .trim();

  // Map common OSM values -> our keys
  if (raw.includes("cafe")) return "cafe";
  if (raw.includes("restaurant") || raw.includes("fast_food")) return "restaurant";

  // worship (mosque / church etc)
  if (
    raw.includes("place_of_worship") ||
    raw.includes("mosque") ||
    raw.includes("worship")
  )
    return "worship";

  if (raw.includes("museum") || raw.includes("gallery")) return "museum";

  if (
    raw.includes("monument") ||
    raw.includes("memorial") ||
    raw.includes("attraction") ||
    raw.includes("historic") ||
    raw.includes("fort") ||
    raw.includes("ruins")
  )
    return "monument";

  if (raw.includes("viewpoint") || raw.includes("information")) return "viewpoint";

  // default: ignore (we only draw 6 categories)
  return null;
}

function featureToPOI(feature) {
  if (!feature || feature.geometry?.type !== "Point") return null;

  const coords = feature.geometry.coordinates;
  const lng = coords?.[0];
  const lat = coords?.[1];
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const props = feature.properties || {};
  const key = normalizePoiKey(props);
  if (!key) return null;

  const name = getPoiName(props);
  const desc = props.short_description || props.description || "";

  // stable id
  const id =
    props.id ||
    props.osm_id ||
    props["@id"] ||
    `${key}_${lat.toFixed(6)}_${lng.toFixed(6)}`;

  return { id, key, lat, lng, name, desc };
}

/* =========================
   POI Global Index (for search/navigation if needed)
   ========================= */
window.poiLayers = window.poiLayers || {};
window.poiIndex = window.poiIndex || {};

/* =========================
   POI Filters Control
   ========================= */

let __poiFiltersControl = null;

function addPOIFiltersControl() {
  if (__poiFiltersControl) return;

  __poiFiltersControl = L.control({ position: "topright" });

  __poiFiltersControl.onAdd = function () {
    const div = L.DomUtil.create("div", "poi-filters leaflet-control");

    div.innerHTML = `
      <div class="poi-filters-title">POI Filters</div>
      <label><input type="checkbox" data-key="cafe" checked> Café</label>
      <label><input type="checkbox" data-key="restaurant" checked> Restaurant</label>
      <label><input type="checkbox" data-key="worship" checked> Mosque / Worship</label>
      <label><input type="checkbox" data-key="museum" checked> Museum</label>
      <label><input type="checkbox" data-key="monument" checked> Monument</label>
      <label><input type="checkbox" data-key="viewpoint" checked> Viewpoint</label>
    `;

    // prevent map drag/zoom when clicking inside the control
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    // events
    div.querySelectorAll("input[type='checkbox']").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const key = e.target.dataset.key;
        const layer = window.poiLayers?.[key];
        if (!layer) return;

        if (e.target.checked) layer.addTo(map);
        else if (map.hasLayer(layer)) map.removeLayer(layer);
      });
    });

    return div;
  };

  __poiFiltersControl.addTo(map);
}

function syncPOIFiltersWithLayers() {
  const controlEl = document.querySelector(".poi-filters");
  if (!controlEl) return;

  controlEl.querySelectorAll("input[type='checkbox']").forEach((cb) => {
    const key = cb.dataset.key;
    const layer = window.poiLayers?.[key];
    if (!layer) return;
    cb.checked = map.hasLayer(layer);
  });
}

/* =========================
   Initialize Map
   ========================= */

function initializeMap() {
  // Map bounds: Morocco region (prevents panning too far away)
  const bounds = L.latLngBounds(
    L.latLng(27.5, -15.0), // Southwest
    L.latLng(40.0, 0.0) // Northeast
  );

  // Disable default zoomControl so it doesn't sit under search
  map = L.map("map", {
    minZoom: 6,
    maxZoom: 19,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0,
    attributionControl: false,
    zoomControl: false,
  }).setView([35.788, -5.809], 16);

  // Put zoom controls bottom-left (clean)
  L.control.zoom({ position: "bottomleft" }).addTo(map);

  // Custom attribution with Morocco flag
  L.control
    .attribution({
      prefix:
        '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flag_of_Morocco.svg/1280px-Flag_of_Morocco.svg.png" style="height: 14px; vertical-align: middle; margin-right: 5px;"> Tanger Medina Mini-Map',
    })
    .addTo(map);

  // Base map layer (Stamen Toner Lite via Stadia)
  const STADIA_API_KEY = "18627d38-4099-488c-981c-41a1c7cf5a98";

  L.tileLayer(
    `https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`,
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a>',
    }
  ).addTo(map);

  // ✅ Add legend + POI filters control immediately (so it never disappears)
  addLegend(map);
  addPOIFiltersControl();

  // Load data
  loadMedinaBoundary();
  loadMedinaStreets();
  loadPOIs();

  return map;
}

/* =========================
   Boundary
   ========================= */

function renderMedinaBoundary(geojsonData) {
  const medinaLayer = L.geoJSON(geojsonData, {
    style: {
      color: "#E63946",
      weight: 3,
      opacity: 0.9,
      fillColor: "#FFEAEA",
      fillOpacity: 0.4,
    },
  }).addTo(map);

  map.fitBounds(medinaLayer.getBounds(), { padding: [50, 50] });

  addMedinaLabels();
}

/* =========================
   Streets
   ========================= */

function renderMedinaStreets(geojsonData) {
  const endpointCount = {};
  const tolerance = 0.00005; // ~5m

  const roundCoord = (coord) =>
    `${Math.round(coord[0] / tolerance) * tolerance},${
      Math.round(coord[1] / tolerance) * tolerance
    }`;

  geojsonData.features.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    const start = roundCoord(coords[0]);
    const end = roundCoord(coords[coords.length - 1]);

    endpointCount[start] = (endpointCount[start] || 0) + 1;
    endpointCount[end] = (endpointCount[end] || 0) + 1;
  });

  L.geoJSON(geojsonData, {
    style: function (feature) {
      const coords = feature.geometry.coordinates;
      const start = roundCoord(coords[0]);
      const end = roundCoord(coords[coords.length - 1]);
      const isDeadEnd = endpointCount[start] === 1 || endpointCount[end] === 1;

      if (isDeadEnd) {
        return {
          color: "#E67E22",
          weight: 3,
          opacity: 0.9,
          dashArray: "5, 5",
        };
      }

      return {
        color: "#2C3E50",
        weight: 3,
        opacity: 0.9,
      };
    },
  }).addTo(map);
}

/* =========================
   POIs (6 categories)
   ========================= */

function renderPOIs(geojsonData) {
  const typeColors = {
    cafe: "#f39c12",
    restaurant: "#e67e22",
    worship: "#9b59b6",
    museum: "#2980b9",
    monument: "#e74c3c",
    viewpoint: "#1abc9c",
    default: "#7f8c8d",
  };

  // Pane above streets
  if (!map.getPane("poisPane")) {
    map.createPane("poisPane");
    map.getPane("poisPane").style.zIndex = 650;
  }

  // Remove old layers if rerender
  if (window.poiLayers && Object.keys(window.poiLayers).length > 0) {
    Object.values(window.poiLayers).forEach((lg) => {
      try {
        if (map.hasLayer(lg)) map.removeLayer(lg);
      } catch (e) {}
    });
  }

  window.poiLayers = {
    cafe: L.layerGroup(),
    restaurant: L.layerGroup(),
    worship: L.layerGroup(),
    museum: L.layerGroup(),
    monument: L.layerGroup(),
    viewpoint: L.layerGroup(),
  };

  window.poiIndex = {};

  const features = Array.isArray(geojsonData?.features) ? geojsonData.features : [];

  for (const feature of features) {
    const poi = featureToPOI(feature);
    if (!poi) continue;

    const color = typeColors[poi.key] || typeColors.default;

    const marker = L.circleMarker([poi.lat, poi.lng], {
      pane: "poisPane",
      radius: 6,
      fillColor: color,
      color: "#fff",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.9,
    });

    const safeName = escapeHtml(poi.name);
    const labelMap = {
      cafe: "Café",
      restaurant: "Restaurant",
      worship: "Mosque / Worship",
      museum: "Museum",
      monument: "Monument",
      viewpoint: "Viewpoint",
    };
    const safeLabel = escapeHtml(labelMap[poi.key] || poi.key);
    const safeDesc = poi.desc ? `<br><small>${escapeHtml(poi.desc)}</small>` : "";

    marker.bindPopup(`<strong>${safeName}</strong><br><em>${safeLabel}</em>${safeDesc}`);

    // index for future highlight/open
    window.poiIndex[poi.id] = marker;

    // add to layer group
    window.poiLayers[poi.key].addLayer(marker);
  }

  // Add all by default
  Object.values(window.poiLayers).forEach((lg) => lg.addTo(map));

  // if control exists, sync checkbox state
  syncPOIFiltersWithLayers();

  console.log("✅ POIs rendered:", features.length);
}

/**
 * Optional: highlight marker + open popup
 */
function highlightPOIById(poiId) {
  const marker = window.poiIndex?.[poiId];
  if (!marker) return false;

  const latlng = marker.getLatLng();
  map.setView(latlng, Math.max(map.getZoom(), 17), { animate: true });
  marker.openPopup();

  try {
    const el = marker.getElement && marker.getElement();
    if (el) {
      el.classList.remove("poi-pulse");
      void el.offsetWidth;
      el.classList.add("poi-pulse");
      setTimeout(() => el.classList.remove("poi-pulse"), 1200);
    }
  } catch (e) {}

  return true;
}

/* =========================
   Labels
   ========================= */

function addMedinaLabels() {
  if (!map.getPane("customLabelsPane")) {
    map.createPane("customLabelsPane");
    map.getPane("customLabelsPane").style.zIndex = 680;
  }

  const places = [
    { name: "OLD MEDINA", lat: 35.786, lng: -5.811, size: "large" },
    { name: "Kasbah", lat: 35.788, lng: -5.808, size: "medium" },
    { name: "Petit Socco", lat: 35.785, lng: -5.812, size: "medium" },
    { name: "Grand Mosque", lat: 35.7865, lng: -5.8095, size: "small" },
    { name: "Bab Fahs", lat: 35.783, lng: -5.81, size: "small" },
    { name: "Dar el Makhzen", lat: 35.789, lng: -5.809, size: "small" },
  ];

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
      icon,
      pane: "customLabelsPane",
      interactive: false,
    }).addTo(map);
  });
}

/* =========================
   Legend
   ========================= */

function addLegend(map) {
  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "map-legend leaflet-control");
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    div.innerHTML = `
      <div class="legend-title">Legend</div>
      <div class="legend-item"><span class="dot" style="background:#f39c12"></span> Café</div>
      <div class="legend-item"><span class="dot" style="background:#e67e22"></span> Restaurant</div>
      <div class="legend-item"><span class="dot" style="background:#9b59b6"></span> Mosque / Worship</div>
      <div class="legend-item"><span class="dot" style="background:#2980b9"></span> Museum</div>
      <div class="legend-item"><span class="dot" style="background:#e74c3c"></span> Monument</div>
      <div class="legend-item"><span class="dot" style="background:#1abc9c"></span> Viewpoint</div>
    `;
    return div;
  };

  legend.addTo(map);
}