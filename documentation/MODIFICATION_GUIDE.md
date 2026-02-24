# Modification & Extension Guide

## How to Extend & Modify Tanger Medina Mini-Map

This guide provides step-by-step instructions for common modifications and how to add new features to the project.

---

## Table of Contents

1. [Adding New Features](#adding-new-features)
2. [Modifying Appearance](#modifying-appearance)
3. [Changing Data](#changing-data)
4. [Advanced Modifications](#advanced-modifications)
5. [Performance Optimization](#performance-optimization)
6. [Testing Your Changes](#testing-your-changes)

---

## Adding New Features

### Feature 1: Add Waypoints (Multiple Stops)

**Goal**: Allow users to set multiple destinations and navigate through each in sequence.

**Step 1**: Create new array in `navigation.js`

```javascript
let waypoints = []; // Add after isNavigating definition

function addWaypoint(lat, lng, name) {
  waypoints.push({ lat, lng, name, visited: false });
  console.log(`Waypoint added: ${name}`);
  updateWaypointUI();
}

function clearWaypoints() {
  waypoints = [];
  updateWaypointUI();
}

function updateWaypointUI() {
  // Display waypoints in a list on UI
  const waypointList = document.getElementById("waypoint-list");
  if (!waypointList) return;

  waypointList.innerHTML = waypoints
    .map((wp, idx) => `<div class="waypoint-item">${idx + 1}. ${wp.name}</div>`)
    .join("");
}
```

**Step 2**: Modify route calculation to include all waypoints

```javascript
function startNavigationWithWaypoints() {
  if (waypoints.length === 0) {
    alert("Add waypoints first");
    return;
  }

  // Build combined route through all waypoints
  let combinedRoute = [];
  let startLoc = getUserLocation();
  let currentLoc = [startLoc.lng, startLoc.lat];

  for (let wp of waypoints) {
    const route = findRoute(currentLoc, [wp.lng, wp.lat]);
    if (route) {
      combinedRoute = combinedRoute.concat(route.path);
      currentLoc = [wp.lng, wp.lat];
    }
  }

  drawRoute(combinedRoute);
  startGPSTracking();
}
```

**Step 3**: Add HTML buttons in `index.html`

```html
<!-- Add to nav-panel -->
<button id="add-waypoint-btn">Add Stop</button>
<div id="waypoint-list" class="waypoint-list"></div>
```

**Step 4**: Add CSS in `style.css`

```css
.waypoint-list {
  background: #f8f4fc;
  border-radius: 4px;
  padding: 8px;
  margin: 10px 0;
  max-height: 120px;
  overflow-y: auto;
}

.waypoint-item {
  padding: 4px 8px;
  font-size: 12px;
  color: #333;
  border-bottom: 1px solid #ddd;
}
```

---

### Feature 2: Add Distance/Time Estimates

**Goal**: Show estimated walking time and total distance before navigation starts.

**Step 1**: Create estimation function in `navigation.js`

```javascript
function estimateNavigationTime(distance) {
  // Average walking speed: 1.4 m/s or 5 km/h
  const walkingSpeed = 1.4; // meters per second

  const timeSeconds = distance / walkingSpeed;
  const minutes = Math.floor(timeSeconds / 60);
  const seconds = Math.floor(timeSeconds % 60);

  if (minutes < 1) {
    return `${seconds} seconds`;
  } else if (minutes < 60) {
    return `${minutes} min ${seconds}s`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}

function displayRouteInfo(route) {
  const panel = document.getElementById("nav-panel");
  const timeEst = estimateNavigationTime(route.distance);

  panel.innerHTML += `
    <div class="route-info">
      <p> Distance: ${formatDistance(route.distance)}</p>
      <p> Estimated Time: ${timeEst}</p>
    </div>
  `;
}
```

**Step 2**: Update navigation.js startNavigation()

```javascript
// After route is found, add:
if (route && route.path && route.path.length > 0) {
  drawRoute(route.path);
  displayRouteInfo(route); // NEW LINE
  startGPSTracking();
  // ... rest of code
}
```

**Step 3**: Add CSS

```css
.route-info {
  background: #f0f8ff;
  border-left: 4px solid #8e44ad;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  font-size: 13px;
}

.route-info p {
  margin: 4px 0;
  color: #333;
}
```

---

### Feature 3: Add Offline Map Caching

**Goal**: Cache map tiles locally for first offline use.

**Step 1**: Create cache utility in new file `js/cache.js`

```javascript
const CACHE_NAME = "tanger-medina-v1";
const URLS_TO_CACHE = [
  "/",
  "index.html",
  "css/style.css",
  "js/app.js",
  "data/medina_streets.geojson",
  "data/pois.geojson",
];

// Register Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then((reg) => {
      console.log("Service Worker registered");
    })
    .catch((err) => {
      console.error("Service Worker registration failed:", err);
    });
}
```

**Step 2**: Create `sw.js` (Service Worker)

```javascript
const CACHE_NAME = "tanger-medina-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "index.html",
        "css/style.css",
        "js/app.js",
        "js/map.js",
        "js/modules/routing.js",
        "data/medina_streets.geojson",
        "data/pois.geojson",
      ]);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        return caches.match("offline.html");
      }),
  );
});
```

**Step 3**: Add to `index.html`

```html
<script src="js/cache.js"></script>
```

---

### Feature 4: Add Favorites/Bookmarks

**Goal**: Save favorite destinations locally.

**Step 1**: Create favorites manager in `js/favorites.js`

```javascript
const FAVORITES_KEY = "tanger_favorites";

function saveFavorite(name, lat, lng) {
  let favorites = getFavorites();

  // Prevent duplicates
  if (favorites.some((f) => f.lat === lat && f.lng === lng)) {
    console.log("Already favorited");
    return;
  }

  favorites.push({ name, lat, lng, savedTime: Date.now() });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  console.log(`Favorite saved: ${name}`);
  updateFavoritesUI();
}

function getFavorites() {
  const data = localStorage.getItem(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
}

function removeFavorite(lat, lng) {
  let favorites = getFavorites();
  favorites = favorites.filter((f) => !(f.lat === lat && f.lng === lng));
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  updateFavoritesUI();
}

function updateFavoritesUI() {
  const favorites = getFavorites();
  const panel = document.getElementById("favorites-panel");
  if (!panel) return;

  panel.innerHTML = favorites
    .map(
      (fav) =>
        `<div class="favorite-item">
       <h4>${fav.name}</h4>
       <button onclick="selectFavoriteDestination(${fav.lat}, ${fav.lng})">
         Navigate
       </button>
       <button onclick="removeFavorite(${fav.lat}, ${fav.lng})">
         Delete
       </button>
     </div>`,
    )
    .join("");
}

function selectFavoriteDestination(lat, lng) {
  addDestinationMarker(lat, lng);
  map.setView([lat, lng], 17);
}
```

**Step 2**: Add button to `index.html`

```html
<button id="favorite-btn" title="Save favorite">
  <i class="fas fa-star"></i>
</button>
```

**Step 3**: Add event listener in `navigation.js`

```javascript
function initNavigation() {
  initSearch();
  initLocation();
  initNavPanel();

  // NEW:
  document.getElementById("favorite-btn")?.addEventListener("click", () => {
    const dest = getDestinationMarker();
    if (dest) {
      const latlng = dest.getLatLng();
      saveFavorite("Saved Location", latlng.lat, latlng.lng);
    }
  });
}
```

---

## Modifying Appearance

### Change Theme Colors

**File**: `css/style.css`

**Current Color Scheme**:

```css
Primary Purple: #8e44ad
Accent Purple: #a855f7
Error Red: #e74c3c
Success Green: #27ae60
Info Blue: #3498db
```

**To Dark Theme**: Replace all colors

```css
/* Replace color variables at top of style.css */
:root {
  --primary: #121212;
  --secondary: #1e1e1e;
  --accent: #bb86fc;
  --text: #ffffff;
  --text-secondary: #bdbdbd;
}

/* Then use --primary, --secondary, etc. throughout */
```

### Customize Marker Icons

**File**: `js/modules/ui.js`

**Current User Marker**:

```javascript
userMarker = L.marker([lat, lng], {
  icon: L.divIcon({
    className: "user-marker",
    html: '<div style="..."></div>',
    iconSize: [20, 20],
  }),
});
```

**Change to Custom SVG**:

```javascript
userMarker = L.marker([lat, lng], {
  icon: L.divIcon({
    className: "user-marker",
    html: `
      <svg width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="10" fill="#3498db" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="15" r="14" fill="none" stroke="#3498db" stroke-width="2" opacity="0.3"/>
      </svg>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  }),
});
```

### Adjust Route Styling

**File**: `js/modules/ui.js`

```javascript
// Current:
const routeLayer = L.polyline(latLngs, {
  color: "#8e44ad",
  weight: 6,
  opacity: 0.8,
});

// More vibrant:
const routeLayer = L.polyline(latLngs, {
  color: "#ff00ff",
  weight: 8,
  opacity: 1,
  dashArray: "none",
  lineCap: "round",
  lineJoin: "round",
});
```

### Change Map Basemap

**File**: `js/map.js` (around line 50)

**Current (Stamen Toner Lite)**:

```javascript
L.tileLayer(`https://tiles.stadiamaps.com/tiles/stamen_toner_lite/...`);
```

**Alternatives**:

OpenStreetMap (free, no key needed):

```javascript
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: " OpenStreetMap contributors",
});
```

Satellite (Stadia):

```javascript
L.tileLayer(
  `https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg?api_key=${STADIA_API_KEY}`,
  {
    maxZoom: 19,
  },
);
```

CartoDB (dark):

```javascript
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: " CartoDB",
});
```

---

## Changing Data

### Add New Street Dataset

**Step 1**: Prepare GeoJSON file (use geojson.io)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-5.81, 35.785],
          [-5.809, 35.784]
        ]
      }
    }
  ]
}
```

