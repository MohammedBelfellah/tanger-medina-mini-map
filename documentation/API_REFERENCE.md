# API Reference - Complete Function Documentation

This document provides detailed function signatures, parameters, and usage examples for all public APIs in Tanger Medina Mini-Map.

---

## Table of Contents

- [map.js - Map Initialization](#mapjs)
- [data.js - Data Loading](#datajs)
- [routing.js - Pathfinding](#routingjs)
- [location.js - Position & GPS](#locationjs)
- [search.js - POI Search](#searchjs)
- [ui.js - Visual Elements](#uijs)
- [navigation.js - Main Controller](#navigationjs)
- [gps-simulator.js - Testing Tools](#gps-simulatorjs)

---

## map.js

### initializeMap()

**Description**: Initialize Leaflet map with all base layers and bounds

**Signature**:

```javascript
function initializeMap()
```

**Parameters**: None

**Returns**: `undefined` (Creates global `map` variable)

**Usage**:

```javascript
initializeMap();
console.log(map.getZoom()); // Access map instance
```

**Side Effects**:

- Creates global `map` variable (Leaflet instance)
- Loads tile layer from Stadia Maps
- Calls `loadMedinaBoundary()`, `loadMedinaStreets()`, `loadPOIs()`

---

### renderMedinaBoundary(geojsonData)

**Description**: Render the Old Medina boundary polygon on the map

**Signature**:

```javascript
function renderMedinaBoundary(geojsonData)
```

**Parameters**:

- `geojsonData` {Object} - GeoJSON FeatureCollection with Polygon geometry

**Returns**: `undefined` (Modifies map)

**GeoJSON Structure**:

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [-5.807, 35.788],
        [-5.809, 35.789],
        ...
        [-5.807, 35.788]
      ]]
    }
  }]
}
```

**Example**:

```javascript
const boundary = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-5.807, 35.788],
            [-5.809, 35.789],
            [-5.807, 35.788],
          ],
        ],
      },
    },
  ],
};
renderMedinaBoundary(boundary);
```

**Visual Properties**:

- Border: Red (#E63946), 3px solid
- Fill: Light pink (#FFEAEA), 40% opacity

---

### renderMedinaStreets(geojsonData)

**Description**: Render street network, with dead-ends highlighted in orange

**Signature**:

```javascript
function renderMedinaStreets(geojsonData)
```

**Parameters**:

- `geojsonData` {Object} - GeoJSON FeatureCollection with LineString features

**Returns**: `undefined`

**Street Classification**:

- **Dead-end streets**: Orange (#E67E22) with dashed style (5px, 5px pattern)
- **Connected streets**: Dark blue-gray (#2C3E50), solid 3px

**Logic**:

1. Counts connections at each endpoint (5m tolerance)
2. If endpoint connects to only 1 street  dead-end
3. Otherwise  connected street

**Example**:

```javascript
const streets = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates": [[-5.811, 35.786], [-5.810, 35.785], [-5.809, 35.784]]
    }
  }]
};
renderMedinaStreets(streets);
```

---

### renderPOIs(geojsonData)

**Description**: Add POI markers to map with type-based coloring

**Signature**:

```javascript
function renderPOIs(geojsonData)
```

**Parameters**:

- `geojsonData` {Object} - GeoJSON FeatureCollection with Point features

**Returns**: `undefined`

**POI Type Colors**:

```javascript
{
  square: "#3498db",      // Blue
  culture: "#9b59b6",     // Purple
  museum: "#e67e22",      // Orange
  street: "#27ae60",      // Green
  monument: "#e74c3c",    // Red
  viewpoint: "#1abc9c",   // Teal
  cafe: "#f39c12",        // Yellow
  gate: "#8e44ad"         // Dark purple (gates/Babs)
}
```

**Required Properties** (in `feature.properties`):

- `name` {String} - Display name
- `type` {String} - Category (must match typeColors keys)
- `short_description` {String} - Popup text

**Example**:

```javascript
const pois = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Bab Kasbah",
        type: "gate",
        short_description: "Main gate to Kasbah",
      },
      geometry: {
        type: "Point",
        coordinates: [-5.8149, 35.7887],
      },
    },
  ],
};
renderPOIs(pois);
```

---

### addMedinaLabels()

**Description**: Add static text labels for major landmarks

**Signature**:

```javascript
function addMedinaLabels()
```

**Parameters**: None

**Returns**: `undefined`

**Pre-configured Labels**:

- "OLD MEDINA" (large, center)
- "Kasbah" (medium)
- "Petit Socco" (medium)
- "Grand Mosque", "Bab Fahs", "Dar el Makhzen" (small)

**Example**:

```javascript
addMedinaLabels();
// Labels now visible on map
```

---

## data.js

### loadMedinaBoundary()

**Description**: Asynchronously fetch and render medina boundary

**Signature**:

```javascript
async function loadMedinaBoundary()
```

**Parameters**: None

**Returns**: `Promise<void>`

**File Path**: `data/medina_boundary.geojson`

**Example**:

```javascript
await loadMedinaBoundary();
// Boundary now visible on map
```

**Error Handling**: Errors logged to console, app continues

---

### loadMedinaStreets()

**Description**: Asynchronously fetch and render street network

**Signature**:

```javascript
async function loadMedinaStreets()
```

**Parameters**: None

**Returns**: `Promise<void>`

**Side Effects**:

- Renders streets on map
- Passes data to `setStreetsData()` for routing

**File Path**: `data/medina_streets.geojson`

**Example**:

```javascript
await loadMedinaStreets();
console.log("Streets loaded and graph built");
```

---

### loadPOIs()

**Description**: Asynchronously fetch and render points of interest

**Signature**:

```javascript
async function loadPOIs()
```

**Parameters**: None

**Returns**: `Promise<void>`

**Side Effects**:

- Renders POI markers on map
- Passes data to `setPOIsData()` for search

**File Path**: `data/pois.geojson`

**Example**:

```javascript
await loadPOIs();
// POIs now searchable
```

---

## routing.js

### setStreetsData(data)

**Description**: Initialize routing module with street network

**Signature**:

```javascript
function setStreetsData(data)
```

**Parameters**:

- `data` {Object} - GeoJSON FeatureCollection with LineString features

**Returns**: `undefined`

**Side Effects**:

- Stores streets data globally
- Calls `buildStreetGraph()`

**Example**:

```javascript
const streets = await (await fetch("data/medina_streets.geojson")).json();
setStreetsData(streets);
console.log("Graph ready for routing");
```

---

### buildStreetGraph()

**Description**: Build internal graph structure from streets

**Signature**:

```javascript
function buildStreetGraph()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Creates/updates global `streetGraph` object
- Logs graph statistics to console

