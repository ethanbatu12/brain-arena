/**
 * Pure geographic math: distance, bearing, and compass-direction helpers.
 * No network, no DOM, no globals — fully unit-testable with plain coordinates.
 */
import type { CompassDirection, Coords } from "./types";

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Great-circle distance between two coordinates, in meters (haversine formula). */
export function distanceMeters(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

/** Initial compass bearing from `a` to `b`, in degrees [0, 360). */
export function bearingDegrees(a: Coords, b: Coords): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

const COMPASS: CompassDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Buckets a bearing in degrees into one of 8 compass directions. */
export function compassDirection(bearing: number): CompassDirection {
  const normalized = ((bearing % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS[index];
}

/** Compass direction of `b` as seen from `a`. */
export function directionFrom(a: Coords, b: Coords): CompassDirection {
  return compassDirection(bearingDegrees(a, b));
}

/** Sorts a list by distance from `origin`, ascending (closest first). */
export function sortByDistance<T extends Coords>(origin: Coords, items: T[]): T[] {
  return [...items].sort((x, y) => distanceMeters(origin, x) - distanceMeters(origin, y));
}

const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Offsets a coordinate by a given number of meters north and east, using a
 * flat-earth (equirectangular) approximation — accurate enough for the small
 * distances used in navigation questions.
 */
export function offsetCoords(origin: Coords, northMeters: number, eastMeters: number): Coords {
  const dLat = northMeters / METERS_PER_DEGREE_LAT;
  const dLon = eastMeters / (METERS_PER_DEGREE_LAT * Math.cos(toRad(origin.lat)));
  return { lat: origin.lat + dLat, lon: origin.lon + dLon };
}