**Step 2**: Save as `data/new_streets.geojson`

**Step 3**: Add loader in `data.js`

```javascript
async function loadAlternateStreets() {
  try {
    const response = await fetch("data/new_streets.geojson");
    const geojsonData = await response.json();
    renderMedinaStreets(geojsonData);
    setStreetsData(geojsonData);
  } catch (error) {
    console.error("Error loading alternate streets:", error);
  }
}
```

**Step 4**: Call in map.js

```javascript
// In initializeMap():
loadMedinaStreets();
// loadAlternateStreets();  // Uncomment to switch
```

### Add New Points of Interest

**Step 1**: Edit `data/pois.geojson`

```json
{
  "type": "Feature",
  "properties": {
    "id": 11,
    "name": "New Cafe",
    "type": "cafe",
    "short_description": "Local coffee shop"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-5.812, 35.786]
  }
}
```

**Step 2**: Add color mapping in `map.js`

```javascript
const typeColors = {
  // ... existing ...
  cafe: "#f39c12", // Add if not present
};
```

**Step 3**: Refresh browser to see new POI

### Use Different Boundary

**Step 1**: Create new boundary GeoJSON

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], ...]]
  }
}
```

**Step 2**: Save as `data/medina_boundary.geojson` (or create new file)

**Step 3**: If new file, create loader in `data.js`

```javascript
async function loadAlternateBoundary() {
  const response = await fetch("data/boundary_v2.geojson");
  const geojsonData = await response.json();
  renderMedinaBoundary(geojsonData);
}
```

---

## Advanced Modifications

### Add Real-Time Transit Data

**Goal**: Fetch live data from API (e.g., public transport, traffic)

**Implementation**:

```javascript
// In new file: js/realtime.js