**Algorithm Steps**:

1. Extract all street endpoints as nodes
2. Merge nearby nodes (within CONNECT_TOLERANCE)
3. Create bidirectional edges between connected endpoints
4. Auto-connect nodes within AUTO_CONNECT_DIST
5. Log final node/edge count

**Tolerances**:

```javascript
CONNECT_TOLERANCE = 0.00015; // ~15 meters
AUTO_CONNECT_DIST = 0.0002; // ~20 meters
```

**Example**:

```javascript
setStreetsData(geojsonData);
buildStreetGraph();
console.log(`${streetGraph.nodes.size} nodes created`);
```

---

### findRoute(startCoord, endCoord)

**Description**: Find optimal walking route using Dijkstra's algorithm

**Signature**:

```javascript
function findRoute(startCoord, endCoord)
```

**Parameters**:

- `startCoord` {Array} - [longitude, latitude] start position
- `endCoord` {Array} - [longitude, latitude] end position

**Returns**: {Object} | null

```javascript
{
  path: Array<[lng, lat]>,  // Route waypoints
  distance: Number          // Total distance in meters
}
```

**Returns null if**:

- Graph not initialized
- Start or end node not found
- No path exists

**Algorithm**: Dijkstra's shortest path

**Example**:

```javascript
const route = findRoute(
  [-5.811693, 35.786074], // Start (Medina center)
  [-5.8138, 35.7895], // End (Kasbah area)
);

if (route) {
  console.log(`Found route: ${route.distance}m`);
  console.log(`Waypoints: ${route.path.length}`);
} else {
  console.log("No route found");
}
```

---

