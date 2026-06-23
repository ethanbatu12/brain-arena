import { describe, expect, it } from "vitest";
import { extractRoadName, parseGoogleSteps, parseManeuver } from "./directions";

describe("extractRoadName", () => {
  it("strips HTML and extracts the road after 'onto'", () => {
    expect(extractRoadName("Turn <b>left</b> onto <b>Main St</b>")).toBe("Main St");
  });

  it("extracts the road after 'toward' when there's no 'onto'", () => {
    expect(extractRoadName("Head <b>north</b> toward <b>Oak Ave</b>")).toBe("Oak Ave");
  });

  it("falls back to the cleaned full text when neither pattern matches", () => {
    expect(extractRoadName("Continue straight")).toBe("Continue straight");
  });

  it("falls back to a placeholder for empty instructions", () => {
    expect(extractRoadName("")).toBe("an unnamed road");
  });
});

describe("parseManeuver", () => {
  it("marks the first step as depart and the last as arrive regardless of maneuver", () => {
    expect(parseManeuver("turn-left", true, false)).toEqual({ maneuverType: "depart" });
    expect(parseManeuver("turn-left", false, true)).toEqual({ maneuverType: "arrive" });
  });

  it("maps ramp maneuvers to on ramp with left/right modifier", () => {
    expect(parseManeuver("ramp-left", false, false)).toEqual({ maneuverType: "on ramp", modifier: "left" });
    expect(parseManeuver("ramp-right", false, false)).toEqual({ maneuverType: "on ramp", modifier: "right" });
  });

  it("maps plain turns and slight/sharp variants", () => {
    expect(parseManeuver("turn-left", false, false)).toEqual({ maneuverType: "turn", modifier: "left" });
    expect(parseManeuver("turn-slight-right", false, false)).toEqual({ maneuverType: "turn", modifier: "slight right" });
    expect(parseManeuver("turn-sharp-left", false, false)).toEqual({ maneuverType: "turn", modifier: "sharp left" });
  });

  it("maps roundabouts, forks, merges, and u-turns", () => {
    expect(parseManeuver("roundabout-left", false, false)).toEqual({ maneuverType: "roundabout", modifier: "left" });
    expect(parseManeuver("fork-right", false, false)).toEqual({ maneuverType: "fork", modifier: "right" });
    expect(parseManeuver("merge", false, false)).toEqual({ maneuverType: "on ramp" });
    expect(parseManeuver("uturn-left", false, false)).toEqual({ maneuverType: "turn", modifier: "uturn" });
  });

  it("defaults to continue for an absent or unrecognized maneuver", () => {
    expect(parseManeuver(undefined, false, false)).toEqual({ maneuverType: "continue" });
    expect(parseManeuver("something-unknown", false, false)).toEqual({ maneuverType: "continue" });
  });
});

describe("parseGoogleSteps", () => {
  it("produces depart/arrive for the first/last step and flags ramps as highway", () => {
    const steps = parseGoogleSteps([
      { instructionsHtml: "Head <b>north</b> on <b>Main St</b>", distanceM: 100 },
      { instructionsHtml: "Turn <b>left</b> onto <b>Oak Ave</b>", distanceM: 400, maneuver: "turn-left" },
      { instructionsHtml: "Take the ramp onto <b>I-95</b>", distanceM: 1800, maneuver: "ramp-right" },
      { instructionsHtml: "Arrive at destination", distanceM: 50 },
    ]);
    expect(steps[0].maneuverType).toBe("depart");
    expect(steps[1]).toMatchObject({ roadName: "Oak Ave", maneuverType: "turn", modifier: "left", isHighway: false });
    expect(steps[2]).toMatchObject({ roadName: "I-95", maneuverType: "on ramp", isHighway: true });
    expect(steps[3].maneuverType).toBe("arrive");
  });
});
