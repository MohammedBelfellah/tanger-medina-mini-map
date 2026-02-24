# Architecture & Design Overview

## System Architecture

```

                          USER INTERFACE (HTML/CSS)                       
         
  Search Panel    Nav Panel      Locate Button   Map Container  
         

                                    

                        BUSINESS LOGIC LAYER (JavaScript)                
    
                      navigation.js (Controller)                       
           Coordinates all modules, manages state & flow              
    
                                                                    
  v  v  v  v          
   search      location     routing      ui.js               
   .js         .js          .js                              
                  
                                                                      
    
                 map.js (Leaflet Integration)                     
             Renders GeoJSON, manages layers                      
    
                                                                      
    
                 data.js (Data Loading)                           
          Async fetch of GeoJSON files from data/                  
    

                                    

                         EXTERNAL DEPENDENCIES                           
         
    Leaflet.js          Stadia Maps         Geolocation API      
    (Map rendering)     (Tile provider)     (Browser GPS)        
         

                                    

                           DATA LAYER (Files)                            
         
    medina_boundary    medina_streets      pois.geojson          
    .geojson           .geojson            (Points of Interest)   
         

```

---

## Module Interactions

### 1. Initialization Flow

```
DOMContentLoaded Event
        
   app.js
        
   initializeMap()   map.js
         Create Leaflet map
         Add tile layer (Stadia Maps)
         Set bounds & zoom
         Load data:
            loadMedinaBoundary()   data.js  renderMedinaBoundary()
            loadMedinaStreets()    data.js  renders + setStreetsData()
            loadPOIs()             data.js  renderPOIs() + setPOIsData()
        
   initNavigation()   navigation.js
         initSearch()     search.js
         initLocation()   location.js
         initNavPanel()   creates event listeners
```

### 2. Search Flow

```
User Types in Search Box
        
    handleSearch()  search.js
        
    filterPOIs(query)
         Search: name, type, description
         Case-insensitive matching
        
    displaySearchResults(results)
         Render dropdown
         Attach click handlers
        
User Clicks Result
        
    selectDestination()  navigation.js
         addDestinationMarker()   ui.js
         showNavPanel()
         Update distance display
```

### 3. Navigation Flow

```
User Clicks "Start Navigation"
        
    startNavigation()  navigation.js
         Get user location:
           getUserLocation()   location.js
        
         Calculate route:
           findRoute()   routing.js
               findNearestGraphNode()  2
               Dijkstra algorithm
               Return path + distance
        
         Display route:
           drawRoute()   ui.js
        
         Start tracking:
            startGPSTracking()   location.js
               watchPosition() (Geolocation API)
                
                (Continuous GPS updates)
                
                updateUserPosition()   location.js
                
                onUserPositionUpdate()   navigation.js
                 Update distance display
                 Update map view
                 Check arrival (< 10m)
                   
                   showArrivalPopup()   ui.js
```

### 4. Routing Graph Building

```
setStreetsData(streets.geojson)   routing.js
        
buildStreetGraph()
        
    (Pass 1) Create Nodes:
     Extract all endpoints from LineStrings
        Merge nearby nodes (CONNECT_TOLERANCE = 15m)
        
    (Pass 2) Create Edges:
     Connect consecutive coordinates
        Calculate distance (Haversine)
        Create bidirectional edges
        
    (Pass 3) Auto-Connect:
     Find nearby isolated nodes (AUTO_CONNECT_DIST = 20m)
        Create edges between them
        
    Graph Ready:
    {
      nodes: Map {
        "lng,lat"  {coord: [lng,lat], edges: [{to, distance},...]}
      }
    }
```

---

## Data Flow Diagram

### Complete User Journey

```
START
   User opens index.html
  
   Initialization
     Map created with basemap tiles
     GeoJSON layers loaded and rendered
     Street graph built
     UI ready
  
   User clicks "Locate"
     Browser requests GPS permission
     GPS coordinates received
     Blue user marker appears
  
   User searches for destination
     Types "Bab" in search
     Search filters POIs
     Results dropdown shows 9 gates
  
   User clicks search result
     Red destination marker appears
     Navigation panel shows
     Distance calculated
  
   User clicks "Start Navigation"
     Route calculated using Dijkstra
     Purple route drawn on map
     GPS tracking starts
     Distance updates real-time
  
   User walks (or simulation runs)
     Position updates from GPS
     Distance decreases
     Map recenters on user
     (Repeat until arrival)
  
   User within 10m of destination
     Arrival detected
     Popup shown
     Device vibrates
     Navigation auto-cancelled
  
   END

Parallel: Developer Testing
   Console commands available
     startSimulation() - walk route automatically
     setSimulationSpeed(ms) - adjust speed
     teleportTo(lat, lng) - jump to location
     nudge(lat, lng) - move by offset
     simulateCustomPath() - custom route
  
   Useful console queries
      analyzeGraph()  graph statistics
      getUserLocation()  current position
      getCurrentRoute()  current path
      filterPOIs("query")  search results
```

