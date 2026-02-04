/**
 * Navigation Controller
 * Main module that coordinates all navigation features
 * Author: Mohammed Belfellah
 */

let isNavigating = false;
let currentDestination = null;

/**
 * Initialize all navigation features
 */
function initNavigation() {
  initSearch();
  initLocation();
  initNavPanel();
}

/**
 * Initialize navigation panel
 */
function initNavPanel() {
  const closeNav = document.getElementById("close-nav");
  const startNav = document.getElementById("start-nav");
  const cancelNav = document.getElementById("cancel-nav");

  closeNav.addEventListener("click", closeNavPanel);
  cancelNav.addEventListener("click", cancelNavigation);
  startNav.addEventListener("click", startNavigation);
}

/**
 * Select destination from search result
 */
function selectDestination(item) {
  const lat = parseFloat(item.dataset.lat);
  const lng = parseFloat(item.dataset.lng);
  const name = item.dataset.name;

  document.getElementById("search-input").value = name;
  document.getElementById("search-results").classList.add("hidden");

  addDestinationMarker(lat, lng);
  map.setView([lat, lng], 17);
  showNavPanel(name, lat, lng);
}

/**
 * Show navigation panel
 */
function showNavPanel(name, lat, lng) {
  const navPanel = document.getElementById("nav-panel");
  document.getElementById("nav-destination-name").textContent = name;

  const userLoc = getUserLocation();
  if (userLoc) {
    const distance = calculateDistance(userLoc.lat, userLoc.lng, lat, lng);
    document.getElementById("nav-distance-value").textContent =
      formatDistance(distance);
  } else {
    document.getElementById("nav-distance-value").textContent =
      "Locate yourself first";
  }

  navPanel.classList.remove("hidden");
  navPanel.dataset.lat = lat;
  navPanel.dataset.lng = lng;
}

/**
 * Close navigation panel
 */
function closeNavPanel() {
  document.getElementById("nav-panel").classList.add("hidden");
}

/**
 * Start navigation
 */
function startNavigation() {
  const navPanel = document.getElementById("nav-panel");
  const destLat = parseFloat(navPanel.dataset.lat);
  const destLng = parseFloat(navPanel.dataset.lng);

  const userLoc = getUserLocation();
  if (!userLoc) {
    alert("Please enable location to start navigation.");
    locateUser();
    return;
  }

  currentDestination = { lat: destLat, lng: destLng };
  isNavigating = true;

  const route = findRoute([userLoc.lng, userLoc.lat], [destLng, destLat]);

  if (route && route.path && route.path.length > 0) {
    drawRoute(route.path);
    startGPSTracking();

    document.getElementById("start-nav").innerHTML =
      '<i class="fas fa-walking"></i> Navigating...';
    document.getElementById("nav-distance-value").textContent = formatDistance(
      route.distance,
    );
  } else {
    isNavigating = false;
    currentDestination = null;
    alert("Could not find a route. Try a destination closer to the streets.");
    document.getElementById("start-nav").innerHTML =
      '<i class="fas fa-play"></i> Start Navigation';
  }
}

/**
 * Cancel navigation
 */
function cancelNavigation() {
  stopGPSTracking();
  isNavigating = false;
  currentDestination = null;

  clearRoute();
  clearDestinationMarker();
  closeNavPanel();

  document.getElementById("start-nav").innerHTML =
    '<i class="fas fa-play"></i> Start Navigation';
  document.getElementById("start-nav").style.background = "#8e44ad";
}

/**
 * Called when user position updates (from location module)
 */
function onUserPositionUpdate(lat, lng) {
  if (!isNavigating) {
    map.setView([lat, lng], 17);
    return;
  }

  if (!currentDestination) return;

  // Update distance
  const distance = calculateDistance(
    lat,
    lng,
    currentDestination.lat,
    currentDestination.lng,
  );
  document.getElementById("nav-distance-value").textContent =
    formatDistance(distance);

  // Check if arrived (within 15 meters)
  if (distance < 15) {
    arrivedAtDestination();
    return;
  }

  // Update route
  updateRoute(lat, lng);
}

/**
 * Update route from current position
 */
function updateRoute(lat, lng) {
  if (!currentDestination) return;

  clearRoute();

  const route = findRoute(
    [lng, lat],
    [currentDestination.lng, currentDestination.lat],
  );

  if (route && route.path) {
    const latLngs = route.path.map((coord) => [coord[1], coord[0]]);
    L.polyline(latLngs, {
      color: "#8e44ad",
      weight: 5,
      opacity: 0.8,
    }).addTo(map);

    document.getElementById("nav-distance-value").textContent = formatDistance(
      route.distance,
    );
  }
}

/**
 * Called when user arrives at destination
 */
function arrivedAtDestination() {
  isNavigating = false;
  stopGPSTracking();

  const startBtn = document.getElementById("start-nav");
  startBtn.innerHTML =
    '<i class="fas fa-flag-checkered"></i> You have arrived!';
  startBtn.style.background = "#27ae60";

  showArrivalPopup();
  console.log("Arrived at destination!");
}

/**
 * Check if currently navigating
 */
function getIsNavigating() {
  return isNavigating;
}

/**
 * Get current destination
 */
function getCurrentDestination() {
  return currentDestination;
}
