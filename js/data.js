/**
 * Tanger Medina Mini-Map
 * Data loading module
 * Author: Mohammed Belfellah
 */

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
