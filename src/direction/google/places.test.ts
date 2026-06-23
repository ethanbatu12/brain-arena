import { describe, expect, it } from "vitest";
import { parseRawPlaceResults } from "./places";

describe("parseRawPlaceResults", () => {
  it("skips results missing a place id, name, or coordinates", () => {
    expect(parseRawPlaceResults([{ name: "X", lat: 1, lng: 2 }], "landmark")).toHaveLength(0);
    expect(parseRawPlaceResults([{ placeId: "1", lat: 1, lng: 2 }], "landmark")).toHaveLength(0);
    expect(parseRawPlaceResults([{ placeId: "1", name: "X", lng: 2 }], "landmark")).toHaveLength(0);
  });

  it("maps complete results to MapFeature with the given kind", () => {
    const features = parseRawPlaceResults([{ placeId: "p1", name: "Lincoln Elementary", lat: 40, lng: -75 }], "school");
    expect(features).toEqual([{ id: "p1", name: "Lincoln Elementary", kind: "school", lat: 40, lon: -75 }]);
  });
});
