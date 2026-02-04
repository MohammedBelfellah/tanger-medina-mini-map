/**
 * Tanger Medina Mini-Map
 * Navigation and Search module
 * Author: Mohammed Belfellah
 */

let userLocation = null;
let userMarker = null;
let destinationMarker = null;
let routeLayer = null;
let poisData = [];
let streetsData = null;
let streetGraph = null;

/**
 * Initialize navigation and search features
 */
function initNavigation() {
  // DOM Elements
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const clearSearch = document.getElementById("clear-search");
  const navPanel = document.getElementById("nav-panel");
  const closeNav = document.getElementById("close-nav");
  const startNav = document.getElementById("start-nav");
  const cancelNav = document.getElementById("cancel-nav");
  const locateBtn = document.getElementById("locate-btn");

  // Search functionality
  searchInput.addEventListener("input", handleSearch);
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.length > 0) {
      searchResults.classList.remove("hidden");
    }
  });

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchResults.classList.add("hidden");
    clearSearch.classList.add("hidden");
    clearDestination();
  });

  // Navigation panel
  closeNav.addEventListener("click", closeNavPanel);
  cancelNav.addEventListener("click", cancelNavigation);
  startNav.addEventListener("click", startNavigation);

  // Locate button
  locateBtn.addEventListener("click", locateUser);

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#search-panel")) {
      searchResults.classList.add("hidden");
    }
  });
}

/**
 * Handle search input
 */
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const searchResults = document.getElementById("search-results");
  const clearSearch = document.getElementById("clear-search");

  if (query.length === 0) {
    searchResults.classList.add("hidden");
    clearSearch.classList.add("hidden");
    return;
  }

  clearSearch.classList.remove("hidden");

  // Filter POIs based on search query
  const results = poisData.filter(
    (poi) =>
      poi.properties.name.toLowerCase().includes(query) ||
      poi.properties.type.toLowerCase().includes(query) ||
      poi.properties.short_description.toLowerCase().includes(query),
  );

  displaySearchResults(results);
}

/**
 * Display search results
 */
function displaySearchResults(results) {
  const searchResults = document.getElementById("search-results");

  if (results.length === 0) {
    searchResults.innerHTML =
      '<div class="search-result-item"><span class="name">No results found</span></div>';
    searchResults.classList.remove("hidden");
    return;
  }

  searchResults.innerHTML = results
    .map(
      (poi) => `
    <div class="search-result-item" data-lng="${poi.geometry.coordinates[0]}" data-lat="${poi.geometry.coordinates[1]}" data-name="${poi.properties.name}">
      <div class="name">${poi.properties.name}</div>
      <div class="type"><i class="fas fa-door-open"></i> ${poi.properties.type}</div>
      <div class="desc">${poi.properties.short_description}</div>
    </div>
  `,
    )
    .join("");

  searchResults.classList.remove("hidden");

  // Add click handlers to results
  searchResults.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", () => selectDestination(item));
  });
}

/**
 * Select a destination from search results
 */
function selectDestination(item) {
  const lat = parseFloat(item.dataset.lat);
  const lng = parseFloat(item.dataset.lng);
  const name = item.dataset.name;

  // Update search input
  document.getElementById("search-input").value = name;
  document.getElementById("search-results").classList.add("hidden");

  // Clear previous destination marker
  if (destinationMarker) {
    map.removeLayer(destinationMarker);
  }

  // Add destination marker
  destinationMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: "destination-marker",
      html: '<i class="fas fa-flag-checkered" style="color: #e74c3c; font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);"></i>',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    }),
  }).addTo(map);

  // Pan to destination
  map.setView([lat, lng], 17);

  // Show navigation panel
  showNavPanel(name, lat, lng);
}

/**
 * Show navigation panel
 */
