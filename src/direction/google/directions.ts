/**
 * Real driving routes via the Google Maps JavaScript SDK's DirectionsService
 * (no CORS, no raw fetch). Parsing Google's HTML instructions/maneuver
 * vocabulary into our existing RouteStep shape is pure and unit-tested;
 * only fetchRouteGoogle itself touches the SDK.
 */
import type { Rng } from "../../game/rng";
import { shuffle } from "../utils";
import { loadGoogleMaps } from "./loader";
import type { Coords, MapFeature, RouteInfo, RouteStep } from "../types";

const HIGHWAY_NAME_PATTERN = /highway|freeway|interstate|turnpike|expressway|\bI-\d+|\bUS-\d+/i;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/** Pure: best-effort extraction of the road name a Google instruction refers to. */
export function extractRoadName(instructionHtml: string): string {
  const text = stripHtml(instructionHtml);
  const onto = text.match(/onto (.+?)(?:[.,]|$)/i);
  if (onto) return onto[1].trim();
  const toward = text.match(/toward (.+?)(?:[.,]|$)/i);
  if (toward) return toward[1].trim();
  return text || "an unnamed road";
}

export interface ManeuverInfo {
  maneuverType: string;
  modifier?: string;
}

/** Pure: maps Google's maneuver vocabulary onto our OSRM-derived maneuverType/modifier shape. */
export function parseManeuver(maneuver: string | undefined, isFirst: boolean, isLast: boolean): ManeuverInfo {
  if (isFirst) return { maneuverType: "depart" };
  if (isLast) return { maneuverType: "arrive" };
  if (!maneuver) return { maneuverType: "continue" };

  const isLeft = maneuver.includes("left");
  if (maneuver.startsWith("ramp")) return { maneuverType: "on ramp", modifier: isLeft ? "left" : "right" };
  if (maneuver.startsWith("turn-slight")) return { maneuverType: "turn", modifier: isLeft ? "slight left" : "slight right" };
  if (maneuver.startsWith("turn-sharp")) return { maneuverType: "turn", modifier: isLeft ? "sharp left" : "sharp right" };
  if (maneuver.startsWith("turn")) return { maneuverType: "turn", modifier: isLeft ? "left" : "right" };
  if (maneuver.startsWith("uturn")) return { maneuverType: "turn", modifier: "uturn" };
  if (maneuver.startsWith("roundabout")) return { maneuverType: "roundabout", modifier: isLeft ? "left" : "right" };
  if (maneuver.startsWith("fork")) return { maneuverType: "fork", modifier: isLeft ? "left" : "right" };
  if (maneuver.startsWith("merge")) return { maneuverType: "on ramp" };
  return { maneuverType: "continue" };
}

export interface RawDirectionsStep {
  instructionsHtml: string;
  distanceM: number;
  maneuver?: string;
}

/** Pure: converts raw Google steps (plain data) into our RouteStep shape. */
export function parseGoogleSteps(rawSteps: RawDirectionsStep[]): RouteStep[] {
  return rawSteps.map((s, i) => {
    const { maneuverType, modifier } = parseManeuver(s.maneuver, i === 0, i === rawSteps.length - 1);
    const roadName = extractRoadName(s.instructionsHtml);
    return {
      roadName,
      distanceM: s.distanceM,
      maneuverType,
      modifier,
      isHighway: maneuverType === "on ramp" || HIGHWAY_NAME_PATTERN.test(roadName),
    };
  });
}

/** Fetches a real driving route to one feature via the SDK. Returns null on any failure. */
export async function fetchRouteGoogle(origin: Coords, destination: MapFeature): Promise<RouteInfo | null> {
  try {
    const g = await loadGoogleMaps();
    const service = new g.maps.DirectionsService();
    const result = await service.route({
      origin: { lat: origin.lat, lng: origin.lon },
      destination: { lat: destination.lat, lng: destination.lon },
      travelMode: g.maps.TravelMode.DRIVING,
    });
    const route = result.routes[0];
    const leg = route?.legs[0];
    if (!route || !leg) return null;

    const rawSteps: RawDirectionsStep[] = leg.steps.map((s) => ({
      instructionsHtml: s.instructions,
      distanceM: s.distance?.value ?? 0,
      maneuver: s.maneuver,
    }));
    const polyline: Coords[] = leg.steps.flatMap((s) => s.path?.map((p) => ({ lat: p.lat(), lon: p.lng() })) ?? []);

    return {
      destinationFeatureId: destination.id,
      destinationName: destination.name,
      totalDistanceM: leg.distance?.value ?? 0,
      steps: parseGoogleSteps(rawSteps),
      polyline,
    };
  } catch {
    return null;
  }
}

/** Fetches a handful of sample routes to random nearby features. Failures are skipped, not thrown. */
export async function fetchSampleRoutesGoogle(
  origin: Coords,
  features: MapFeature[],
  rng: Rng,
  count: number,
): Promise<RouteInfo[]> {
  const sample = shuffle(features, rng).slice(0, count);
  const results = await Promise.allSettled(sample.map((f) => fetchRouteGoogle(origin, f)));
  const routes: RouteInfo[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) routes.push(r.value);
  }
  return routes;
}
