/** Address -> coordinates via the Google Maps JavaScript SDK's Geocoder (no CORS, no raw fetch). */
import { loadGoogleMaps } from "./loader";
import type { Coords } from "../types";

export async function geocodeAddressGoogle(address: string): Promise<Coords | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  try {
    const g = await loadGoogleMaps();
    const geocoder = new g.maps.Geocoder();
    const response = await geocoder.geocode({ address: trimmed });
    const first = response.results[0];
    if (!first) return null;
    return { lat: first.geometry.location.lat(), lon: first.geometry.location.lng() };
  } catch {
    return null;
  }
}
