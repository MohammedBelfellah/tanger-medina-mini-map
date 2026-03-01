/**
 * Data loader for Tanger Medina Mini-Map
 */

async function fetchGeoJSON(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return await res.json();
}

async function loadMedinaBoundary() {
  try {
    const geojsonData = await fetchGeoJSON("data/medina_boundary.geojson");
    renderMedinaBoundary(geojsonData);
  } catch (error) {
    console.error("Error loading medina boundary:", error);
  }
}

async function loadMedinaStreets() {
  try {
    const geojsonData = await fetchGeoJSON("data/medina_streets.geojson");
    renderMedinaStreets(geojsonData);

    // For routing module (when ready)
    if (typeof setStreetsData === "function") setStreetsData(geojsonData);
  } catch (error) {
    console.error("Error loading medina streets:", error);
  }
}

async function loadPOIs() {
  try {
    const geojsonData = await fetchGeoJSON("data/pois.geojson");
    renderPOIs(geojsonData);

    // For search module (when ready)
    if (typeof setPOIsData === "function") setPOIsData(geojsonData);
  } catch (error) {
    console.error("Error loading POIs:", error);
  }
}