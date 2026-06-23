/**
 * Nearby roads/landmarks/parks/schools/businesses via the new Places API
 * JS client (google.maps.places.Place.searchNearby) — not raw REST fetch,
 * so this never hits browser CORS. The legacy PlacesService.nearbySearch
 * is not available to Google Cloud projects created after March 2025, so
 * this uses the modern Place class instead. The SDK boundary
 * (searchOneType) is impure; parsing raw results into MapFeature[] is
 * pure and unit-tested separately.
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

async function searchOneType(origin: Coords, radiusM: number, type: string): Promise<RawPlaceResult[]> {
  const g = await loadGoogleMaps();
  const { places } = await g.maps.places.Place.searchNearby({
    fields: ["displayName", "location", "id"],
    locationRestriction: { center: { lat: origin.lat, lng: origin.lon }, radius: radiusM },
    includedPrimaryTypes: [type],
    maxResultCount: 20,
  });
  return places.map((p) => ({
    placeId: p.id,
    name: p.displayName ?? undefined,
    lat: p.location?.lat(),
    lng: p.location?.lng(),
  }));
}

/**
 * Fetches and merges nearby features across several Places categories.
 * Lets SDK-loading/auth failures (a real problem worth surfacing) propagate;
 * only an individual category search coming back empty is treated as "no
 * results" rather than an error.
 */
export async function fetchNearbyFeaturesGoogle(origin: Coords, radiusM: number): Promise<MapFeature[]> {
  const batches = await Promise.all(
    SEARCH_TYPES.map(async ({ type, kind }) => parseRawPlaceResults(await searchOneType(origin, radiusM, type), kind)),
  );
  const seen = new Map<string, MapFeature>();
  for (const batch of batches) {
    for (const f of batch) if (!seen.has(f.id)) seen.set(f.id, f);
  }
  return Array.from(seen.values());
}
