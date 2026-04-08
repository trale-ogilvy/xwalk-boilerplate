/**
 *
 *
 * @param {string} apiKey
 * @returns {Promise<void>}
 */
function loadGoogleMapsAPI(apiKey) {
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const callbackName = `__googleMapsApiCallback_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    window[callbackName] = () => {
      resolve();
      delete window[callbackName];
    };

    script.onerror = () => {
      reject(new Error("Google Maps API could not be loaded."));
      delete window[callbackName];
    };

    document.head.appendChild(script);
  });
}

/**
 *
 * @param {HTMLElement} mapContainer
 * @param {number} lat
 * @param {number} lng
 * @param {HTMLElement} [iconElement]
 */
export async function initMap(mapContainer, lat, lng, iconElement) {
  const GOOGLE_MAPS_API_KEY = "AIzaSyA_EslpEyHm3dsfjefMNFnPrB1cWWwKbT8";

  try {
    await loadGoogleMapsAPI(GOOGLE_MAPS_API_KEY);

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const position = { lat, lng };

    const map = new Map(mapContainer, {
      zoom: 15,
      center: position,
      mapId: "DEMO_MAP_ID",
      mapTypeId: google.maps.MapTypeId.SATELLITE // Add this line
    });

    const markerOptions = {
      map,
      position,
      title: "Location",
    };

    if (iconElement) {
      iconElement.classList.add("custom-map-marker-icon");
      markerOptions.content = iconElement;
    }

    new AdvancedMarkerElement(markerOptions);
  } catch (error) {
    console.error("Failed to initialize map:", error);
    mapContainer.textContent = "Sorry, the map could not be loaded.";
  }
}