function showNavPanel(name, lat, lng) {
  const navPanel = document.getElementById("nav-panel");
  document.getElementById("nav-destination-name").textContent = name;

  // Calculate distance if user location is available
  if (userLocation) {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      lat,
      lng,
    );
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
 * Start navigation using custom streets
 */
function startNavigation() {
  const navPanel = document.getElementById("nav-panel");
  const destLat = parseFloat(navPanel.dataset.lat);
  const destLng = parseFloat(navPanel.dataset.lng);

  if (!userLocation) {
    alert("Please enable location to start navigation.");
    locateUser();
    return;
  }

  if (!streetsData) {
    alert("Streets data not loaded yet. Please wait.");
    return;
  }

  // Clear existing route
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  // Find route using our custom streets
  const route = findRouteOnStreets(
    [userLocation.lng, userLocation.lat],
    [destLng, destLat],
  );

  if (route && route.length > 0) {
    // Draw the route on the map
    routeLayer = L.polyline(
      route.map((coord) => [coord[1], coord[0]]),
      {
        color: "#8e44ad",
        weight: 6,
        opacity: 0.8,
      },
    ).addTo(map);

    // Add a slightly lighter line on top for effect
    L.polyline(
      route.map((coord) => [coord[1], coord[0]]),
      {
        color: "#a855f7",
        weight: 4,
        opacity: 1,
      },
    ).addTo(map);

    // Fit map to show the route
    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

    // Update button
    document.getElementById("start-nav").innerHTML =
      '<i class="fas fa-check"></i> Route Found!';
  } else {
    alert("Could not find a route. Try a destination closer to the streets.");
    document.getElementById("start-nav").innerHTML =
      '<i class="fas fa-play"></i> Start Navigation';
  }
}

/**
 * Build a graph from the streets GeoJSON for pathfinding
 */
function buildStreetGraph() {
  if (!streetsData) return;

  streetGraph = {
    nodes: new Map(), // coordinate string -> { coord, edges }
  };

  // Larger tolerance for connecting nearby points (~15 meters)
  const connectTolerance = 0.00015;

  const coordKey = (coord) => `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;

  // Helper to find if a nearby node already exists
  const findNearbyNode = (coord) => {
    let nearest = null;
    let minDist = connectTolerance;
    streetGraph.nodes.forEach((node, key) => {
      const dist = Math.sqrt(
        Math.pow(node.coord[0] - coord[0], 2) +
          Math.pow(node.coord[1] - coord[1], 2),
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = key;
      }
    });
    return nearest;
  };

  // First pass: collect all unique nodes, merging nearby points
  streetsData.features.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    coords.forEach((coord) => {
      const existingKey = findNearbyNode(coord);
      if (!existingKey) {
        const key = coordKey(coord);
        if (!streetGraph.nodes.has(key)) {
          streetGraph.nodes.set(key, {
            coord: coord,
            edges: [],
          });
        }
      }
    });
  });

  // Helper to get the key for a coordinate (finds nearest existing node)
  const getNodeKey = (coord) => {
    const directKey = coordKey(coord);
    if (streetGraph.nodes.has(directKey)) return directKey;

    // Find nearest node within tolerance
    let nearest = null;
    let minDist = connectTolerance * 2; // Slightly larger for matching
    streetGraph.nodes.forEach((node, key) => {
      const dist = Math.sqrt(
        Math.pow(node.coord[0] - coord[0], 2) +
          Math.pow(node.coord[1] - coord[1], 2),
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = key;
      }
    });
    return nearest;
  };

  // Second pass: build edges between consecutive points in each street
  streetsData.features.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
      const fromKey = getNodeKey(coords[i]);
      const toKey = getNodeKey(coords[i + 1]);

      if (fromKey && toKey && fromKey !== toKey) {
        const dist = getDistance(
          streetGraph.nodes.get(fromKey).coord,
          streetGraph.nodes.get(toKey).coord,
        );

        // Add bidirectional edges (avoid duplicates)
        const fromNode = streetGraph.nodes.get(fromKey);
        const toNode = streetGraph.nodes.get(toKey);

        if (!fromNode.edges.some((e) => e.to === toKey)) {
          fromNode.edges.push({ to: toKey, distance: dist });
        }
        if (!toNode.edges.some((e) => e.to === fromKey)) {
          toNode.edges.push({ to: fromKey, distance: dist });
        }
      }
    }
  });

  // Third pass: Connect nearby nodes that aren't connected yet (within ~20m)
  const autoConnectDist = 0.0002; // ~20 meters
  const nodesArray = Array.from(streetGraph.nodes.entries());

  for (let i = 0; i < nodesArray.length; i++) {
    for (let j = i + 1; j < nodesArray.length; j++) {
      const [keyA, nodeA] = nodesArray[i];
      const [keyB, nodeB] = nodesArray[j];

      const dist = Math.sqrt(
        Math.pow(nodeA.coord[0] - nodeB.coord[0], 2) +
          Math.pow(nodeA.coord[1] - nodeB.coord[1], 2),
      );

      // If nodes are close but not connected, connect them
      if (dist < autoConnectDist) {
        const realDist = getDistance(nodeA.coord, nodeB.coord);

        if (!nodeA.edges.some((e) => e.to === keyB)) {
          nodeA.edges.push({ to: keyB, distance: realDist });
        }
        if (!nodeB.edges.some((e) => e.to === keyA)) {
          nodeB.edges.push({ to: keyA, distance: realDist });
        }
      }
    }
  }

  // Log graph info
  let totalEdges = 0;
  streetGraph.nodes.forEach((node) => (totalEdges += node.edges.length));
  console.log(
    `Street graph built: ${streetGraph.nodes.size} nodes, ${totalEdges / 2} edges`,
  );
}

/**
 * Find the nearest node in the graph to a given coordinate
 */
function findNearestNode(coord) {
  let nearest = null;
  let minDist = Infinity;

  streetGraph.nodes.forEach((node, key) => {
    const dist = getDistance(coord, node.coord);
    if (dist < minDist) {
      minDist = dist;
      nearest = key;
    }
  });

  console.log(
    `Nearest node to [${coord}]: ${nearest}, distance: ${minDist.toFixed(1)}m`,
  );
  return nearest;
}

/**
 * Find route using Dijkstra's algorithm on our street network
 */
function findRouteOnStreets(startCoord, endCoord) {
  if (!streetGraph || streetGraph.nodes.size === 0) {
    buildStreetGraph();
  }

  const startNode = findNearestNode(startCoord);
  const endNode = findNearestNode(endCoord);

  console.log(`Finding route from ${startNode} to ${endNode}`);

  if (!startNode || !endNode) {
    console.log("Could not find start or end node");
    return null;
  }

  if (startNode === endNode) {
    console.log("Start and end are the same node");
    return [startCoord, endCoord];
  }

  // Dijkstra's algorithm with priority (using simple array)
  const distances = new Map();
  const previous = new Map();
  const visited = new Set();

  streetGraph.nodes.forEach((_, key) => {
    distances.set(key, Infinity);
  });
  distances.set(startNode, 0);

  while (true) {
    // Find unvisited node with smallest distance
    let current = null;
    let minDist = Infinity;

    distances.forEach((dist, key) => {
      if (!visited.has(key) && dist < minDist) {
        minDist = dist;
        current = key;
      }
    });

    if (current === null) {
      console.log("No path found - graph might be disconnected");
      break;
    }

    if (current === endNode) {
      console.log("Reached destination!");
      break;
    }

    visited.add(current);

    // Update distances to neighbors
    const currentNode = streetGraph.nodes.get(current);
    if (currentNode && currentNode.edges) {
      currentNode.edges.forEach((edge) => {
        if (!visited.has(edge.to)) {
          const newDist = distances.get(current) + edge.distance;
          if (newDist < distances.get(edge.to)) {
            distances.set(edge.to, newDist);
            previous.set(edge.to, current);
          }
        }
      });
    }
  }

  // Check if we reached the destination
  if (!previous.has(endNode) && startNode !== endNode) {
    console.log("No path exists between start and end");
    return null;
  }

  // Reconstruct path
  const path = [];
  let current = endNode;

  while (current) {
    const node = streetGraph.nodes.get(current);
    if (node) {
      path.unshift(node.coord);
    }
    current = previous.get(current);
  }

  // Add start and end exact coordinates
  if (path.length > 0) {
    path.unshift(startCoord); // User's actual position
    path.push(endCoord); // Destination exact position
  }

  console.log(`Route found with ${path.length} points`);
  return path.length >= 2 ? path : null;
}

/**
 * Calculate distance between two coordinates in meters
 */
function getDistance(coord1, coord2) {
  const R = 6371000;
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLng = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[1] * Math.PI) / 180) *
      Math.cos((coord2[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Set streets data for routing (called from data.js)
 */
function setStreetsData(data) {
  streetsData = data;
  buildStreetGraph();
}

/**
 * Cancel navigation
 */
function cancelNavigation() {
  // Clear route layer
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }

  // Clear any route polylines
  map.eachLayer((layer) => {
    if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
      // Check if it's a route (purple color)
      if (
        layer.options &&
        (layer.options.color === "#8e44ad" || layer.options.color === "#a855f7")
      ) {
        map.removeLayer(layer);
      }
    }
  });

  clearDestination();
  closeNavPanel();

  document.getElementById("start-nav").innerHTML =
    '<i class="fas fa-play"></i> Start Navigation';
}

/**
 * Clear destination marker
 */
function clearDestination() {
  if (destinationMarker) {
    map.removeLayer(destinationMarker);
    destinationMarker = null;
  }
}

/**
 * Locate user using GPS (TEST MODE: using fixed location)
 */
function locateUser() {
  const locateBtn = document.getElementById("locate-btn");
  locateBtn.classList.add("locating");

  // TEST MODE: Use fixed starting point for testing
  // Remove this and uncomment the geolocation code below for production
  userLocation = {
    lat: 35.786074393894,
    lng: -5.811693364685466,
  };

  // Clear previous user marker
  if (userMarker) {
    map.removeLayer(userMarker);
  }

  // Add user marker
  userMarker = L.marker([userLocation.lat, userLocation.lng], {
    icon: L.divIcon({
      className: "user-marker",
      html: '<div style="width: 20px; height: 20px; background: #3498db; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    }),
  })
    .addTo(map)
    .bindPopup("You are here! (Test location)")
    .openPopup();

  // Pan to user location
  map.setView([userLocation.lat, userLocation.lng], 17);

  locateBtn.classList.remove("locating");

  // Update distance if destination is set
  const navPanel = document.getElementById("nav-panel");
  if (!navPanel.classList.contains("hidden")) {
    const destLat = parseFloat(navPanel.dataset.lat);
    const destLng = parseFloat(navPanel.dataset.lng);
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      destLat,
      destLng,
    );
    document.getElementById("nav-distance-value").textContent =
      formatDistance(distance);
  }

  /* PRODUCTION MODE: Uncomment this block and remove the test code above
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    locateBtn.classList.remove("locating");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      // ... rest of the geolocation code
    },
    (error) => {
      // ... error handling
    }
  );
  */
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
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

/**
 * Set POIs data for search (called from data.js)
 */
function setPOIsData(data) {
  poisData = data.features;
}
