import { describe, expect, it } from "vitest";
import { buildRouteUrl, isHighwayStep, parseRouteResponse, parseRouteSteps, type OsrmStep } from "./osrm";
import type { Coords } from "./types";

const ORIGIN: Coords = { lat: 40.0, lon: -75.0 };
const DEST: Coords = { lat: 40.1, lon: -75.1 };

describe("buildRouteUrl", () => {
  it("orders coordinates as lon,lat per OSRM's convention", () => {
    const url = buildRouteUrl(ORIGIN, DEST);
    expect(url).toContain("-75,40");
    expect(url).toContain("-75.1,40.1");
    expect(url).toContain("steps=true");
  });
});

describe("isHighwayStep", () => {
  it("detects on/off ramp maneuvers as highway", () => {
    expect(isHighwayStep({ distance: 100, maneuver: { type: "on ramp" } })).toBe(true);
    expect(isHighwayStep({ distance: 100, maneuver: { type: "off ramp" } })).toBe(true);
  });

  it("detects highway-style refs like I-95 or US-1", () => {
    expect(isHighwayStep({ distance: 100, ref: "I-95", maneuver: { type: "turn" } })).toBe(true);
    expect(isHighwayStep({ distance: 100, ref: "US-1", maneuver: { type: "turn" } })).toBe(true);
  });

  it("detects highway-style names", () => {
    expect(isHighwayStep({ distance: 100, name: "Northeast Expressway", maneuver: { type: "turn" } })).toBe(true);
    expect(isHighwayStep({ distance: 100, name: "Lincoln Turnpike", maneuver: { type: "turn" } })).toBe(true);
  });

  it("returns false for an ordinary local street", () => {
    expect(isHighwayStep({ distance: 100, name: "Oak Avenue", maneuver: { type: "turn" } })).toBe(false);
  });
});

describe("parseRouteSteps", () => {
  it("maps OSRM steps to RouteStep, falling back to ref or a placeholder for unnamed roads", () => {
    const steps: OsrmStep[] = [
      { distance: 50, name: "Main Street", maneuver: { type: "depart" } },
      { distance: 200, ref: "I-95", maneuver: { type: "on ramp" } },
      { distance: 10, maneuver: { type: "turn", modifier: "left" } },
    ];
    const parsed = parseRouteSteps(steps);
    expect(parsed[0].roadName).toBe("Main Street");
    expect(parsed[0].isHighway).toBe(false);
    expect(parsed[1].roadName).toBe("I-95");
    expect(parsed[1].isHighway).toBe(true);
    expect(parsed[2].roadName).toBe("an unnamed road");
    expect(parsed[2].modifier).toBe("left");
  });
});

describe("parseRouteResponse", () => {
  it("returns null when there are no routes", () => {
    expect(parseRouteResponse({ code: "NoRoute" }, "f1", "Town Hall")).toBeNull();
  });

  it("extracts total distance and steps from the first route", () => {
    const result = parseRouteResponse(
      {
        code: "Ok",
        routes: [
          {
            distance: 1500,
            legs: [{ steps: [{ distance: 1500, name: "Elm Street", maneuver: { type: "depart" } }] }],
          },
        ],
      },
      "f1",
      "Town Hall",
    );
    expect(result).not.toBeNull();
    expect(result!.totalDistanceM).toBe(1500);
    expect(result!.destinationName).toBe("Town Hall");
    expect(result!.steps).toHaveLength(1);
  });
});
