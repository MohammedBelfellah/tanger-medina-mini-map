# Tanger Medina Mini-Map - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Architecture](#architecture)
4. [Modules Reference](#modules-reference)
5. [How It Works](#how-it-works)
6. [Modification Guide](#modification-guide)
7. [Data Format](#data-format)
8. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Tanger Medina Mini-Map** is an interactive, offline-first navigation system for the Old Medina of Tangier, Morocco. It uses Leaflet.js for map rendering and implements Dijkstra's pathfinding algorithm for turn-by-turn pedestrian navigation.

### Key Features

- Interactive map with street network visualization
- Real-time GPS tracking and location services
- Turn-by-turn pedestrian navigation
- Full-text search for gates (Bab) and points of interest
- Fully offline routing (no server required)
- Dead-end detection (orange dashed lines)
- Mobile-friendly responsive design
- Arrival notifications with haptic feedback

### Tech Stack

- **Frontend Framework**: Pure JavaScript (Vanilla JS, no frameworks)
- **Maps Library**: Leaflet.js v1.9.4
- **Tile Provider**: Stadia Maps (Stamen Toner Lite)
- **Icons**: Font Awesome 6.4.0
- **Features**: HTML5 Geolocation API, IndexedDB capable

---

## Quick Start Guide

### 1. Opening the Application

```bash
# Option A: Direct file open
Open index.html in any modern web browser (Chrome, Firefox, Safari, Edge)

# Option B: Using Python server
cd d:\Desktop\GIS_fst\S1\tanger-medina-mini-map
python -m http.server 5500

# Then visit: http://localhost:5500
```

### 2. Finding Your Location

1. Click the **Locate** button (bottom right of map)
2. Allow location permissions when prompted
3. Your position appears as a blue circle on the map

### 3. Searching for Destinations

1. Click the **search box** at the top left
2. Type a destination name (e.g., "Bab Kasbah", "mosque", "gate")
3. Click a result to select it
4. A red flag marker appears on the destination

### 4. Starting Navigation

1. Click **Start Navigation** button
2. The app calculates the optimal route
3. A purple route line appears on the map
4. Follow the route - the map updates as you move
5. Arrival notification when you reach the destination

### 5. Testing Navigation (Console Commands)

Open browser console (F12 key) and use:

```javascript
// Start GPS simulation on the route
startSimulation();

// Stop the simulation
stopSimulation();

// Change simulation speed (ms between steps)
setSimulationSpeed(500); // Fast walking
setSimulationSpeed(1000); // Normal
setSimulationSpeed(2000); // Slow walking

// Teleport to specific location
teleportTo(35.786074, -5.811693); // Teleport to Medina center

// Move position by offset
nudge(0.0001, 0); // Move north by ~10 meters
nudge(0, 0.0001); // Move east by ~10 meters

// Simulate walking custom path
simulateCustomPath([
  { lat: 35.786074, lng: -5.811693 },
  { lat: 35.785074, lng: -5.811693 },
  { lat: 35.785074, lng: -5.810693 },
]);
```

---

## Architecture

### Project Structure

```
tanger-medina-mini-map/

 index.html                 # Main HTML entry point
 DOCUMENTATION.md           # This file
 MODIFICATION_GUIDE.md      # How to modify and extend
 API_REFERENCE.md           # Detailed module/function reference

 css/
    style.css              # All styling (no frameworks)

 js/
    app.js                 # Application initialization
    map.js                 # Map setup and GeoJSON rendering
    data.js                # Async data loading
    navigation.js          # Main navigation controller
    gps-simulator.js       # GPS simulation for testing
   
    modules/               # Feature modules (independent)
        location.js        # GPS and position tracking
        routing.js         # Dijkstra pathfinding algorithm
        search.js          # POI search and filtering
        ui.js              # Markers, routes, visual feedback

 data/
    medina_boundary.geojson    # Polygon of medina area
    medina_streets.geojson     # Street network (LineStrings)
    pois.geojson               # Points of interest (Points)
    map_beni-ider.geojson      # Alternative street dataset

 assets/
     icons/                 # Custom icon files (if any)
     images/                # Background/overlay images (if any)
```

### Module Dependency Graph

```
app.js (Entry Point)
   initializeMap()
      map.js
         loadMedinaBoundary()
         loadMedinaStreets()
         loadPOIs()
     
      data.js (loads GeoJSON files)
  
   initNavigation()
       navigation.js (coordinates all features)
          initSearch()       search.js
          initLocation()     location.js
          initNavPanel()
      
       routing.js            (pathfinding)
       location.js           (GPS tracking)
       search.js             (POI search)
       ui.js                 (visual elements)
```

### Data Flow

```
USER INTERACTION
    
[Search]  Filter POIs  Display Results
     (select destination)
[Locate]  Get GPS Position  Update User Marker
    
[Start Navigation]  findRoute()  Build Graph  Dijkstra Algorithm
    
drawRoute()  Create Polyline  Center Map
    
startGPSTracking()  Monitor Position  Update Distance
    
onUserPositionUpdate()  Check Arrival  Show Notification
```

---

## Modules Reference

### 1. **routing.js** - Pathfinding Engine

**Purpose**: Implements Dijkstra's algorithm for optimal route calculation

**Key Functions**:

- `setStreetsData(data)` - Initialize with street network
- `findRoute(startCoord, endCoord)` - Find shortest path
- `calculateCoordDistance(coord1, coord2)` - Haversine distance calculation

**How It Works**:

1. Builds a graph from GeoJSON LineStrings
2. Creates nodes at street endpoints
3. Auto-connects nearby nodes (within 20m)
4. Implements bidirectional edges for pedestrian movement
5. Dijkstra's algorithm finds shortest path
6. Returns path as array of [longitude, latitude] coordinates

**Graph Structure**:

```javascript
{
  nodes: Map {
    "lng,lat"  {
      coord: [lng, lat],
      edges: [{to: "node_key", distance: meters}, ...]
    }
  }
}
```

### 2. **location.js** - Position & GPS Tracking

**Purpose**: Manages user location, GPS tracking, and distance calculations

**Key Functions**:

- `locateUser()` - Request GPS permission and get position
- `updateUserPosition(lat, lng, isTest)` - Update marker on map
- `startGPSTracking()` - Continuous position monitoring
- `stopGPSTracking()` - Disable tracking
- `calculateDistance(lat1, lng1, lat2, lng2)` - Haversine formula
- `formatDistance(meters)` - Human-readable format

**GPS Modes**:

- **Real GPS** (Production): Uses device GPS, requires HTTPS on live sites
- **Test Mode** (Development): Hard-coded test location in Medina
  - Set `TEST_MODE = false` in location.js for real GPS

**Important Variables**:

```javascript
userLocation = {lat: number, lng: number}
userMarker = L.Marker instance
watchId = GeolocationWatchPosition ID
```

### 3. **search.js** - POI Search & Filtering

**Purpose**: Full-text search for points of interest

**Key Functions**:

- `initSearch()` - Setup event listeners
- `handleSearch(event)` - Process search input
- `filterPOIs(query)` - Search algorithm
- `displaySearchResults(results)` - Render dropdown
- `selectDestination(item)` - Handle POI selection
- `setPOIsData(data)` - Initialize with GeoJSON

**Search Features**:

- Searches: name, type, description
- Case-insensitive matching
- Real-time filtered results
- Click to select destination

### 4. **ui.js** - Visual Elements & Markers

**Purpose**: Map markers, routes, and visual feedback

**Key Functions**:

- `addDestinationMarker(lat, lng)` - Red flag at destination
- `drawRoute(path)` - Purple route polyline
- `clearRoute()` - Remove route from map
- `showArrivalPopup()` - Destination reached notification
- `clearDestinationMarker()` - Remove destination marker

**Visual Design**:

- User: Blue circle (20px) with white border
- Destination: Red flag (24px) with shadow
- Route: Double purple line (6px base, 4px accent)
- Dead-end streets: Orange dashed lines

### 5. **navigation.js** - Main Controller

**Purpose**: Orchestrates all navigation features

**Key Functions**:

- `initNavigation()` - Initialize all modules
- `selectDestination(item)` - Handle destination selection
- `showNavPanel(name, lat, lng)` - Display navigation panel
- `startNavigation()` - Begin turn-by-turn navigation
- `cancelNavigation()` - Exit navigation mode
- `onUserPositionUpdate(lat, lng)` - Real-time position callback

**State Variables**:

```javascript
isNavigating = boolean; // Navigation active?
currentDestination = { lat, lng }; // Target location
```

### 6. **map.js** - Map Initialization & Rendering

**Purpose**: Leaflet map setup and GeoJSON visualization

**Key Functions**:

- `initializeMap()` - Create map instance
- `renderMedinaBoundary(geojsonData)` - Draw medina polygon
- `renderMedinaStreets(geojsonData)` - Visualize street network
- `renderPOIs(geojsonData)` - Place POI markers
- `addMedinaLabels()` - Add text labels

**Tile Provider**:

- Stadia Maps (requires API key)
- Falls back to OpenStreetMap if needed

### 7. **data.js** - Data Loading

**Purpose**: Asynchronously load GeoJSON files

**Key Functions**:

- `loadMedinaBoundary()` - Fetch boundary polygon
- `loadMedinaStreets()` - Fetch street network
- `loadPOIs()` - Fetch points of interest

**Error Handling**: Console errors logged, app continues

### 8. **gps-simulator.js** - Testing Utility

**Purpose**: GPS simulation for development/testing

**Key Functions**:

- `startSimulation()` - Walk along calculated route
- `stopSimulation()` - Stop walking
- `setSimulationSpeed(ms)` - Change walking speed
- `teleportTo(lat, lng)` - Jump to location
- `nudge(latOffset, lngOffset)` - Move by offset
- `simulateCustomPath(points)` - Walk custom path

---

## How It Works

### Navigation Flow (Step-by-Step)

```
1. USER CLICKS "LOCATE"
   
   location.js: locateUser()
    Check browser geolocation support
    Request location permission
    Get GPS coordinates
    updateUserPosition()
        Add blue marker to map
        Call onUserPositionUpdate()

2. USER SEARCHES FOR DESTINATION
   
   search.js: handleSearch()
    Get search text
    filterPOIs() - fuzzy match all properties
    displaySearchResults() - render dropdown
    Add click handlers

3. USER CLICKS SEARCH RESULT
   
   navigation.js: selectDestination()
    Extract lat/lng/name from result
    ui.js: addDestinationMarker() - red flag
    showNavPanel() - show navigation panel
    Display distance to destination

4. USER CLICKS "START NAVIGATION"
   
   navigation.js: startNavigation()
    Get current user location
    routing.js: findRoute()
       Build street graph
       Find nearest graph nodes to start/end
       Dijkstra algorithm
       Return path as coordinates
    ui.js: drawRoute() - draw purple line
    location.js: startGPSTracking() - monitor position
    Update button to "Navigating..."

5. USER MOVES (CONTINUOUS)
   
   location.js: GPS position update
    onUserPositionUpdate()
        Calculate distance to destination
        Update distance display
        Check if arrived (< 10 meters)
        If arrived: showArrivalPopup()

6. USER ARRIVES
   
   ui.js: showArrivalPopup()
    Display "You have arrived!"
    Vibrate device if supported
    Cancel navigation automatically
```

### Dijkstra's Algorithm (Pathfinding)

```
Input: Start Node, End Node, Graph

1. Initialize:
   distances = {all nodes: }
   distances[start] = 0
   visited = empty set

2. While unvisited nodes remain:
   a. Find unvisited node with smallest distance
   b. If it's the destination, STOP
   c. For each neighbor of current node:
      - Calculate new distance via current
      - If new distance is shorter, update it
      - Record current as previous

3. Reconstruct path by following previous pointers
4. Return path as coordinate array
```

### Distance Calculation (Haversine Formula)

```javascript
R = Earth radius (6,371,000 meters)
lat = lat2 - lat1 (radians)
lng = lng2 - lng1 (radians)

a = sin(lat/2) + cos(lat1)  cos(lat2)  sin(lng/2)
c = 2  atan2(a, (1-a))
distance = R  c
```

---

## Modification Guide

### Common Modifications

#### 1. Change Map Center & Zoom

**File**: `js/map.js` (line ~40)

```javascript
// Find this line:
.setView([35.788, -5.809], 16);

// Change to your coordinates:
.setView([latitude, longitude], zoomLevel);

// Zoom levels: 6-19 (lower = wider view)
```

#### 2. Add New POI Type with Custom Color

**File**: `js/map.js` (line ~130)

```javascript
// In renderPOIs() function:
const typeColors = {
  square: "#3498db",
  culture: "#9b59b6",
  // ADD THIS:
  restaurant: "#e94b3c", // Red
  hotel: "#27ae60", // Green
};
```

Then add POI with `type: "restaurant"` in GeoJSON.

#### 3. Change Search Input Placeholder

**File**: `index.html` (line ~31)

```html
<!-- Find: -->
<input
  type="text"
  id="search-input"
  placeholder="Search destination (e.g., Bab Kasbah)"
/>

<!-- Change to: -->
<input type="text" id="search-input" placeholder="Enter location name..." />
```

#### 4. Enable Real GPS (Production)

**File**: `js/modules/location.js` (line ~8)

```javascript
// Change:
const TEST_MODE = true;

// To:
const TEST_MODE = false;

// NOTE: Requires HTTPS on live sites
```

#### 5. Adjust GPS Accuracy Tolerance

**File**: `js/modules/routing.js` (line ~18-19)

```javascript
const CONNECT_TOLERANCE = 0.00015; // ~15 meters (node merge distance)
const AUTO_CONNECT_DIST = 0.0002; // ~20 meters (auto-connect nearby nodes)

// Smaller = more strict, larger = more forgiving
// 0.00001  1 meter at equator
```

#### 6. Change Arrival Distance Threshold

**File**: `js/navigation.js` (line ~165)

```javascript
// Find this line (approximate):
if (distance < 10) {  // Within 10 meters = arrived

// Change to your preferred distance:
if (distance < 15) {  // Within 15 meters = arrived
```

#### 7. Add New GeoJSON Layer

**File**: `js/map.js` - add new function:

```javascript
async function loadCustomLayer() {
  try {
    const response = await fetch("data/custom.geojson");
    const geojsonData = await response.json();

    L.geoJSON(geojsonData, {
      style: {
        color: "#ff0000",
        weight: 2,
        opacity: 0.8,
      },
    }).addTo(map);
  } catch (error) {
    console.error("Error loading custom layer:", error);
  }
}

// Then call in initializeMap():
loadCustomLayer();
```

#### 8. Change Route Color & Style

**File**: `js/modules/ui.js` (line ~40)

```javascript
// Main route line:
const routeLayer = L.polyline(latLngs, {
  color: "#8e44ad", // Change color (hex)
  weight: 6, // Line thickness
  opacity: 0.8, // Transparency (0-1)
}).addTo(map);

// Accent line:
L.polyline(latLngs, {
  color: "#a855f7", // Lighter version
  weight: 4,
  opacity: 1,
}).addTo(map);
```

#### 9. Add Custom Marker Icon

**File**: `js/modules/ui.js`

```javascript
function addCustomMarker(lat, lng, iconHtml, color) {
  return L.marker([lat, lng], {
    icon: L.divIcon({
      className: "custom-marker",
      html: iconHtml, // Custom HTML or SVG
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    }),
  }).addTo(map);
}

// Usage:
addCustomMarker(35.786, -5.811, '<i class="fas fa-star"></i>', "gold");
```

#### 10. Change Navigation Panel Position

**File**: `css/style.css` (line ~22)

```css
/* Find: */
#nav-panel {
  position: absolute;
  top: 15px;
  left: 15px;
  /* ... */
}

/* Change to: */
#nav-panel {
  position: absolute;
  bottom: 15px; /* Move to bottom */
  right: 15px; /* Or right side */
}
```

---

## Data Format

### GeoJSON Structure

#### Streets (LineString)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Street name (optional)"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-5.811, 35.786],
          [-5.81, 35.785],
          [-5.809, 35.784]
        ]
      }
    }
  ]
}
```

**Coordinate Format**: [longitude, latitude] (NOT lat, lng!)

#### Points of Interest (Point)

```json
{
  "type": "Feature",
  "properties": {
    "id": 1,
    "name": "Bab Kasbah",
    "type": "gate",
    "short_description": "Main gate leading into the Kasbah district."
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-5.8149, 35.7887]
  }
}
```

#### Boundary (Polygon)

```json
{
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-5.8079, 35.7886],
        [-5.8092, 35.7889],
        ... (clockwise around boundary)
        [-5.8079, 35.7886]  // Close polygon
      ]
    ]
  }
}
```

### JSON Validation

Use free online tools:

- https://jsonlint.com/ - Syntax check
- https://geojson.io/ - Visual GeoJSON editor & validator

---

## Troubleshooting

### Problem: Search Not Working

**Solution**:

1. Check console (F12) for errors
2. Verify pois.geojson loaded (Network tab)
3. Ensure POI properties match search criteria
4. Check search.js for property names

### Problem: Navigation Can't Find Route

**Causes**:

- Destination not on street network
- Street network incomplete/disconnected
- Destination too far from nearest street (>30m)

**Solutions**:

1. Use destinations near visible streets
2. Verify medina_streets.geojson has complete coverage
3. Lower CONNECT_TOLERANCE in routing.js to 0.0001

### Problem: GPS Not Working

**Check**:

1. Browser has geolocation permission
2. Using HTTPS (if live site, required by browsers)
3. Device has GPS enabled
4. Location services enabled in browser settings

**Test**:

```javascript
// In console:
if (navigator.geolocation) {
  console.log("Geolocation supported");
  navigator.geolocation.getCurrentPosition(
    (pos) => console.log(pos.coords),
    (err) => console.error(err),
  );
}
```

### Problem: Map Tiles Not Loading

**Check**:

1. Internet connection active
2. Stadia Maps API key valid (js/map.js line ~50)
3. Domain added to API key restrictions
4. Check Network tab for 403/401 errors

**Fallback**:
Replace Stadia URL in `js/map.js` with:

```javascript
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
```

### Problem: Routes Look Strange/Incorrect

**Causes**:

- Graph not built properly
- Tolerance values too large
- Overlapping street coordinates

**Debug**:

```javascript
// In console, after navigation init:
console.log("Graph info:");
console.log(streetGraph);
console.log("Node count:", streetGraph.nodes.size);

