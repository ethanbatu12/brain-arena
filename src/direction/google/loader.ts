import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { GOOGLE_MAPS_API_KEY } from "./constants";

let configured = false;
let loadPromise: Promise<typeof google> | null = null;

/**
 * Loads the Google Maps JavaScript SDK exactly once and caches the promise.
 * Using the SDK's own client classes (Geocoder, DirectionsService,
 * PlacesService, Map) avoids CORS entirely — unlike raw REST fetch calls to
 * Google's web service endpoints, the SDK handles its own transport.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (!loadPromise) {
    if (!configured) {
      setOptions({ key: GOOGLE_MAPS_API_KEY, v: "weekly" });
      configured = true;
    }
    loadPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
      importLibrary("geocoding"),
      importLibrary("routes"),
    ]).then(() => google);
  }
  return loadPromise;
}
