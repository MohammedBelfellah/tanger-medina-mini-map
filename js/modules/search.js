let poisData = [];

/**
 * Initialize search functionality
 */
function initSearch() {
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const clearSearch = document.getElementById("clear-search");

  if (!searchInput || !searchResults || !clearSearch) return;

  searchInput.addEventListener("input", handleSearch);

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length > 0) {
      searchResults.classList.remove("hidden");
    }
  });

  clearSearch.addEventListener("click", clearSearchInput);

  // Close results when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#search-panel")) {
      searchResults.classList.add("hidden");
    }
  });
}

function safeLower(x) {
  return String(x ?? "").toLowerCase();
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPoiName(props) {
  return (
    props.name ||
    props["name:fr"] ||
    props["name:en"] ||
    props["name:ar"] ||
    "Unnamed place"
  );
}

function getPoiTypeRaw(props) {
  return (
    props.type ||
    props.amenity ||
    props.tourism ||
    props.historic ||
    props.category ||
    "poi"
  );
}

// Human labels
function getPoiTypeLabel(typeRaw) {
  const t = safeLower(typeRaw);

  const labelMap = {
    cafe: "Café",
    restaurant: "Restaurant",
    place_of_worship: "Mosque / Worship",
    worship: "Mosque / Worship",
    museum: "Museum",
    monument: "Monument",
    viewpoint: "Viewpoint",
    attraction: "Monument",
    gallery: "Museum",
    information: "Information",
    hotel: "Hotel",
    hostel: "Hostel",
    guest_house: "Guest House",
    riad: "Riad",
  };

  return labelMap[t] || typeRaw || "POI";
}

/**
 * Handle search input changes
 */
function handleSearch(e) {
  const query = safeLower(e.target.value).trim();
  const searchResults = document.getElementById("search-results");
  const clearSearch = document.getElementById("clear-search");

  if (!searchResults || !clearSearch) return;

  if (query.length === 0) {
    searchResults.classList.add("hidden");
    clearSearch.classList.add("hidden");
    return;
  }

  clearSearch.classList.remove("hidden");

  const results = filterPOIs(query);
  displaySearchResults(results);
}

/**
 * Filter POIs by search query
 */
function filterPOIs(query) {
  const q = safeLower(query);
  const out = [];

  for (const poi of poisData) {
    const props = poi?.properties || {};

    const name = safeLower(getPoiName(props));
    const type = safeLower(getPoiTypeRaw(props));
    const desc = safeLower(props.short_description || props.description || "");

    if (name.includes(q) || type.includes(q) || desc.includes(q)) {
      out.push(poi);
    }
  }

  // Sort by name A-Z (stable)
  out.sort((a, b) => {
    const an = safeLower(getPoiName(a?.properties || {}));
    const bn = safeLower(getPoiName(b?.properties || {}));
    return an.localeCompare(bn);
  });

  return out.slice(0, 30);
}

/**
 * Display search results
 */
function displaySearchResults(results) {
  const searchResults = document.getElementById("search-results");
  if (!searchResults) return;

  if (!results || results.length === 0) {
    searchResults.innerHTML =
      '<div class="search-result-item"><span class="name">No results found</span></div>';
    searchResults.classList.remove("hidden");
    return;
  }

  searchResults.innerHTML = results
    .map((poi) => {
      const props = poi?.properties || {};

      const name = getPoiName(props);
      const typeRaw = getPoiTypeRaw(props);
      const typeLabel = getPoiTypeLabel(typeRaw);
      const desc = props.short_description || props.description || "";

      const lng = poi?.geometry?.coordinates?.[0];
      const lat = poi?.geometry?.coordinates?.[1];

      // If coordinates missing, skip it (avoid broken click)
      if (typeof lat !== "number" || typeof lng !== "number") return "";

      return `
        <div class="search-result-item"
             data-lng="${lng}"
             data-lat="${lat}"
             data-name="${escapeHtml(name)}">
          <div class="name">${escapeHtml(name)}</div>
          <div class="type"><i class="fas fa-location-dot"></i> ${escapeHtml(typeLabel)}</div>
          ${desc ? `<div class="desc">${escapeHtml(desc)}</div>` : ""}
        </div>
      `;
    })
    .join("");

  searchResults.classList.remove("hidden");

  searchResults.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (typeof selectDestination === "function") selectDestination(item);
    });
  });
}

/**
 * Clear search input and results
 */
function clearSearchInput() {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  const clearBtn = document.getElementById("clear-search");

  if (input) input.value = "";
  if (results) results.classList.add("hidden");
  if (clearBtn) clearBtn.classList.add("hidden");

  if (typeof clearDestinationMarker === "function") clearDestinationMarker();
}

/**
 * Set POIs data (called from data.js)
 */
function setPOIsData(data) {
  poisData = Array.isArray(data?.features) ? data.features : [];
}