// Find isolated nodes:
streetGraph.nodes.forEach((node, key) => {
  if (node.edges.length === 0) {
    console.log("Isolated node:", key, node.coord);
  }
});
```

### Problem: App Running Slow

**Optimize**:

1. Reduce street network complexity (fewer nodes)
2. Simplify POI dataset
3. Increase tolerance values (merge more nodes)
4. Disable unused layers temporarily

---

## Resources & References

### Official Documentation

- **Leaflet.js**: https://leafletjs.com/reference.html
- **GeoJSON Spec**: https://geojson.org/
- **Geolocation API**: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- **Font Awesome Icons**: https://fontawesome.com/icons

### Tools

- **GeoJSON Editor**: https://geojson.io/
- **JSON Validator**: https://jsonlint.com/
- **Coordinate Converter**: https://www.latlong.net/

### Algorithms

- **Dijkstra's Algorithm**: https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
- **Haversine Formula**: https://en.wikipedia.org/wiki/Haversine_formula

---

## Author & License

**Author**: Mohammed Belfellah  
**Created**: 2024-2025  
**License**: MIT

Feel free to modify, extend, and redistribute this project!

---

## Version History

| Version | Date       | Changes                              |
| ------- | ---------- | ------------------------------------ |
| 1.0     | 2025-01-XX | Initial release with full navigation |
| 1.1     | 2025-02-24 | Added comprehensive documentation    |

---

**Last Updated**: February 2025  
**For questions/issues**: Check browser console (F12) for error messages

