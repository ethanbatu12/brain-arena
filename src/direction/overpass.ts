/**
 * Fetches real-world map features near a location from the free, keyless
 * Overpass API (OpenStreetMap data) — no Google Maps, no paid services,
 * no API key. Query building + response parsing are pure and unit-tested;
 * only fetchNearbyFeatures itself touches the network.
 */
import { OVERPASS_URLS, SEARCH_RADIUS_M } from "./constants";
import type { Coords, FeatureKind, MapFeature } from "./types";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

/** Builds an Overpass QL query for roads, landmarks, parks, schools, and shops near a point. */
export function buildOverpassQuery(origin: Coords, radiusM: number = SEARCH_RADIUS_M): string {
  const around = `around:${radiusM},${origin.lat},${origin.lon}`;
  return `[out:json][timeout:25];(
    way["highway"]["name"](${around});
    node["amenity"]["name"](${around});
    node["shop"]["name"](${around});
    node["leisure"="park"]["name"](${around});
    node["tourism"]["name"](${around});
  );out center tags;`;
}

function classifyKind(tags: Record<string, string>): FeatureKind {
  if (tags.highway) return "road";
  if (tags.amenity === "school") return "school";
  if (tags.leisure === "park") return "park";
  if (tags.shop) return "business";
  return "landmark";
}

/** Converts raw Overpass elements into deduplicated, named MapFeatures. */
export function parseOverpassElements(elements: OverpassElement[]): MapFeature[] {
  const seen = new Set<string>();
  const features: MapFeature[] = [];

  for (const el of elements) {
    const name = el.tags?.name;
    if (!name) continue;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    const key = `${name}|${lat.toFixed(5)}|${lon.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    features.push({
      id: `${el.type}/${el.id}`,
      name,
      kind: classifyKind(el.tags ?? {}),
      lat,
      lon,
    });
  }

  return features;
}

/**
 * Fetches and parses nearby map features for `origin`, trying each mirror in
 * OVERPASS_URLS in turn. Throws only if every mirror fails — callers should
 * catch this to distinguish "the request failed" from "it succeeded but
 * found nothing nearby", which need very different error messages.
 */
export async function fetchNearbyFeatures(origin: Coords, radiusM: number = SEARCH_RADIUS_M): Promise<MapFeature[]> {
  const query = buildOverpassQuery(origin, radiusM);
  let lastError: unknown = null;

  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
      });
      if (!res.ok) {
        lastError = new Error(`Overpass request to ${url} failed with status ${res.status}`);
        continue;
      }
      const data = (await res.json()) as OverpassResponse;
      return parseOverpassElements(data.elements ?? []);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("All Overpass mirrors failed");
}