---

## State Management

### Global State Variables

```javascript
// Map State
map; // Leaflet map instance
destinationMarker; // Destination flag marker
userMarker; // Blue user position marker
routeLayer; // Purple route polyline

// User Location
userLocation = {
  // Current GPS position
  lat: number,
  lng: number,
};
watchId; // GPS tracking watch ID

// Navigation State
isNavigating = false; // Navigation active?
currentDestination; // Target location {lat, lng}

// Routing Data
streetGraph = {
  // Street network graph
  nodes: Map,
};
streetsData; // Raw GeoJSON streets

// Search Data
poisData; // Array of POI features
```

### State Transitions

```
                      Initial
                        
                    [No Location]
                        
Click Locate  [Locating...]  [Located]
                                    
Click Search  [Search Active]
                        
Click Result  [Destination Selected]
                        
Click Navigate  [Calculating...]  [Navigating]
                                         
                    [Distance 0]  [Arrived]
                        
Click Cancel  [Cancelled]  [No Location]
```

---

## Algorithm Details

### Dijkstra's Algorithm (Pathfinding)

```
Input: start_node, end_node, graph

1. Initialize:
   distances = {all_nodes: }
   distances[start] = 0
   visited = {}
   previous = {}

2. Loop:
   current = unvisited node with min distance

   if current == end:
     STOP (found destination)

   if current == null:
     STOP (no path exists)

   mark current as visited

   for each neighbor of current:
     new_distance = distances[current] + edge_weight

     if new_distance < distances[neighbor]:
       distances[neighbor] = new_distance
       previous[neighbor] = current

3. Reconstruct path:
   path = []
   current = end_node

   while current exists:
     path.prepend(current.coordinate)
     current = previous[current]

   Return path
```

**Time Complexity**: O((V + E) log V) where V = nodes, E = edges  
**Space Complexity**: O(V)

### Haversine Formula (Distance Calculation)

```
Formula:
  R = Earth radius (6,371,000 meters)
  lat = (lat2 - lat1)  /180  [convert to radians]
  lng = (lng2 - lng1)  /180

  a = sin(lat/2) + cos(lat1/180)  cos(lat2/180)  sin(lng/2)
  c = 2  atan2(a, (1-a))
  distance = R  c

Result: Great-circle distance in meters
Accuracy: 0.5% (suitable for GPS accuracy ~5-10m)
```

### Graph Building (3-Pass Algorithm)

```
Pass 1: Node Creation
   Extract all coordinates from LineStrings
   Round coordinates to 5 decimal places
   Check for nearby nodes within CONNECT_TOLERANCE
   Merge nearby nodes (use first one found)
   Result: Unique nodes at street endpoints

Pass 2: Edge Creation
   For each LineString:
     For each consecutive pair of coordinates:
        Find corresponding nodes
        Calculate exact distance
        Create bidirectional edges (pedestrian network is undirected)
        Avoid duplicates
   Result: Connected node network

Pass 3: Auto-Connect
   Find all node pairs within AUTO_CONNECT_DIST
   If pair not already connected, create edge
   Calculate actual distance between coordinates
   Result: Isolated nodes connected to network

Output: Complete street graph ready for pathfinding
```

---

## Performance Characteristics

### Time Complexity

| Operation      | Complexity     | Typical Time |
| -------------- | -------------- | ------------ |
| Graph build    | O(V)          | 50-200ms     |
| Dijkstra route | O(V log V + E) | 10-50ms      |
| POI search     | O(n)           | 1-5ms        |
| Distance calc  | O(1)           | < 1ms        |
| Marker render  | O(n)           | 10-100ms     |

### Space Complexity

| Component    | Memory   | Notes                          |
| ------------ | -------- | ------------------------------ |
| Street graph | ~1-2MB   | Depends on street network size |
| POI data     | ~200KB   | ~100 POIs                      |
| Boundary     | ~50KB    | Single polygon                 |
| Tile cache   | ~10-50MB | Browser tile cache             |

### Network Usage

| Data             | Size                | Load Time       |
| ---------------- | ------------------- | --------------- |
| index.html       | 3KB                 | < 1ms           |
| CSS              | 15KB                | < 5ms           |
| JavaScript (all) | 80KB                | 20-50ms         |
| GeoJSON files    | 500KB               | 100-300ms       |
| Map tiles        | 50-200 tiles  20KB | Depends on area |

