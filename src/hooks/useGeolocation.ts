import { useCallback } from "react";
import type { Coords } from "../direction/types";

/**
 * Thin promise-based wrapper around the browser Geolocation API. Kept tiny
 * and side-effect free besides the actual browser call, so callers can mock
 * `navigator.geolocation` directly in tests without needing this hook at all.
 */
export function useGeolocation() {
  const getCurrentPosition = useCallback((): Promise<Coords> => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(new Error(err.message || "Location access was denied.")),
        {
          // Precise GPS accuracy matters for questions that depend on the
          // exact route/position (e.g. traffic-light counts to a nearby
          // place), so this trades speed for a real GPS fix instead of a
          // faster but coarser network-based estimate.
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 60_000,
        },
      );
    });
  }, []);

  return { getCurrentPosition };
}