### findNearestGraphNode(coord)

**Description**: Find closest street network node to coordinate

**Signature**:

```javascript
function findNearestGraphNode(coord)
```

**Parameters**:

- `coord` {Array} - [longitude, latitude]

**Returns**: {String} | null - Node key or null if no nodes exist

**Example**:

```javascript
const nodeKey = findNearestGraphNode([-5.811693, 35.786074]);
if (nodeKey) {
  const node = streetGraph.nodes.get(nodeKey);
  console.log("Nearest node:", node.coord);
}
```

---

### calculateCoordDistance(coord1, coord2)

**Description**: Calculate great-circle distance between two points

**Signature**:

```javascript
function calculateCoordDistance(coord1, coord2)
```

**Parameters**:

- `coord1` {Array} - [longitude, latitude]
- `coord2` {Array} - [longitude, latitude]

**Returns**: {Number} - Distance in meters

**Algorithm**: Haversine formula

**Example**:

```javascript
const dist = calculateCoordDistance(
  [-5.811693, 35.786074],
  [-5.812693, 35.787074],
);
console.log(`Distance: ${dist}m`); // ~150m
```

---

## location.js

### initLocation()

**Description**: Initialize location button and event listeners

**Signature**:

```javascript
function initLocation()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Adds click listener to locate button (#locate-btn)
- Calls `locateUser()` on button click

**Example**:

```javascript
initLocation();
// Now clicking locate button will request GPS
```

---

### getUserLocation()

**Description**: Get current user location

**Signature**:

```javascript
function getUserLocation()
```

**Parameters**: None

**Returns**: {Object} | null

```javascript
{
  lat: Number,    // Latitude
  lng: Number     // Longitude
}
```

**Example**:

```javascript
const location = getUserLocation();
if (location) {
  console.log(`You are at ${location.lat}, ${location.lng}`);
} else {
  console.log("Location not set yet");
}
```

---

### locateUser()

**Description**: Request and activate GPS location

**Signature**:

```javascript
function locateUser()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Shows "locating..." animation on button
- Requests browser geolocation permission
- Calls `updateUserPosition()` on success
- Starts GPS tracking with `startGPSTracking()`

**Modes**:

- **TEST_MODE = true**: Uses hard-coded test location
- **TEST_MODE = false**: Uses actual GPS

**Example**:

```javascript
locateUser();
// Marker appears after permission granted
```

---

### updateUserPosition(lat, lng, isTest)

**Description**: Update user marker and position tracker

**Signature**:

```javascript
function updateUserPosition(lat, lng, isTest)
```

**Parameters**:

- `lat` {Number} - Latitude
- `lng` {Number} - Longitude
- `isTest` {Boolean} - Whether this is test/simulated position

**Returns**: `undefined`

**Side Effects**:

- Updates global `userLocation`
- Removes old marker if exists
- Creates new blue marker on map
- Shows popup "You are here!"
- Calls `onUserPositionUpdate()` callback

**Example**:

```javascript
updateUserPosition(35.786074, -5.811693, false);
// Blue marker appears on map
```

---

### startGPSTracking()

**Description**: Continuously monitor GPS position

**Signature**:

```javascript
function startGPSTracking()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Sets up watchPosition listener
- Calls `updateUserPosition()` on each position change
- Updates running every 1000ms by default

**Configuration**:

```javascript
enableHighAccuracy: true,    // Request high accuracy
timeout: 10000,              // 10 second timeout
maximumAge: 1000             // Cache position for 1s
```

**Example**:

```javascript
startGPSTracking();
// Position updates automatically
```

---

### stopGPSTracking()

**Description**: Stop continuous GPS monitoring

**Signature**:

```javascript
function stopGPSTracking()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Clears watchPosition listener
- Sets global `watchId` to null

**Example**:

```javascript
stopGPSTracking();
// GPS updates stop
```

---

### calculateDistance(lat1, lng1, lat2, lng2)

**Description**: Calculate distance between two lat/lng coordinates

**Signature**:

```javascript
function calculateDistance(lat1, lng1, lat2, lng2)
```

**Parameters**:

- `lat1` {Number} - Start latitude
- `lng1` {Number} - Start longitude
- `lat2` {Number} - End latitude
- `lng2` {Number} - End longitude

