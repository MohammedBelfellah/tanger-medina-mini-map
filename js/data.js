// Data management

const data = {
  medinaData: null,
  poisData: null,
  streetsData: null,
};

async function loadMedianaBoundary() {
  try {
    const response = await fetch("data/medina_boundary.geojson");
    data.medinaData = await response.json();
    console.log("Medina boundary loaded", data.medinaData);
    // Render the boundary on the map
    renderMedianaBoundary(data.medinaData);
  } catch (error) {
    console.error("Error loading medina boundary:", error);
  }
}

async function loadPOIs() {
  try {
    const response = await fetch("data/pois.geojson");
    data.poisData = await response.json();
    console.log("POIs loaded", data.poisData);
  } catch (error) {
    console.error("Error loading POIs:", error);
  }
}

async function loadStreets() {
  try {
    const response = await fetch("data/streets.geojson");
    data.streetsData = await response.json();
    console.log("Streets loaded", data.streetsData);
    // Render the streets on the map
    renderStreets(data.streetsData);
  } catch (error) {
    console.error("Error loading streets:", error);
  }
}
