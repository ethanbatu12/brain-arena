import { describe, expect, it } from "vitest";
import { bearingDegrees, compassDirection, directionFrom, distanceMeters, offsetCoords, sortByDistance } from "./geo";
import type { Coords } from "./types";

const ORIGIN: Coords = { lat: 40.0, lon: -75.0 };

describe("distanceMeters", () => {
  it("is zero for identical coordinates", () => {
    expect(distanceMeters(ORIGIN, ORIGIN)).toBeCloseTo(0, 3);
  });

  it("computes a known distance: 1 degree of latitude is about 111 km", () => {
    const oneDegreeNorth: Coords = { lat: 41.0, lon: -75.0 };
    const d = distanceMeters(ORIGIN, oneDegreeNorth);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it("is symmetric", () => {
    const other: Coords = { lat: 40.01, lon: -74.99 };
    expect(distanceMeters(ORIGIN, other)).toBeCloseTo(distanceMeters(other, ORIGIN), 6);
  });
});

describe("bearingDegrees", () => {
  it("is 0 (north) when the target is due north", () => {
    const north: Coords = { lat: ORIGIN.lat + 1, lon: ORIGIN.lon };
    expect(bearingDegrees(ORIGIN, north)).toBeCloseTo(0, 0);
  });

  it("is 90 (east) when the target is due east", () => {
    const east: Coords = { lat: ORIGIN.lat, lon: ORIGIN.lon + 1 };
    expect(bearingDegrees(ORIGIN, east)).toBeCloseTo(90, 0);
  });

  it("is 180 (south) when the target is due south", () => {
    const south: Coords = { lat: ORIGIN.lat - 1, lon: ORIGIN.lon };
    expect(bearingDegrees(ORIGIN, south)).toBeCloseTo(180, 0);
  });

  it("is 270 (west) when the target is due west", () => {
    const west: Coords = { lat: ORIGIN.lat, lon: ORIGIN.lon - 1 };
    expect(bearingDegrees(ORIGIN, west)).toBeCloseTo(270, 0);
  });

  it("stays within [0, 360)", () => {
    for (const lat of [-1, 0, 1]) {
      for (const lon of [-1, 0, 1]) {
        if (lat === 0 && lon === 0) continue;
        const b = bearingDegrees(ORIGIN, { lat: ORIGIN.lat + lat, lon: ORIGIN.lon + lon });
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(360);
      }
    }
  });
});

describe("compassDirection", () => {
  it("maps cardinal bearings to the right label", () => {
    expect(compassDirection(0)).toBe("N");
    expect(compassDirection(45)).toBe("NE");
    expect(compassDirection(90)).toBe("E");
    expect(compassDirection(135)).toBe("SE");
    expect(compassDirection(180)).toBe("S");
    expect(compassDirection(225)).toBe("SW");
    expect(compassDirection(270)).toBe("W");
    expect(compassDirection(315)).toBe("NW");
  });

  it("wraps 360 back to N", () => {
    expect(compassDirection(360)).toBe("N");
    expect(compassDirection(359)).toBe("N");
  });

  it("handles negative bearings", () => {
    expect(compassDirection(-90)).toBe("W");
  });
});

describe("directionFrom", () => {
  it("matches compassDirection(bearingDegrees(...))", () => {
    const target: Coords = { lat: ORIGIN.lat + 0.5, lon: ORIGIN.lon + 0.5 };
    expect(directionFrom(ORIGIN, target)).toBe(compassDirection(bearingDegrees(ORIGIN, target)));
  });
});

describe("offsetCoords", () => {
  it("moving north increases latitude and keeps longitude unchanged", () => {
    const moved = offsetCoords(ORIGIN, 1000, 0);
    expect(moved.lat).toBeGreaterThan(ORIGIN.lat);
    expect(moved.lon).toBeCloseTo(ORIGIN.lon, 9);
  });

  it("moving east increases longitude and keeps latitude unchanged", () => {
    const moved = offsetCoords(ORIGIN, 0, 1000);
    expect(moved.lon).toBeGreaterThan(ORIGIN.lon);
    expect(moved.lat).toBeCloseTo(ORIGIN.lat, 9);
  });

  it("produces a point roughly the requested distance away", () => {
    const moved = offsetCoords(ORIGIN, 1000, 0);
    expect(distanceMeters(ORIGIN, moved)).toBeCloseTo(1000, -1);
  });
});

describe("sortByDistance", () => {
  it("orders items closest-first without mutating the input", () => {
    const items: Coords[] = [
      { lat: ORIGIN.lat + 1, lon: ORIGIN.lon }, // far
      { lat: ORIGIN.lat + 0.001, lon: ORIGIN.lon }, // close
      { lat: ORIGIN.lat + 0.5, lon: ORIGIN.lon }, // medium
    ];
    const original = [...items];
    const sorted = sortByDistance(ORIGIN, items);
    expect(sorted[0]).toEqual(items[1]);
    expect(sorted[1]).toEqual(items[2]);
    expect(sorted[2]).toEqual(items[0]);
    expect(items).toEqual(original); // not mutated
  });
});
