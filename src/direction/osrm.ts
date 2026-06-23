/**
 * Real turn-by-turn driving directions from OSRM's free, keyless public
 * demo routing server — used to power "how many turns to the highway"
 * style questions. URL building, highway detection, and response parsing
 * are pure and unit-tested; only fetchRoute/fetchSampleRoutes touch the
 * network.
 */
import type { Rng } from "../game/rng";
import { MAX_SAMPLE_ROUTES, OSRM_URL } from "./constants";
import { shuffle } from "./utils";
import type { Coords, MapFeature, RouteInfo, RouteStep } from "./types";

export interface OsrmManeuver {
  type: string;
  modifier?: string;
}

export interface OsrmStep {
  distance: number;
  name?: string;
  ref?: string;
  maneuver: OsrmManeuver;
}

export interface OsrmRoute {
  distance: number;
  legs: { steps: OsrmStep[] }[];
}

export interface OsrmRouteResponse {
  code: string;
  routes?: OsrmRoute[];
}

export function buildRouteUrl(origin: Coords, destination: Coords): string {
  return `${OSRM_URL}/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?steps=true&overview=false`;
}

const HIGHWAY_REF_PATTERN = /^[A-Z]{1,3}-?\d/i;
const HIGHWAY_NAME_PATTERN = /highway|freeway|interstate|turnpike|expressway/i;
const HIGHWAY_MANEUVER_TYPES = new Set(["on ramp", "off ramp"]);

/** Heuristically detects whether a route step is on/entering a highway. */
export function isHighwayStep(step: OsrmStep): boolean {
  if (HIGHWAY_MANEUVER_TYPES.has(step.maneuver.type)) return true;
  if (step.ref && HIGHWAY_REF_PATTERN.test(step.ref)) return true;
  if (step.name && HIGHWAY_NAME_PATTERN.test(step.name)) return true;
  return false;
}

export function parseRouteSteps(steps: OsrmStep[]): RouteStep[] {
  return steps.map((s) => ({
    roadName: s.name || s.ref || "an unnamed road",
    distanceM: s.distance,
    maneuverType: s.maneuver.type,
    modifier: s.maneuver.modifier,
    isHighway: isHighwayStep(s),
  }));
}

/** Parses an OSRM route response into RouteInfo, or null if no route was found. */
export function parseRouteResponse(
  data: OsrmRouteResponse,
  destinationFeatureId: string,
  destinationName: string,
): RouteInfo | null {
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    destinationFeatureId,
    destinationName,
    totalDistanceM: route.distance,
    steps: parseRouteSteps(route.legs[0]?.steps ?? []),
  };
}

/** Fetches a real driving route to one feature. Returns null on any failure. */
export async function fetchRoute(origin: Coords, destination: MapFeature): Promise<RouteInfo | null> {
  try {
    const res = await fetch(buildRouteUrl(origin, destination));
    if (!res.ok) return null;
    const data = (await res.json()) as OsrmRouteResponse;
    return parseRouteResponse(data, destination.id, destination.name);
  } catch {
    return null;
  }
}

/** Fetches a handful of sample routes to random nearby features. Failures are skipped, not thrown. */
export async function fetchSampleRoutes(
  origin: Coords,
  features: MapFeature[],
  rng: Rng,
  count: number = MAX_SAMPLE_ROUTES,
): Promise<RouteInfo[]> {
  const sample = shuffle(features, rng).slice(0, count);
  const results = await Promise.allSettled(sample.map((f) => fetchRoute(origin, f)));
  const routes: RouteInfo[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) routes.push(result.value);
  }
  return routes;
}
