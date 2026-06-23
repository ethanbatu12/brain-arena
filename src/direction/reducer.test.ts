import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { BONUS_POINTS, DIRECTION_GAME_MS, POINTS_PER_CORRECT } from "./constants";
import { directionInitialState, directionReduce } from "./reducer";
import type { Coords, DirectionState, MapFeature } from "./types";

const rng = () => mulberry32(123);

const ORIGIN: Coords = { lat: 40.0, lon: -75.0 };

const FEATURES: MapFeature[] = [
  { id: "1", name: "Main Street", kind: "road", lat: 40.01, lon: -75.0 },
  { id: "2", name: "Oak Avenue", kind: "road", lat: 39.99, lon: -75.0 },
  { id: "3", name: "Central Park", kind: "park", lat: 40.0, lon: -74.99 },
  { id: "4", name: "Lincoln Elementary", kind: "school", lat: 40.0, lon: -75.01 },
  { id: "5", name: "Town Hall", kind: "landmark", lat: 40.005, lon: -74.995 },
];

function started(): DirectionState {
  return directionReduce(directionInitialState(), { type: "START" }, rng());
}

function located(): DirectionState {
  return directionReduce(started(), { type: "LOCATED", origin: ORIGIN }, rng());
}

function loaded(): DirectionState {
  return directionReduce(located(), { type: "FEATURES_LOADED", features: FEATURES }, rng());
}

describe("directionInitialState", () => {
  it("starts idle with zeroed stats and a full 3-minute timer", () => {
    const s = directionInitialState();
    expect(s.phase).toBe("idle");
    expect(s.question).toBeNull();
    expect(s.score).toBe(0);
    expect(s.timeLeftMs).toBe(DIRECTION_GAME_MS);
  });
});

describe("START / LOCATED / FEATURES_LOADED flow", () => {
  it("moves idle -> locating -> loading -> playing as data arrives", () => {
    expect(started().phase).toBe("locating");
    expect(located().phase).toBe("loading");
    expect(located().origin).toEqual(ORIGIN);
    const s = loaded();
    expect(s.phase).toBe("playing");
    expect(s.question).not.toBeNull();
    expect(s.features).toEqual(FEATURES);
  });

  it("goes to error phase if too few features are found", () => {
    const s = directionReduce(located(), { type: "FEATURES_LOADED", features: FEATURES.slice(0, 2) }, rng());
    expect(s.phase).toBe("error");
    expect(s.errorMessage).not.toBeNull();
  });

  it("goes to error phase on LOAD_FAILED", () => {
    const s = directionReduce(located(), { type: "LOAD_FAILED", message: "denied" }, rng());
    expect(s.phase).toBe("error");
    expect(s.errorMessage).toBe("denied");
  });
});

describe("ANSWER", () => {
  it("awards points and a new question on a correct answer", () => {
    const s = loaded();
    const q = s.question!;
    const next = directionReduce(s, { type: "ANSWER", questionId: q.id, choiceIndex: q.correctIndex }, rng());
    expect(next.score).toBe(POINTS_PER_CORRECT);
    expect(next.correctCount).toBe(1);
    expect(next.question).not.toBeNull();
    expect(next.question!.id).not.toBe(q.id);
    expect(next.lastResult).toEqual({ questionId: q.id, chosenIndex: q.correctIndex, correct: true });
  });

  it("awards no points on a wrong answer but still advances", () => {
    const s = loaded();
    const q = s.question!;
    const wrongIndex = (q.correctIndex + 1) % 4;
    const next = directionReduce(s, { type: "ANSWER", questionId: q.id, choiceIndex: wrongIndex }, rng());
    expect(next.score).toBe(0);
    expect(next.wrongCount).toBe(1);
    expect(next.lastResult?.correct).toBe(false);
  });

  it("ignores a stale answer for a question that's no longer current", () => {
    const s = loaded();
    const staleId = s.question!.id - 999;
    const next = directionReduce(s, { type: "ANSWER", questionId: staleId, choiceIndex: 0 }, rng());
    expect(next).toEqual(s);
  });

  it("awards the bonus on the 5th correct answer", () => {
    let s = loaded();
    for (let i = 0; i < 4; i++) {
      s = directionReduce(s, { type: "ANSWER", questionId: s.question!.id, choiceIndex: s.question!.correctIndex }, rng());
    }
    expect(s.correctCount).toBe(4);
    expect(s.score).toBe(4 * POINTS_PER_CORRECT);

    s = directionReduce(s, { type: "ANSWER", questionId: s.question!.id, choiceIndex: s.question!.correctIndex }, rng());
    expect(s.correctCount).toBe(5);
    expect(s.score).toBe(4 * POINTS_PER_CORRECT + POINTS_PER_CORRECT + BONUS_POINTS);
  });
});

describe("TICK", () => {
  it("counts down the round timer", () => {
    const s = loaded();
    const next = directionReduce(s, { type: "TICK", deltaMs: 1000 }, rng());
    expect(next.timeLeftMs).toBe(DIRECTION_GAME_MS - 1000);
    expect(next.phase).toBe("playing");
  });

  it("ends the round when time runs out", () => {
    const s = loaded();
    const next = directionReduce(s, { type: "TICK", deltaMs: DIRECTION_GAME_MS + 1000 }, rng());
    expect(next.phase).toBe("over");
    expect(next.timeLeftMs).toBe(0);
  });

  it("does nothing while locating or loading", () => {
    const locating = started();
    expect(directionReduce(locating, { type: "TICK", deltaMs: 100 }, rng())).toEqual(locating);
  });
});

describe("RESET", () => {
  it("returns to the initial idle state", () => {
    expect(directionReduce(loaded(), { type: "RESET" }, rng())).toEqual(directionInitialState());
  });
});
