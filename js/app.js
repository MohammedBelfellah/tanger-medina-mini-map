document.addEventListener("DOMContentLoaded", () => {
  try {
    initializeMap();
  } catch (err) {
    console.error("❌ Map initialization failed:", err);
  }

  try {
    if (typeof initNavigation === "function") initNavigation();
  } catch (err) {
    console.error("❌ Navigation init failed:", err);
  }
});