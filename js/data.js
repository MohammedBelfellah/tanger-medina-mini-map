
/**
 * Load the Old Medina boundary GeoJSON and render it on the map
 */
async function loadMedinaBoundary() {
  try {
    const response = await fetch("data/medina_boundary.geojson");
    const geojsonData = await response.json();
    renderMedinaBoundary(geojsonData);
  } catch (error) {
    console.error("Error loading medina boundary:", error);
  }
}

/**
 * Load the medina streets GeoJSON and render them on the map
 */
async function loadMedinaStreets() {
  try {
    const response = await fetch("data/medina_streets.geojson");
    const geojsonData = await response.json();
    renderMedinaStreets(geojsonData);
    // Pass streets data to navigation module for routing
    setStreetsData(geojsonData);
  } catch (error) {
    console.error("Error loading medina streets:", error);
  }
}

/**
 * Load the POIs GeoJSON and render them on the map
 */
async function loadPOIs() {
  try {
    const response = await fetch("data/pois.geojson");
    const geojsonData = await response.json();
    renderPOIs(geojsonData);
    // Pass POIs data to navigation module for search
    setPOIsData(geojsonData);
  } catch (error) {
    console.error("Error loading POIs:", error);
  }
}
