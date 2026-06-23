/**
 * Address -> coordinates fallback for when GPS is unavailable or denied.
 * Uses Nominatim (OpenStreetMap's free geocoder) — no API key required.
 * Query building and response parsing are pure and unit-tested; only
 * geocodeAddress itself touches the network.
 */
import { NOMINATIM_URL } from "./constants";
import { fetchWithTimeout } from "./fetchWithTimeout";
import type { Coords } from "./types";

export interface NominatimResult {
  lat: string;
  lon: string;
}

export function buildGeocodeUrl(address: string): string {
  const params = new URLSearchParams({ format: "json", q: address, limit: "1" });
  return `${NOMINATIM_URL}?${params.toString()}`;
}

/** Parses the first Nominatim result into Coords, or null if there isn't one. */
export function parseGeocodeResults(results: NominatimResult[]): Coords | null {
  const first = results[0];
  if (!first) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return { lat, lon };
}

/** Looks up coordinates for a free-text address. Returns null on any failure or no match. */
export async function geocodeAddress(address: string): Promise<Coords | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  try {
    const res = await fetchWithTimeout(buildGeocodeUrl(trimmed), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const results = (await res.json()) as NominatimResult[];
    return parseGeocodeResults(results);
  } catch {
    return null;
  }
}
