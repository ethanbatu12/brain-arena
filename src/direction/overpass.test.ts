import { describe, expect, it } from "vitest";
import { buildOverpassQuery, parseOverpassElements, type OverpassElement } from "./overpass";
import type { Coords } from "./types";

const ORIGIN: Coords = { lat: 40.0, lon: -75.0 };

describe("buildOverpassQuery", () => {
  it("includes the origin coordinates and a default radius", () => {
    const q = buildOverpassQuery(ORIGIN);
    expect(q).toContain("40");
    expect(q).toContain("-75");
    expect(q).toContain("around:");
  });

  it("respects a custom radius", () => {
    const q = buildOverpassQuery(ORIGIN, 500);
    expect(q).toContain("around:500,");
  });

  it("queries roads, amenities, shops, parks, and tourism features", () => {
    const q = buildOverpassQuery(ORIGIN);
    expect(q).toContain('["highway"]');
    expect(q).toContain('["amenity"]');
    expect(q).toContain('["shop"]');
    expect(q).toContain('["leisure"="park"]');
    expect(q).toContain('["tourism"]');
  });
});

describe("parseOverpassElements", () => {
  it("skips elements with no name tag", () => {
    const elements: OverpassElement[] = [
      { type: "node", id: 1, lat: 40.0, lon: -75.0, tags: {} },
    ];
    expect(parseOverpassElements(elements)).toHaveLength(0);
  });

  it("skips elements with no resolvable coordinates", () => {
    const elements: OverpassElement[] = [
      { type: "way", id: 2, tags: { highway: "residential", name: "Elm Street" } },
    ];
    expect(parseOverpassElements(elements)).toHaveLength(0);
  });

  it("uses center coordinates for ways", () => {
    const elements: OverpassElement[] = [
      { type: "way", id: 3, center: { lat: 40.1, lon: -75.1 }, tags: { highway: "primary", name: "Elm Street" } },
    ];
    const features = parseOverpassElements(elements);
    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({ name: "Elm Street", kind: "road", lat: 40.1, lon: -75.1 });
  });

  it("classifies feature kinds from tags", () => {
    const elements: OverpassElement[] = [
      { type: "node", id: 1, lat: 40, lon: -75, tags: { amenity: "school", name: "Lincoln Elementary" } },
      { type: "node", id: 2, lat: 40, lon: -75, tags: { leisure: "park", name: "Central Park" } },
      { type: "node", id: 3, lat: 40, lon: -75, tags: { shop: "supermarket", name: "Corner Market" } },
      { type: "node", id: 4, lat: 40, lon: -75, tags: { tourism: "museum", name: "City Museum" } },
      { type: "node", id: 5, lat: 40, lon: -75, tags: { amenity: "hospital", name: "General Hospital" } },
    ];
    const features = parseOverpassElements(elements);
    expect(features.find((f) => f.name === "Lincoln Elementary")?.kind).toBe("school");
    expect(features.find((f) => f.name === "Central Park")?.kind).toBe("park");
    expect(features.find((f) => f.name === "Corner Market")?.kind).toBe("business");
    expect(features.find((f) => f.name === "City Museum")?.kind).toBe("landmark");
    expect(features.find((f) => f.name === "General Hospital")?.kind).toBe("landmark");
  });

  it("deduplicates identical name+coordinate pairs", () => {
    const elements: OverpassElement[] = [
      { type: "node", id: 1, lat: 40, lon: -75, tags: { shop: "bakery", name: "Same Place" } },
      { type: "node", id: 2, lat: 40, lon: -75, tags: { shop: "bakery", name: "Same Place" } },
    ];
    expect(parseOverpassElements(elements)).toHaveLength(1);
  });
});