async function fetchRealTimeData() {
  try {
    // Example: replace with actual API
    const response = await fetch("https://api.example.com/traffic");
    const data = await response.json();

    // Update route costs based on real data
    updateRouteCosts(data);
  } catch (error) {
    console.error("Realtime data fetch failed:", error);
  }
}

// Poll every 30 seconds
setInterval(fetchRealTimeData, 30000);
```

### Implement Alternative Pathfinding Algorithms

**Goal**: Replace Dijkstra's with A\* for faster pathfinding

**Key changes in `routing.js`**:

```javascript
function findRouteAStar(startCoord, endCoord) {
  const startNode = findNearestGraphNode(startCoord);
  const endNode = findNearestGraphNode(endCoord);

  const openSet = new Set([startNode]);
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  // Initialize scores
  streetGraph.nodes.forEach((_, key) => {
    gScore.set(key, Infinity);
    fScore.set(key, Infinity);
  });

  gScore.set(startNode, 0);
  fScore.set(startNode, heuristic(startNode, endNode));

  // A* main loop
  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;

    openSet.forEach((node) => {
      if (fScore.get(node) < lowestF) {
        lowestF = fScore.get(node);
        current = node;
      }
    });

    if (current === endNode) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);

    // ... continue with neighbors exploration
  }

  return null;
}

function heuristic(nodeA, nodeB) {
  const coordA = streetGraph.nodes.get(nodeA).coord;
  const coordB = streetGraph.nodes.get(nodeB).coord;
  return calculateCoordDistance(coordA, coordB);
}
```

### Add Custom Analysis Tools

**Goal**: Create tools to analyze the street network

**Example - Graph Statistics**:

```javascript
// Add to routing.js

function analyzeGraph() {
  const stats = {
    totalNodes: streetGraph.nodes.size,
    edgesTotal: 0,
    isolatedNodes: 0,
    deadEnds: 0,
    hubs: [],
    avgDegree: 0,
  };

  streetGraph.nodes.forEach((node, key) => {
    // Count edges
    stats.edgesTotal += node.edges.length;

    // Find isolated nodes (no connections)
    if (node.edges.length === 0) {
      stats.isolatedNodes++;
    }

    // Find dead-ends (1 connection)
    else if (node.edges.length === 1) {
      stats.deadEnds++;
    }

    // Find hubs (3+ connections)
    else if (node.edges.length >= 3) {
      stats.hubs.push({
        key,
        coord: node.coord,
        degree: node.edges.length,
      });
    }
  });

  stats.avgDegree = stats.edgesTotal / 2 / stats.totalNodes;

  return stats;
}

