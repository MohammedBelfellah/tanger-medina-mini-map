/**
 * utils.js
 * Shared helpers for Tanger Medina Mini-Map
 */

(function () {
  // Prevent double-load
  if (window.__TM_UTILS_LOADED) return;
  window.__TM_UTILS_LOADED = true;

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function pickName(props) {
    return (
      props?.name ||
      props?.["name:fr"] ||
      props?.["name:en"] ||
      props?.["name:ar"] ||
      props?.["name:es"] ||
      "Unnamed place"
    );
  }

  /**
   * Map raw OSM tags -> our 6 UI categories (same as legend)
   */
  function getPOICategoryKey(props) {
    const amenity = props?.amenity;
    const tourism = props?.tourism;
    const historic = props?.historic;

    if (amenity === "cafe") return "cafe";
    if (amenity === "restaurant") return "restaurant";

    // worship
    if (amenity === "place_of_worship") return "worship";

    // museum / viewpoint
    if (tourism === "museum") return "museum";
    if (tourism === "viewpoint") return "viewpoint";

    // monuments
    if (historic === "monument") return "monument";
    // some POIs: tourism=attraction + historic tag -> treat as monument-ish
    if (tourism === "attraction" && historic) return "monument";

    return null; // not part of our tourist legend
  }

  function categoryLabel(key) {
    const labelMap = {
      cafe: "Café",
      restaurant: "Restaurant",
      worship: "Mosque / Worship",
      museum: "Museum",
      monument: "Monument",
      viewpoint: "Viewpoint",
    };
    return labelMap[key] || "POI";
  }

  /**
   * Build a lightweight description string for search (optional)
   */
  function buildPOIDescription(props) {
    const parts = [];
    if (props?.cuisine) parts.push(`Cuisine: ${props.cuisine}`);
    if (props?.religion) parts.push(`Religion: ${props.religion}`);
    if (props?.opening_hours) parts.push(`Hours: ${props.opening_hours}`);
    return parts.join(" • ");
  }

  /**
   * Normalize a GeoJSON feature to what our UI needs
   */
  function normalizePOIFeature(feature) {
    const props = feature?.properties || {};
    const geom = feature?.geometry;

    if (!geom || geom.type !== "Point" || !Array.isArray(geom.coordinates)) {
      return null;
    }

    const [lng, lat] = geom.coordinates;
    if (typeof lat !== "number" || typeof lng !== "number") return null;

    const key = getPOICategoryKey(props);
    if (!key) return null;

    const name = pickName(props);
    const desc = buildPOIDescription(props);

    const id = props["@id"] || `${name}_${lat}_${lng}`;

    return {
      id,
      lat,
      lng,
      name,
      key,
      label: categoryLabel(key),
      desc,
      props,
    };
  }

  // Expose globally (simple for your current architecture)
  window.TMUtils = {
    escapeHtml,
    getPOICategoryKey,
    categoryLabel,
    normalizePOIFeature,
  };
})();