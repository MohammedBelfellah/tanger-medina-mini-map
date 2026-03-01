/**
 * Navigation Controller
 * Coordinates navigation features (Search + Location + UI + Routing)
 */

let isNavigating = false;
let currentDestination = null;

// Reroute throttling (avoid heavy recomputation)
let lastRerouteAt = 0;
const REROUTE_COOLDOWN_MS = 1500; // reroute max once every 1.5s

/**
 * Initialize all navigation features
 * (search/location/ui are in modules)
 */
function initNavigation() {
  // Defensive: modules may load in different order
  if (typeof initSearch === "function") initSearch();
  if (typeof initLocation === "function") initLocation();
  initNavPanel();
}

/**
 * Initialize navigation panel buttons
 */
function initNavPanel() {
  const closeNav = document.getElementById("close-nav");
  const startNav = document.getElementById("start-nav");
  const cancelNav = document.getElementById("cancel-nav");

  if (closeNav) closeNav.addEventListener("click", closeNavPanel);
  if (cancelNav) cancelNav.addEventListener("click", cancelNavigation);
  if (startNav) startNav.addEventListener("click", startNavigation);
}

/**
 * Called by search module when user selects a destination
 */
function selectDestination(item) {
  const lat = parseFloat(item.dataset.lat);
  const lng = parseFloat(item.dataset.lng);
  const name = item.dataset.name;

  document.getElementById("search-input").value = name;
  document.getElementById("search-results").classList.add("hidden");

  if (typeof addDestinationMarker === "function") addDestinationMarker(lat, lng);

  // ✅ New: open & pulse the POI marker if it exists
  const id = item.dataset.id;
  if (id && typeof highlightPOIById === "function") highlightPOIById(id);
  else map.setView([lat, lng], 17);

  showNavPanel(name, lat, lng);
}

/**
 * Show navigation panel and distance
 */
function showNavPanel(name, lat, lng) {
  const navPanel = document.getElementById("nav-panel");
  if (!navPanel) return;

  const nameEl = document.getElementById("nav-destination-name");
  if (nameEl) nameEl.textContent = name;

  const distanceEl = document.getElementById("nav-distance-value");
  const userLoc = typeof getUserLocation === "function" ? getUserLocation() : null;

  if (distanceEl) {
    if (userLoc && Number.isFinite(userLoc.lat) && Number.isFinite(userLoc.lng)) {
      const distance =
        typeof calculateDistance === "function"
          ? calculateDistance(userLoc.lat, userLoc.lng, lat, lng)
          : null;

      distanceEl.textContent =
        distance != null && typeof formatDistance === "function"
          ? formatDistance(distance)
          : "--";
    } else {
      distanceEl.textContent = "Locate yourself first";
    }
  }

  navPanel.dataset.lat = String(lat);
  navPanel.dataset.lng = String(lng);
  navPanel.classList.remove("hidden");
}

function closeNavPanel() {
  const navPanel = document.getElementById("nav-panel");
  if (navPanel) navPanel.classList.add("hidden");
}

/**
 * Start navigation: find route + draw
 */