**Returns**: {Number} - Distance in meters

**Algorithm**: Haversine formula

**Example**:

```javascript
const dist = calculateDistance(35.786074, -5.811693, 35.787074, -5.810693);
console.log(`Distance: ${dist}m`);
```

---

### formatDistance(meters)

**Description**: Format meters as human-readable distance string

**Signature**:

```javascript
function formatDistance(meters)
```

**Parameters**:

- `meters` {Number} - Distance in meters

**Returns**: {String} - Formatted distance

**Format Rules**:

- < 1000m: "XXX m"
- > = 1000m: "X.X km"

**Example**:

```javascript
formatDistance(150); // "150 m"
formatDistance(1500); // "1.5 km"
formatDistance(5000); // "5.0 km"
```

---

## search.js

### initSearch()

**Description**: Initialize search UI and event listeners

**Signature**:

```javascript
function initSearch()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Adds input listener to #search-input
- Adds click listener to #clear-search button
- Sets up hide/show for #search-results

**Example**:

```javascript
initSearch();
// Search box now functional
```

---

### handleSearch(event)

**Description**: Process search input changes

**Signature**:

```javascript
function handleSearch(event)
```

**Parameters**:

- `event` {Event} - Input event

**Returns**: `undefined`

**Side Effects**:

- Gets search query from input
- Calls `filterPOIs()`
- Calls `displaySearchResults()`
- Shows/hides clear button

**Example**:

```javascript
// Automatically called on input change
// User types "bab"  results appear
```

---

### filterPOIs(query)

**Description**: Search POIs by name, type, or description

**Signature**:

```javascript
function filterPOIs(query)
```

**Parameters**:

- `query` {String} - Search text

**Returns**: {Array<Object>} - Matching POI features

**Search Scope**:

- `poi.properties.name`
- `poi.properties.type`
- `poi.properties.short_description`

**Case Insensitive**: Yes

**Example**:

```javascript
const results = filterPOIs("bab");
console.log(results); // All gates matching "bab"

const results2 = filterPOIs("cafe");
console.log(results2); // All cafes
```

---

### displaySearchResults(results)

**Description**: Render search results in dropdown

**Signature**:

```javascript
function displaySearchResults(results)
```

**Parameters**:

- `results` {Array<Object>} - POI features to display

**Returns**: `undefined`

**Side Effects**:

- Updates #search-results innerHTML
- Shows "No results found" if empty
- Adds click listeners to each result
- Shows results container

**Example**:

```javascript
const results = filterPOIs("gate");
displaySearchResults(results);
// Dropdown now shows matching gates
```

---

### clearSearchInput()

**Description**: Clear search and hide results

**Signature**:

```javascript
function clearSearchInput()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Clears #search-input value
- Hides #search-results
- Hides #clear-search button
- Calls `clearDestinationMarker()`

**Example**:

```javascript
clearSearchInput();
// Search box reset
```

---

### setPOIsData(data)

**Description**: Initialize search module with POI data

**Signature**:

```javascript
function setPOIsData(data)
```

**Parameters**:

- `data` {Object} - GeoJSON FeatureCollection

**Returns**: `undefined`

**Side Effects**:

- Stores POI features in global `poisData`

**Example**:

```javascript
const pois = await (await fetch("data/pois.geojson")).json();
setPOIsData(pois);
```

---

## ui.js

### addDestinationMarker(lat, lng)

**Description**: Add red flag marker at destination

**Signature**:

```javascript
function addDestinationMarker(lat, lng)
```

**Parameters**:

- `lat` {Number} - Latitude
- `lng` {Number} - Longitude

**Returns**: {Marker} - Leaflet marker instance

**Visual**:

- Icon: Red flag ()
- Size: 24x24 pixels
- Shadow: 2px 2px 4px black

**Side Effects**:

- Removes previous destination marker if exists
- Updates global `destinationMarker`

**Example**:

```javascript
addDestinationMarker(35.787, -5.813);
// Red flag appears on map
```

---

### clearDestinationMarker()

**Description**: Remove destination marker from map

**Signature**:

