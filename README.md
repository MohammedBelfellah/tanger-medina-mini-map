# Tanger Medina Mini-Map

An interactive navigation map for the Old Medina of Tangier, Morocco. Built with Leaflet.js for offline-first pedestrian navigation through the historic streets.

## Features

- Interactive map with Stamen Toner Lite basemap
- Custom street network for the medina
- Turn-by-turn pedestrian navigation
- Real-time GPS tracking
- Search for gates (Bab) and points of interest
- Offline routing using Dijkstra's algorithm
- Dead-end street detection (orange dashed lines)
- Arrival detection with notifications

## How to Use

1. Open `index.html` in a browser
2. Click the **Locate** button to find your position
3. Search for a destination (e.g., "Bab Kasbah")
4. Click on a result to select it
5. Click **Start Navigation** to begin
6. Follow the purple route to your destination

## Project Structure

```
tanger-medina-mini-map/
├── index.html              # Main entry point
├── css/
│   └── style.css           # UI styling
├── js/
│   ├── app.js              # Application entry
│   ├── map.js              # Map initialization and rendering
│   ├── data.js             # GeoJSON data loading
│   ├── navigation.js       # Main navigation controller
│   ├── gps-simulator.js    # GPS simulation for testing
│   └── modules/
│       ├── search.js       # POI search functionality
│       ├── routing.js      # Dijkstra pathfinding algorithm
│       ├── location.js     # GPS and user location
│       └── ui.js           # Markers and route display
├── data/
│   ├── medina_boundary.geojson   # Medina polygon
│   ├── medina_streets.geojson    # Street network
│   └── pois.geojson              # Points of interest
└── assets/                 # Images and icons
```

## Module Overview

| Module          | Purpose                                |
| --------------- | -------------------------------------- |
| `search.js`     | POI search, filtering, results display |
| `routing.js`    | Graph building, Dijkstra algorithm     |
| `location.js`   | GPS tracking, user position            |
| `ui.js`         | Map markers, route drawing             |
| `navigation.js` | Coordinates all modules                |

## Technologies

- **Leaflet.js** - Interactive maps
- **Stadia Maps** - Stamen Toner Lite tiles
- **GeoJSON** - Geographic data format
- **Dijkstra's Algorithm** - Pathfinding on street network

## Testing Navigation

Open browser console (F12) and use these commands:

```javascript
startSimulation(); // Walk along the route
stopSimulation(); // Stop walking
setSimulationSpeed(500); // Faster walking
teleportTo(lat, lng); // Jump to location
nudge(0.0001, 0); // Move north
```

## Author

Mohammed Belfellah

## License

MIT