function startNavigation() {
  const navPanel = document.getElementById("nav-panel");
  if (!navPanel) return;

  const destLat = Number(navPanel.dataset.lat);
  const destLng = Number(navPanel.dataset.lng);

  if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
    alert("Destination invalid. Please select again.");
    return;
  }

  const userLoc = typeof getUserLocation === "function" ? getUserLocation() : null;

  if (!userLoc) {
    alert("Please enable location to start navigation.");
    if (typeof locateUser === "function") locateUser();
    return;
  }

  if (!Number.isFinite(userLoc.lat) || !Number.isFinite(userLoc.lng)) {
    alert("Location invalid. Try locating again.");
    if (typeof locateUser === "function") locateUser();
    return;
  }

  // Routing module must exist
  if (typeof findRoute !== "function") {
    alert("Routing module not ready (findRoute missing).");
    resetStartButton();
    return;
  }

  currentDestination = { lat: destLat, lng: destLng };
  isNavigating = true;

  const route = findRoute([userLoc.lng, userLoc.lat], [destLng, destLat]);

  if (route && Array.isArray(route.path) && route.path.length >= 2) {
    // Draw route using UI module
    if (typeof drawRoute === "function") drawRoute(route.path);

    // Start tracking if available
    if (typeof startGPSTracking === "function") startGPSTracking();

    const startBtn = document.getElementById("start-nav");
    if (startBtn) {
      startBtn.innerHTML = '<i class="fas fa-walking"></i> Navigating...';
      startBtn.style.background = "#8e44ad";
    }

    const distanceEl = document.getElementById("nav-distance-value");
    if (distanceEl && typeof formatDistance === "function") {
      distanceEl.textContent = formatDistance(route.distance);
    }
  } else {
    isNavigating = false;
    currentDestination = null;
    alert("Could not find a route. Try a destination closer to the streets.");
    resetStartButton();
  }
}

/**
 * Cancel navigation
 */
function cancelNavigation() {
  if (typeof stopGPSTracking === "function") stopGPSTracking();

  isNavigating = false;
  currentDestination = null;

  if (typeof clearRoute === "function") clearRoute();
  if (typeof clearDestinationMarker === "function") clearDestinationMarker();

  closeNavPanel();
  resetStartButton();
}

/**
 * Called when user position updates (location.js should call this)
 */
function onUserPositionUpdate(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  // If not navigating, just follow the user (but not too aggressive)
  if (!isNavigating) {
    if (typeof map !== "undefined" && map) {
      map.setView([lat, lng], Math.max(map.getZoom?.() || 17, 17));
    }
    return;
  }

  if (!currentDestination) return;

  // Update distance
  const distance =
    typeof calculateDistance === "function"
      ? calculateDistance(lat, lng, currentDestination.lat, currentDestination.lng)
      : null;

  const distanceEl = document.getElementById("nav-distance-value");
  if (distanceEl && distance != null && typeof formatDistance === "function") {
    distanceEl.textContent = formatDistance(distance);
  }

  // Arrival threshold
  if (distance != null && distance < 10) {
    arrivedAtDestination();
    return;
  }

  // Reroute with cooldown
  const now = Date.now();
  if (now - lastRerouteAt >= REROUTE_COOLDOWN_MS) {
    lastRerouteAt = now;
    updateRoute(lat, lng);
  }
}

/**
 * Update route (reroute)
 */
function updateRoute(lat, lng) {
  if (!currentDestination) return;
  if (typeof findRoute !== "function") return;

  const route = findRoute([lng, lat], [currentDestination.lng, currentDestination.lat]);

  if (route && Array.isArray(route.path) && route.path.length >= 2) {
    if (typeof drawRoute === "function") drawRoute(route.path);

    const distanceEl = document.getElementById("nav-distance-value");
    if (distanceEl && typeof formatDistance === "function") {
      distanceEl.textContent = formatDistance(route.distance);
    }
  }
}

/**
 * Arrived handler
 */
function arrivedAtDestination() {
  isNavigating = false;

  if (typeof stopGPSTracking === "function") stopGPSTracking();

  const startBtn = document.getElementById("start-nav");
  if (startBtn) {
    startBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> You have arrived!';
    startBtn.style.background = "#27ae60";
  }

  if (typeof showArrivalPopup === "function") showArrivalPopup();
  console.log("Arrived at destination!");
}

/* =========================
   Helpers / Getters
   ========================= */

function resetStartButton() {
  const startBtn = document.getElementById("start-nav");
  if (!startBtn) return;

  startBtn.innerHTML = '<i class="fas fa-play"></i> Start Navigation';
  startBtn.style.background = "#8e44ad";
}

function getIsNavigating() {
  return isNavigating;
}

function getCurrentDestination() {
  return currentDestination;
}