```javascript
function clearDestinationMarker()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Removes marker from map if exists
- Sets `destinationMarker` to null

**Example**:

```javascript
clearDestinationMarker();
// Flag disappears
```

---

### getDestinationMarker()

**Description**: Get current destination marker instance

**Signature**:

```javascript
function getDestinationMarker()
```

**Parameters**: None

**Returns**: {Marker} | null - Leaflet marker instance

**Example**:

```javascript
const marker = getDestinationMarker();
if (marker) {
  const latlng = marker.getLatLng();
  console.log(`Destination: ${latlng.lat}, ${latlng.lng}`);
}
```

---

### drawRoute(path)

**Description**: Draw route on map as purple polyline

**Signature**:

```javascript
function drawRoute(path)
```

**Parameters**:

- `path` {Array<Array>} - Route waypoints [[lat, lng], ...]

**Returns**: {Polyline} | null - Leaflet polyline instance

**Visual**:

- Main line: Purple (#8e44ad), 6px, 80% opacity
- Accent line: Light purple (#a855f7), 4px, 100% opacity

**Side Effects**:

- Removes old route if exists
- Fits map view to show full route

**Example**:

```javascript
const pathCoords = [
  [35.786, -5.811],
  [35.787, -5.812],
];
drawRoute(pathCoords);
// Purple route appears on map
```

---

### clearRoute()

**Description**: Remove route from map

**Signature**:

```javascript
function clearRoute()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Removes all purple/light purple polylines
- Sets global `routeLayer` to null

**Example**:

```javascript
clearRoute();
// Route disappears from map
```

---

### getRouteLayer()

**Description**: Get current route polyline instance

**Signature**:

```javascript
function getRouteLayer()
```

**Parameters**: None

**Returns**: {Polyline} | null - Leaflet polyline instance

**Example**:

```javascript
const route = getRouteLayer();
if (route) {
  const bounds = route.getBounds();
  console.log(`Route bounds: ${bounds}`);
}
```

---

### showArrivalPopup()

**Description**: Show "You have arrived!" notification

**Signature**:

```javascript
function showArrivalPopup()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Opens popup on destination marker
- Vibrates device if supported
- Shows visual notification

**Vibration**: [200ms on, 100ms off, 200ms on]

**Example**:

```javascript
showArrivalPopup();
// Popup shows, device vibrates
```

---

## navigation.js

### initNavigation()

**Description**: Initialize all navigation modules

**Signature**:

```javascript
function initNavigation()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Calls `initSearch()`
- Calls `initLocation()`
- Calls `initNavPanel()`
- Sets up event listeners

**Example**:

```javascript
initNavigation();
// All navigation features activated
```

---

### selectDestination(item)

**Description**: Handle search result selection

**Signature**:

```javascript
function selectDestination(item)
```

**Parameters**:

- `item` {HTMLElement} - Search result DOM element

**Returns**: `undefined`

**Side Effects**:

- Extracts lat/lng/name from item.dataset
- Adds destination marker
- Centers map on destination
- Shows navigation panel

**Data Attributes Used**:

- `data-lat`: Latitude
- `data-lng`: Longitude
- `data-name`: Location name

**Example**:

```javascript
// Automatically called when clicking search result
selectDestination(resultElement);
```

---

### showNavPanel(name, lat, lng)

**Description**: Show navigation panel with destination info

**Signature**:

```javascript
function showNavPanel(name, lat, lng)
```

**Parameters**:

- `name` {String} - Destination name
- `lat` {Number} - Destination latitude
- `lng` {Number} - Destination longitude

**Returns**: `undefined`

**Side Effects**:

- Updates panel destination name
- Calculates and displays distance
- Shows navigation panel
- Stores destination in data attributes

**Example**:

```javascript
showNavPanel("Bab Kasbah", 35.787, -5.813);
// Navigation panel appears
```

---

### closeNavPanel()

**Description**: Hide navigation panel

**Signature**:

```javascript
function closeNavPanel()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Hides #nav-panel

**Example**:

```javascript
closeNavPanel();
// Panel disappears
```

---

### startNavigation()

**Description**: Begin turn-by-turn navigation

**Signature**:

```javascript
function startNavigation()
```

**Parameters**: None

**Returns**: `undefined` (Updates UI on success)

**Side Effects**:

- Checks user location (prompts if not set)
- Calls `findRoute()` with current position and destination
- Calls `drawRoute()` if route found
- Calls `startGPSTracking()`
- Updates button to show "Navigating..."

**Errors**:

- Alerts user if location not available
- Alerts if no route found

**Example**:

```javascript
startNavigation();
// Route calculated and tracking begins
```

---

### cancelNavigation()

**Description**: Stop and reset navigation

**Signature**:

```javascript
function cancelNavigation()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Stops GPS tracking
- Clears route from map
- Clears destination marker
- Closes navigation panel
- Resets state variables

**Example**:

```javascript
cancelNavigation();
// Navigation cancelled, map reset
```

---

### onUserPositionUpdate(lat, lng)

**Description**: Callback when user position changes

**Signature**:

```javascript
function onUserPositionUpdate(lat, lng)
```

**Parameters**:

- `lat` {Number} - Updated latitude
- `lng` {Number} - Updated longitude

**Returns**: `undefined`

**Called By**: `updateUserPosition()` from location.js

**Side Effects**:

- Centers map on user (if not navigating)
- Updates distance display (if navigating)
- Checks for arrival (< 10m)
- Shows arrival notification if reached
- Auto-cancels navigation on arrival

**Auto-Arrival Distance**: 10 meters

**Example**:

```javascript
// Called automatically by GPS update
// Not typically called directly
```

---

## gps-simulator.js

### startSimulation()

**Description**: Begin simulating GPS movement along current route

**Signature**:

```javascript
function startSimulation()
```

**Parameters**: None

**Returns**: `undefined`

**Requires**:

- Active navigation (`isNavigating === true`)
- Calculated route (`getRouteLayer()` returns valid layer)

**Side Effects**:

- Creates simulation interval
- Updates user position periodically
- Moves along route waypoints

**Interval**: `simulationSpeed` (default 1000ms)

**Example**:

```javascript
startNavigation(); // Start route
startSimulation(); // Begin walking simulation
```

---

### stopSimulation()

**Description**: Stop GPS simulation

**Signature**:

```javascript
function stopSimulation()
```

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Clears simulation interval
- Resets simulation state

**Example**:

```javascript
stopSimulation();
// Walking stops
```

---

### setSimulationSpeed(ms)

**Description**: Change simulation walking speed

**Signature**:

```javascript
function setSimulationSpeed(ms)
```

**Parameters**:

- `ms` {Number} - Milliseconds between position updates

**Returns**: `undefined`

**Typical Values**:

- 500ms: Fast walking
- 1000ms: Normal walking
- 2000ms: Slow walking

**Example**:

```javascript
setSimulationSpeed(500); // Speed up
setSimulationSpeed(2000); // Slow down
```

---

### teleportTo(lat, lng)

**Description**: Jump user position to specific location

**Signature**:

```javascript
function teleportTo(lat, lng)
```

**Parameters**:

- `lat` {Number} - Target latitude
- `lng` {Number} - Target longitude

**Returns**: `undefined`

**Side Effects**:

- Updates user position marker
- Centers map on location
- Marks as test location

**Example**:

```javascript
teleportTo(35.787, -5.813);
// User marker jumps to Kasbah
```

---

### nudge(latOffset, lngOffset)

**Description**: Move user position by small offset

**Signature**:

```javascript
function nudge(latOffset, lngOffset)
```

**Parameters**:

- `latOffset` {Number} - Latitude offset (degrees)
- `lngOffset` {Number} - Longitude offset (degrees)

**Returns**: `undefined` (Or logs "Location not set" if no position)

**Typical Offsets**:

- 0.0001 latitude  11 meters north/south
- 0.0001 longitude  8 meters east/west (at 35N)

**Defaults** (if not specified):

- latOffset: 0.0001
- lngOffset: 0

**Example**:

```javascript
nudge(0.0001, 0); // Move 11m north
nudge(0, 0.0001); // Move 8m east
nudge(0.0001, 0.0001); // Move diagonally
```

---

### simulateCustomPath(points)

**Description**: Walk along custom point sequence

**Signature**:

```javascript
function simulateCustomPath(points)
```

**Parameters**:

- `points` {Array<Object>} - Array of {lat, lng} objects

**Returns**: `undefined`

**Validation**:

- Must be array with 2+ points
- Logs error if invalid

**Example**:

```javascript
const path = [
  { lat: 35.786, lng: -5.811 },
  { lat: 35.787, lng: -5.811 },
  { lat: 35.787, lng: -5.812 },
];
simulateCustomPath(path);
// Walks along custom path
```

---

## Global Variables Reference

| Variable             | Type         | Module        | Purpose               |
| -------------------- | ------------ | ------------- | --------------------- |
| `map`                | Leaflet.Map  | map.js        | Main map instance     |
| `userLocation`       | {lat, lng}   | location.js   | Current user position |
| `userMarker`         | Marker       | location.js   | User position marker  |
| `watchId`            | Number       | location.js   | GPS watch ID          |
| `streetGraph`        | {nodes: Map} | routing.js    | Street network graph  |
| `streetsData`        | GeoJSON      | routing.js    | Raw street data       |
| `poisData`           | Object[]     | search.js     | Raw POI features      |
| `destinationMarker`  | Marker       | ui.js         | Destination marker    |
| `routeLayer`         | Polyline     | ui.js         | Current route line    |
| `isNavigating`       | Boolean      | navigation.js | Navigation active?    |
| `currentDestination` | {lat, lng}   | navigation.js | Target location       |

---

## Usage Examples

### Example 1: Find Route and Display

```javascript
// 1. Get user location
const userLoc = getUserLocation();
if (!userLoc) {
  locateUser();
  return;
}

// 2. Find route to destination
const route = findRoute(
  [userLoc.lng, userLoc.lat],
  [-5.813, 35.787], // Destination
);

if (route) {
  // 3. Display route
  drawRoute(route.path);
  console.log(`Route: ${formatDistance(route.distance)}`);
} else {
  console.log("No route found");
}
```

### Example 2: Search and Navigate

```javascript
// 1. Search for POIs
const results = filterPOIs("bab");
console.log(`Found ${results.length} gates`);

// 2. Use first result
const poi = results[0];
selectDestination(poi);

// 3. Start navigation (user clicks button)
startNavigation();
```

### Example 3: Test Navigation with Simulation

```javascript
// 1. Start real navigation
startNavigation();

// 2. Simulate walking
setSimulationSpeed(1000); // Normal speed
startSimulation();

// 3. Monitor progress (in console)
const dist = calculateDistance(
  getUserLocation().lat,
  getUserLocation().lng,
  currentDestination.lat,
  currentDestination.lng,
);
console.log(`Distance to destination: ${formatDistance(dist)}`);

// 4. Stop when done
stopSimulation();
```

---

## Error Handling

All major functions check for prerequisites:

```javascript
// Example: findRoute validates inputs
if (!streetGraph || streetGraph.nodes.size === 0) {
  buildStreetGraph(); // Auto-build if not ready
}

if (!startNode || !endNode) {
  return null; // No valid nodes
}

if (startNode === endNode) {
  // Handle same start/end
}
```

Always check return values:

```javascript
const route = findRoute(...);
if (route) {
  // Process route
} else {
  // Handle null case
}

const location = getUserLocation();
if (location) {
  // Use location
} else {
  // Prompt to enable GPS
}
```

---

## Performance Characteristics

| Operation             | Time      | Notes                   |
| --------------------- | --------- | ----------------------- |
| Graph build           | ~50-200ms | Depends on street count |
| Route find (Dijkstra) | ~10-50ms  | Usually < 100ms         |
| Search filter         | ~1-5ms    | Real-time filtering     |
| POI display           | ~20-100ms | Depends on count        |
| GPS update            | ~100ms    | Browser dependent       |

---

## Browser Compatibility

| Feature      | Chrome | Firefox     | Safari  | Edge |
| ------------ | ------ | ----------- | ------- | ---- |
| Leaflet      |       |            |        |     |
| Geolocation  |       |            |        |     |
| Vibration    |       |  (Android) | Limited |     |
| LocalStorage |       |            |        |     |
| Fetch API    |       |            |        |     |

---

**Last Updated**: February 2025  
**Version**: 1.0

