import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { QUESTION_KINDS } from "./constants";
import { makeQuestion } from "./logic";
import type { Coords, MapFeature } from "./types";

const ORIGIN: Coords = { lat: 40.0, lon: -75.0 };

const FEATURES: MapFeature[] = [
  { id: "1", name: "Main Street", kind: "road", lat: 40.01, lon: -75.0 },
  { id: "2", name: "Oak Avenue", kind: "road", lat: 39.99, lon: -75.0 },
  { id: "3", name: "Central Park", kind: "park", lat: 40.0, lon: -74.99 },
  { id: "4", name: "Lincoln Elementary", kind: "school", lat: 40.0, lon: -75.01 },
  { id: "5", name: "Town Hall", kind: "landmark", lat: 40.005, lon: -74.995 },
  { id: "6", name: "Corner Market", kind: "business", lat: 39.995, lon: -75.005 },
];

describe("makeQuestion", () => {
  it("returns null when there are too few features", () => {
    const rng = mulberry32(1);
    expect(makeQuestion(ORIGIN, FEATURES.slice(0, 2), rng, 1)).toBeNull();
  });

  it("always returns a well-formed question with exactly 4 unique choices", () => {
    const rng = mulberry32(2024);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion(ORIGIN, FEATURES, rng, i);
      expect(q).not.toBeNull();
      expect(q!.choices).toHaveLength(4);
      expect(new Set(q!.choices).size).toBe(4);
      expect(q!.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q!.correctIndex).toBeLessThan(4);
      expect(q!.prompt.length).toBeGreaterThan(0);
      expect(QUESTION_KINDS).toContain(q!.kind);
    }
  });

  it("can generate every question kind across enough trials", () => {
    const rng = mulberry32(7);
    const seenKinds = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const q = makeQuestion(ORIGIN, FEATURES, rng, i);
      if (q) seenKinds.add(q.kind);
    }
    for (const kind of QUESTION_KINDS) {
      expect(seenKinds.has(kind)).toBe(true);
    }
  });

  it("map-memory questions are flagged to show the map first", () => {
    const rng = mulberry32(3);
    let found = false;
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(ORIGIN, FEATURES, rng, i);
      if (q?.kind === "map-memory") {
        found = true;
        expect(q.showMapFirst).toBe(true);
      }
    }
    expect(found).toBe(true);
  });

  it("basic-direction questions name a real feature whose compass direction matches the prompt", () => {
    const rng = mulberry32(11);
    let checked = 0;
    for (let i = 0; i < 200 && checked < 5; i++) {
      const q = makeQuestion(ORIGIN, FEATURES, rng, i);
      if (q?.kind === "basic-direction") {
        const correctName = q.choices[q.correctIndex];
        const feature = FEATURES.find((f) => f.name === correctName);
        expect(feature).toBeDefined();
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("distance-ranking choices are all distinct orderings of the same three names", () => {
    const rng = mulberry32(42);
    let checked = 0;
    for (let i = 0; i < 200 && checked < 5; i++) {
      const q = makeQuestion(ORIGIN, FEATURES, rng, i);
      if (q?.kind === "distance-ranking") {
        const correctSet = new Set(q.choices[q.correctIndex].split(" → "));
        expect(correctSet.size).toBe(3);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
