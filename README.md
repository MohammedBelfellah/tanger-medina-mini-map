# Tanger Medina Mini-Map

Interactive offline GPS navigation system for the Old Medina of Tangier, Morocco.

---

## Quick Start

### Run the Application

```bash
# Option 1: Open directly in browser
Open index.html

# Option 2: Run with Python server
python -m http.server 5500
# Visit: http://localhost:5500
```

### View Documentation

**All documentation is in `/documentation` folder**

**Online documentation:** https://tanger-medina-mini-map-documentation.netlify.app/

```bash
# Open documentation viewer
Open documentation/index.html in browser
```

**4 Documentation Guides:**

1. **GETTING STARTED** - Quick overview
2. **DOCUMENTATION** - Complete technical guide
3. **MODIFICATION GUIDE** - How to add features
4. **API REFERENCE** - Function documentation

---

## Features

- Interactive map with street network
- Real-time GPS tracking
- Turn-by-turn pedestrian navigation
- Full-text search for gates & POI
- Offline routing (no server needed)
- Mobile-friendly responsive design
- Dead-end detection

---

## Project Structure

```
tanger-medina-mini-map/
├── index.html                 # Main application
├── README.md                  # This file
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── map.js
│   ├── data.js
│   ├── navigation.js
│   ├── gps-simulator.js
│   └── modules/
│       ├── search.js
│       ├── routing.js
│       ├── location.js
│       └── ui.js
├── data/
│   ├── medina_streets.geojson
│   ├── medina_boundary.geojson
│   ├── pois.geojson
│   └── map_beni-ider.geojson
├── assets/
│   ├── icons/
│   └── images/
└── documentation/             ← ALL DOCS HERE
    ├── index.html             ← OPEN THIS TO READ
    ├── START_HERE.md
    ├── DOCUMENTATION.md
    ├── MODIFICATION_GUIDE.md
    └── API_REFERENCE.md
```

---

## How to Use

1. Click **Locate** button to find your position
2. Search for destination (e.g., "Bab Kasbah")
3. Click result to select destination
4. Click **Start Navigation** to begin
5. Follow purple route on map
6. Get notification when you arrive

---

## For Development

**See `/documentation/index.html` for complete guides:**

- How to modify the app
- All available functions
- Architecture overview
- Step-by-step tutorials

---

## Technologies

- Leaflet.js (mapping)
- Dijkstra's Algorithm (routing)
- HTML5 Geolocation (GPS)
- GeoJSON (data format)
- Pure JavaScript (no frameworks)

---

## License

MIT
