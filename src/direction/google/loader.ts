import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { GOOGLE_MAPS_API_KEY, isGoogleMapsConfigured } from "./constants";

let configured = false;
let loadPromise: Promise<typeof google> | null = null;

const LOAD_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Loads the Google Maps JavaScript SDK exactly once and caches the promise.
 * Using the SDK's own client classes (Geocoder, DirectionsService,
 * PlacesService, Map) avoids CORS entirely — unlike raw REST fetch calls to
 * Google's web service endpoints, the SDK handles its own transport.
 *
 * Google's loader has a quirk: on an invalid/misconfigured key (bad
 * restriction, billing not enabled, etc.) it does NOT reject the loading
 * promise — it calls a global `gm_authFailure()` callback instead, which
 * would otherwise hang the returned promise forever. This wires that
 * callback to a real rejection, plus a hard timeout as a backstop.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (!isGoogleMapsConfigured()) {
    return Promise.reject(
      new Error("Google Maps isn't configured (missing VITE_GOOGLE_MAPS_API_KEY). Set it in your deployment's environment variables."),
    );
  }

  if (!loadPromise) {
    if (!configured) {
      setOptions({ key: GOOGLE_MAPS_API_KEY, v: "weekly" });
      configured = true;
    }

    const authFailure = new Promise<never>((_, reject) => {
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
        reject(
          new Error(
            "Google Maps rejected the API key. Check that billing is enabled, the key isn't restricted to the wrong domain, and Maps JavaScript API / Places API / Geocoding API / Directions API are all enabled.",
          ),
        );
      };
    });

    const librariesLoaded = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
      importLibrary("geocoding"),
      importLibrary("routes"),
    ]).then(() => google);

    loadPromise = withTimeout(
      Promise.race([librariesLoaded, authFailure]),
      LOAD_TIMEOUT_MS,
      "Timed out loading Google Maps. Check your internet connection and API key configuration.",
    );

    // Don't cache a failed load forever — let the next attempt try again.
    loadPromise.catch(() => {
      loadPromise = null;
    });
  }

  return loadPromise;
}