---

## Security Considerations

### 1. No Backend Required

-  All data processing on client
-  No data sent to server
-  GPS data never leaves device

### 2. External Dependencies

- Stadia Maps API (public, rate-limited)
- Leaflet.js (open source, CDN)
- Font Awesome (open source, CDN)

### 3. Geolocation

- Requires user permission
- HTTPS required on live sites
- Cannot track without user consent

### 4. Data Format

- GeoJSON is plain text (no executable code)
- Validated before processing
- No eval() or dynamic script loading

---

## Scalability Notes

### Handling Larger Medinas

**Current Setup**:

- ~80 streets
- ~10 POIs
- Graph build: ~50ms
- Route calc: ~10ms

**For 500 Streets**:

- Increase CONNECT_TOLERANCE to 0.0003 (30m)
- Higher route calculation time (~100ms)
- Consider spatial indexing

**For 2000+ Streets**:

- Implement quad-tree spatial indexing
- Use A\* algorithm instead of Dijkstra
- Pre-calculate common routes
- Consider server-side routing

### Memory Optimization

```javascript
// Current: All POIs always in memory
poisData = [... 10 POIs ...]  // ~5KB

// Optimized: Lazy load
poisData = null;
function getPOIs() {
  return poisData || (poisData = loadPOIs());
}

// Caching routes
routeCache = new Map();  // Limit to 100 entries
```

---

## Extension Points

### Easy to Extend

1. **Add new layers**  Add renderer in map.js
2. **New search types**  Extend filterPOIs logic
3. **Different routing**  Replace Dijkstra with A\*
4. **Waypoints**  Store multiple destinations
5. **Favorites**  Use localStorage
6. **History**  Track visited locations

### Requires Refactoring

1. **Server-side routing**  Add WebSocket communication
2. **Real-time traffic**  Integrate API feeds
3. **Multiple cities**  Add city selector
4. **User accounts**  Add authentication
5. **Multilingual**  Add i18n library

---

## Testing Strategy

### Unit Testing (Manual)

```javascript
// Test routing
const route = findRoute([-5.811, 35.786], [-5.812, 35.787]);
console.assert(route.path.length > 0, "Route should have waypoints");
console.assert(route.distance > 0, "Distance should be positive");

// Test distance calc
const dist = calculateDistance(0, 0, 0.00001, 0);
console.assert(dist > 0.8 && dist < 1.2, "~1m expected");

// Test search
const results = filterPOIs("bab");
console.assert(results.length > 0, "Should find gates");
console.assert(results[0].properties.type === "gate", "Should be gates");
```

### Integration Testing

```javascript
// Full navigation flow
locateUser();
setTimeout(() => {
  const results = filterPOIs("bab");
  selectDestination(results[0]);
  startNavigation();
  console.assert(isNavigating, "Should be navigating");
}, 1000);
```

---

## Deployment Checklist

- [ ] TEST_MODE = false in location.js
- [ ] API keys set (Stadia Maps key in map.js)
- [ ] GeoJSON files accessible at correct paths
- [ ] HTTPS enabled (for Geolocation)
- [ ] No console errors
- [ ] Mobile responsiveness tested
- [ ] Performance acceptable (< 2s initial load)
- [ ] Backup data files

---

## Monitoring in Production

### Browser Console Checks

```javascript
// Performance
console.time("Route calc");
findRoute(start, end);
console.timeEnd("Route calc");

// Graph health
console.log("Nodes:", streetGraph.nodes.size);
console.log("Edges:", countEdges());
console.log("Isolated nodes:", findIsolatedNodes().length);

// GPS
console.log("Last position:", getUserLocation());
console.log("Watch active:", watchId !== null);
```

### Common Issues

| Issue             | Cause                       | Solution                 |
| ----------------- | --------------------------- | ------------------------ |
| Routes not found  | Disconnected street network | Reduce CONNECT_TOLERANCE |
| GPS not working   | Https required              | Enable HTTPS             |
| Slow routing      | Graph too large             | Increase tolerances      |
| Tiles not loading | API key invalid             | Check Stadia Maps key    |

---

## Version History & Roadmap

### Current (v1.0)

- Basic navigation
- GPS tracking
- POI search
- Dijkstra routing

### Planned (v1.1)

- Waypoints support
- Offline tile caching
- Favorites system
- Time estimates

### Future (v2.0)

- Multiple cities
- A\* algorithm
- Real-time traffic
- Multilingual UI

---

**Last Updated**: February 2025  
**Author**: Mohammed Belfellah  
**License**: MIT

