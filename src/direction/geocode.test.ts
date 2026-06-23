import { describe, expect, it } from "vitest";
import { buildGeocodeUrl, parseGeocodeResults } from "./geocode";

describe("buildGeocodeUrl", () => {
  it("includes the address as a query param", () => {
    const url = buildGeocodeUrl("123 Main St, Springfield");
    expect(url).toContain("q=123");
    expect(url).toContain("format=json");
    expect(url).toContain("limit=1");
  });

  it("URL-encodes special characters", () => {
    const url = buildGeocodeUrl("1 & 2 Main St");
    expect(url).not.toContain(" & ");
  });
});

describe("parseGeocodeResults", () => {
  it("returns null for an empty result list", () => {
    expect(parseGeocodeResults([])).toBeNull();
  });

  it("parses the first result's lat/lon as numbers", () => {
    const coords = parseGeocodeResults([{ lat: "40.7128", lon: "-74.0060" }]);
    expect(coords).toEqual({ lat: 40.7128, lon: -74.006 });
  });

  it("returns null when lat/lon aren't valid numbers", () => {
    expect(parseGeocodeResults([{ lat: "not-a-number", lon: "-74" }])).toBeNull();
  });

  it("ignores results after the first", () => {
    const coords = parseGeocodeResults([
      { lat: "1", lon: "2" },
      { lat: "99", lon: "99" },
    ]);
    expect(coords).toEqual({ lat: 1, lon: 2 });
  });
});
