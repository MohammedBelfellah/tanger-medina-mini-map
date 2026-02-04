/**
 * Search Module
 * Handles POI search functionality
 * Author: Mohammed Belfellah
 */

let poisData = [];

/**
 * Initialize search functionality
 */
function initSearch() {
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const clearSearch = document.getElementById("clear-search");

  searchInput.addEventListener("input", handleSearch);

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.length > 0) {
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

/**
 * Handle search input changes
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

  const results = filterPOIs(query);
  displaySearchResults(results);
}

/**
 * Filter POIs by search query
 */
function filterPOIs(query) {
  return poisData.filter(
    (poi) =>
      poi.properties.name.toLowerCase().includes(query) ||
      poi.properties.type.toLowerCase().includes(query) ||
      poi.properties.short_description.toLowerCase().includes(query),
  );
}

/**
 * Display search results in dropdown
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
    <div class="search-result-item" 
         data-lng="${poi.geometry.coordinates[0]}" 
         data-lat="${poi.geometry.coordinates[1]}" 
         data-name="${poi.properties.name}">
      <div class="name">${poi.properties.name}</div>
      <div class="type"><i class="fas fa-door-open"></i> ${poi.properties.type}</div>
      <div class="desc">${poi.properties.short_description}</div>
    </div>
  `,
    )
    .join("");

  searchResults.classList.remove("hidden");

  // Add click handlers
  searchResults.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", () => selectDestination(item));
  });
}

/**
 * Clear search input and results
 */
function clearSearchInput() {
  document.getElementById("search-input").value = "";
  document.getElementById("search-results").classList.add("hidden");
  document.getElementById("clear-search").classList.add("hidden");
  clearDestinationMarker();
}

/**
 * Set POIs data (called from data.js)
 */
function setPOIsData(data) {
  poisData = data.features;
}