// Usage:
console.log("Graph Analysis:", analyzeGraph());
```

---

## Performance Optimization

### Reduce Graph Complexity

**File**: `js/modules/routing.js`

**Problem**: Large medinas with thousands of streets slow down pathfinding

**Solutions**:

1. **Increase tolerances**:

```javascript
const CONNECT_TOLERANCE = 0.0003; // 30m instead of 15m
const AUTO_CONNECT_DIST = 0.0004; // 40m instead of 20m
```

2. **Simplify street coordinates** (remove intermediate points):

```javascript
function simplifyStreets(geojsonData, tolerance) {
  return {
    ...geojsonData,
    features: geojsonData.features.map((feature) => ({
      ...feature,
      geometry: {
        type: "LineString",
        coordinates: simplify(feature.geometry.coordinates, tolerance),
      },
    })),
  };
}

function simplify(coords, tolerance) {
  // Ramer-Douglas-Peucker algorithm
  // ... implementation ...
}
```

### Cache Pathfinding Results

**File**: `js/modules/routing.js`

```javascript
const routeCache = new Map();

function findRouteCached(startCoord, endCoord) {
  const cacheKey = `${startCoord[0]},${startCoord[1]}${endCoord[0]},${endCoord[1]}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  const route = findRoute(startCoord, endCoord);

  if (route) {
    routeCache.set(cacheKey, route);

    // Limit cache size
    if (routeCache.size > 100) {
      const firstKey = routeCache.keys().next().value;
      routeCache.delete(firstKey);
    }
  }

  return route;
}
```

### Lazy Load POI Search

**File**: `js/modules/search.js`

```javascript
// Only build search index when needed
let searchIndex = null;

function getSearchIndex() {
  if (!searchIndex) {
    // Build index on first search
    searchIndex = poisData.map((poi) => ({
      id: poi.properties.id,
      searchText: (
        poi.properties.name +
        " " +
        poi.properties.type +
        " " +
        poi.properties.short_description
      ).toLowerCase(),
      poi: poi,
    }));
  }
  return searchIndex;
}

function filterPOIs(query) {
  const index = getSearchIndex();
  return index
    .filter((item) => item.searchText.includes(query.toLowerCase()))
    .map((item) => item.poi);
}
```

---

## Testing Your Changes

### Browser Console Testing

**Before deploying changes:**

```javascript
// Test routing
const route = findRoute([-5.811693, 35.786074], [-5.812, 35.787]);
console.log("Route found:", route);

// Test UI elements
addDestinationMarker(35.786, -5.811);
drawRoute(route.path);

// Test search
const results = filterPOIs("bab");
console.log("Search results:", results);

// Test GPS
console.log("Current location:", getUserLocation());

// Check graph
console.log("Graph stats:", analyzeGraph());
```

### Performance Profiling

```javascript
// Measure route calculation time
console.time("Route calculation");
const route = findRoute([-5.811, 35.786], [-5.812, 35.787]);
console.timeEnd("Route calculation");

// Measure search time
console.time("Search POIs");
const results = filterPOIs("bab");
console.timeEnd("Search POIs");

// Check memory usage
console.log("Graph memory:", JSON.stringify(streetGraph).length, "bytes");
```

### Testing Checklist

- [ ] Map loads without errors
- [ ] GPS location works
- [ ] Search returns results
- [ ] Routes calculate correctly
- [ ] Navigation follows streets
- [ ] Arrival detection works
- [ ] Mobile responsiveness OK
- [ ] No console errors
- [ ] Performance acceptable (< 1s route time)

---

## Common Pitfalls to Avoid

 **DON'T**:

- Modify GeoJSON files without backup
- Change coordinate order (must be [lng, lat])
- Add thousands of POIs without filtering
- Use coordinates from Google Maps directly (wrong order)
- Forget to validate JSON after edits

 **DO**:

- Always backup data before modifying
- Test changes in console first
- Use geojson.io for validation
- Profile performance after changes
- Document your modifications
- Test on mobile devices

---

## Need Help?

1. Check browser console (F12) for error messages
2. Review DOCUMENTATION.md for module details
3. Look at existing functions as examples
4. Test small changes before major modifications
5. Use browser DevTools to debug JavaScript

