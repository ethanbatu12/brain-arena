/**
 * Fetches real-world map features near a location from the free, keyless
 * Overpass API (OpenStreetMap data) — no Google Maps, no paid services,
 * no API key. Query building + response parsing are pure and unit-tested;
 * only fetchNearbyFeatures itself touches the network.
 */
import { OVERPASS_URLS, SEARCH_RADIUS_M } from "./constants";
import { minDistanceToPolyline } from "./geo";
import type { Coords, FeatureKind, MapFeature, RouteInfo } from "./types";

/** A traffic signal counts as "on" a route if it's within this many meters of the route's geometry. */
const TRAFFIC_SIGNAL_BUFFER_M = 25;

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
 * Runs an Overpass QL query against each mirror in OVERPASS_URLS in turn,
 * returning the first successful response. Throws only if every mirror
 * fails — callers should catch this to distinguish "the request failed"
 * from "it succeeded but found nothing", which need very different
 * handling.
 */
export async function runOverpassQuery(query: string): Promise<OverpassResponse> {
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
      return (await res.json()) as OverpassResponse;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("All Overpass mirrors failed");
}

/** Fetches and parses nearby map features for `origin`. See runOverpassQuery for failure semantics. */
export async function fetchNearbyFeatures(origin: Coords, radiusM: number = SEARCH_RADIUS_M): Promise<MapFeature[]> {
  const data = await runOverpassQuery(buildOverpassQuery(origin, radiusM));
  return parseOverpassElements(data.elements ?? []);
}

/** Builds an Overpass QL query for traffic-signal nodes within a bounding box. */
export function buildTrafficSignalsQuery(bbox: { south: number; west: number; north: number; east: number }): string {
  return `[out:json][timeout:25];node["highway"="traffic_signals"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});out;`;
}

/** Computes a padded bounding box around a list of coordinates. */
export function boundingBox(points: Coords[], paddingDegrees = 0.0005): { south: number; west: number; north: number; east: number } | null {
  if (points.length === 0) return null;
  let south = points[0].lat;
  let north = points[0].lat;
  let west = points[0].lon;
  let east = points[0].lon;
  for (const p of points) {
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
    if (p.lon < west) west = p.lon;
    if (p.lon > east) east = p.lon;
  }
  return { south: south - paddingDegrees, west: west - paddingDegrees, north: north + paddingDegrees, east: east + paddingDegrees };
}

/** Parses traffic-signal node coordinates from an Overpass response. */
export function parseTrafficSignalNodes(elements: OverpassElement[]): Coords[] {
  const nodes: Coords[] = [];
  for (const el of elements) {
    if (el.lat !== undefined && el.lon !== undefined) nodes.push({ lat: el.lat, lon: el.lon });
  }
  return nodes;
}

/** Counts how many traffic signals lie within a small buffer of a real route's geometry. */
export function countSignalsOnRoute(signals: Coords[], polyline: Coords[]): number {
  if (polyline.length < 2) return 0;
  return signals.filter((s) => minDistanceToPolyline(s, polyline) <= TRAFFIC_SIGNAL_BUFFER_M).length;
}

/**
 * Fetches the number of traffic signals along a route's real geometry.
 * Best-effort: returns 0 (not an error) if the route has no polyline or the
 * Overpass query fails, since this only adds a question variant rather than
 * being required for the game to function.
 */
export async function fetchTrafficSignalCount(route: RouteInfo): Promise<number> {
  const bbox = boundingBox(route.polyline);
  if (!bbox) return 0;
  try {
    const data = await runOverpassQuery(buildTrafficSignalsQuery(bbox));
    const signals = parseTrafficSignalNodes(data.elements ?? []);
    return countSignalsOnRoute(signals, route.polyline);
  } catch {
    return 0;
  }
}
