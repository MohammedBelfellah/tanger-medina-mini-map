let userLocation = null;
let userMarker = null;
let watchId = null;

// Set to true for testing (fake GPS)
const TEST_MODE = false;
const TEST_LOCATION = { lat: 35.786074393894, lng: -5.811693364685466 };

// Smooth follow when not navigating
let lastCenterAt = 0;
const CENTER_COOLDOWN_MS = 1200;

/**
 * Initialize location button
 */
function initLocation() {
  const locateBtn = document.getElementById("locate-btn");
  if (!locateBtn) return;
  locateBtn.addEventListener("click", locateUser);
}

/**
 * Get current user location
 */
function getUserLocation() {
  return userLocation;
}

/**
 * Locate user using GPS (must be triggered by user click on iOS)
 */
function locateUser() {
  const locateBtn = document.getElementById("locate-btn");
  if (locateBtn) locateBtn.classList.add("locating");

  if (TEST_MODE) {
    updateUserPosition(TEST_LOCATION.lat, TEST_LOCATION.lng, true);
    startGPSTracking();
    if (locateBtn) locateBtn.classList.remove("locating");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    if (locateBtn) locateBtn.classList.remove("locating");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      updateUserPosition(position.coords.latitude, position.coords.longitude, false);
      startGPSTracking();
      if (locateBtn) locateBtn.classList.remove("locating");
    },
    (error) => {
      console.error("Geolocation error:", error);

      // Better messages (mobile-friendly)
      let msg = "Unable to get your location. Please enable GPS.";
      if (error && error.code === 1) msg = "Permission denied. Please allow location access.";
      if (error && error.code === 2) msg = "Position unavailable. Try moving outside / enable GPS.";
      if (error && error.code === 3) msg = "Location request timed out. Try again.";

      alert(msg);
      if (locateBtn) locateBtn.classList.remove("locating");
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 2000,
    }
  );
}

/**
 * Update user position on map
 */
function updateUserPosition(lat, lng, isTest) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  userLocation = { lat, lng };

  // Create marker once, then move it (better performance)
  if (!userMarker) {
    userMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "user-marker",
        html:
          '<div style="width: 18px; height: 18px; background: #3498db; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
      interactive: false,
    }).addTo(map);

    userMarker.bindPopup(isTest ? "You are here! (Test location)" : "You are here!");
  } else {
    userMarker.setLatLng([lat, lng]);
  }

  // Notify navigation module
  if (typeof onUserPositionUpdate === "function") {
    onUserPositionUpdate(lat, lng);
  } else {
    // If navigation not loaded yet, just center lightly
    const now = Date.now();
    if (map && now - lastCenterAt > CENTER_COOLDOWN_MS) {
      lastCenterAt = now;
      map.setView([lat, lng], Math.max(map.getZoom?.() || 17, 17));
    }
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

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      updateUserPosition(position.coords.latitude, position.coords.longitude, false);
    },
    (error) => {
      console.error("GPS tracking error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 1000,
    }
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
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
function formatDistance(meters) {
  if (!Number.isFinite(meters)) return "--";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}