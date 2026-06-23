/**
 * Nearby roads/landmarks/parks/schools/businesses via the Google Places
 * JavaScript SDK (legacy PlacesService) — not raw REST fetch, so this never
 * hits browser CORS. The SDK boundary (searchOneType) is impure; parsing
 * raw results into MapFeature[] is pure and unit-tested separately.
 */
import { loadGoogleMaps } from "./loader";
import type { Coords, FeatureKind, MapFeature } from "../types";

const SEARCH_TYPES: { type: string; kind: FeatureKind }[] = [
  { type: "school", kind: "school" },
  { type: "park", kind: "park" },
  { type: "point_of_interest", kind: "landmark" },
  { type: "store", kind: "business" },
];

export interface RawPlaceResult {
  placeId?: string;
  name?: string;
  lat?: number;
  lng?: number;
}

/** Pure: converts raw place results (plain data, no SDK classes) into deduplicated MapFeatures. */
export function parseRawPlaceResults(results: RawPlaceResult[], kind: FeatureKind): MapFeature[] {
  const features: MapFeature[] = [];
  for (const r of results) {
    if (!r.placeId || !r.name || r.lat === undefined || r.lng === undefined) continue;
    features.push({ id: r.placeId, name: r.name, kind, lat: r.lat, lon: r.lng });
  }
  return features;
}

let serviceDiv: HTMLDivElement | null = null;

async function getPlacesService(): Promise<google.maps.places.PlacesService> {
  const g = await loadGoogleMaps();
  if (!serviceDiv) serviceDiv = document.createElement("div");
  return new g.maps.places.PlacesService(serviceDiv);
}

function searchOneType(
  service: google.maps.places.PlacesService,
  origin: Coords,
  radiusM: number,
  type: string,
): Promise<RawPlaceResult[]> {
  return new Promise((resolve) => {
    service.nearbySearch({ location: { lat: origin.lat, lng: origin.lon }, radius: radiusM, type }, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        resolve([]);
        return;
      }
      resolve(
        results.map((r) => ({
          placeId: r.place_id,
          name: r.name,
          lat: r.geometry?.location?.lat(),
          lng: r.geometry?.location?.lng(),
        })),
      );
    });
  });
}

/** Fetches and merges nearby features across several Places categories. Never throws — returns [] on failure. */
export async function fetchNearbyFeaturesGoogle(origin: Coords, radiusM: number): Promise<MapFeature[]> {
  try {
    const service = await getPlacesService();
    const batches = await Promise.all(
      SEARCH_TYPES.map(async ({ type, kind }) => parseRawPlaceResults(await searchOneType(service, origin, radiusM, type), kind)),
    );
    const seen = new Map<string, MapFeature>();
    for (const batch of batches) {
      for (const f of batch) if (!seen.has(f.id)) seen.set(f.id, f);
    }
    return Array.from(seen.values());
  } catch {
    return [];
  }
}
