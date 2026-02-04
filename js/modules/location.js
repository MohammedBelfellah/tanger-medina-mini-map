/**
 * Location Module
 * Handles GPS and user location
 * Author: Mohammed Belfellah
 */

let userLocation = null;
let userMarker = null;
let watchId = null;

// Set to false for production (real GPS)
const TEST_MODE = true;
const TEST_LOCATION = { lat: 35.786074393894, lng: -5.811693364685466 };

/**
 * Initialize location button
 */
function initLocation() {
  const locateBtn = document.getElementById("locate-btn");
  locateBtn.addEventListener("click", locateUser);
}

/**
 * Get current user location
 */
function getUserLocation() {
  return userLocation;
}

/**
 * Locate user using GPS
 */
function locateUser() {
  const locateBtn = document.getElementById("locate-btn");
  locateBtn.classList.add("locating");

  if (TEST_MODE) {
    updateUserPosition(TEST_LOCATION.lat, TEST_LOCATION.lng, true);
    locateBtn.classList.remove("locating");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    locateBtn.classList.remove("locating");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      updateUserPosition(
        position.coords.latitude,
        position.coords.longitude,
        false,
      );
      locateBtn.classList.remove("locating");
    },
    (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to get your location. Please enable GPS.");
      locateBtn.classList.remove("locating");
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

/**
 * Update user position on map
 */
function updateUserPosition(lat, lng, isTest) {
  userLocation = { lat, lng };

  if (userMarker) {
    map.removeLayer(userMarker);
  }

  userMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: "user-marker",
      html: '<div style="width: 20px; height: 20px; background: #3498db; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    }),
  })
    .addTo(map)
    .bindPopup(isTest ? "You are here! (Test location)" : "You are here!")
    .openPopup();

  // Notify navigation module
  if (typeof onUserPositionUpdate === "function") {
    onUserPositionUpdate(lat, lng);
  }
}

/**
 * Start GPS tracking
 */
function startGPSTracking() {
  if (TEST_MODE) {
    console.log("TEST MODE: GPS tracking simulated");
    return;
  }

  if (!navigator.geolocation) {
    console.error("Geolocation not supported");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      updateUserPosition(
        position.coords.latitude,
        position.coords.longitude,
        false,
      );
    },
    (error) => {
      console.error("GPS tracking error:", error);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
  );
}

/**
 * Stop GPS tracking
 */
function stopGPSTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

/**
 * Calculate distance between two points (Haversine)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
