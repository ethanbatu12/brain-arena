import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import {
  BALLOON_GAME_MS,
  BONUS_EVERY_SETS,
  BONUS_POINTS,
  MIN_LEVEL,
  POINTS_PER_BALLOON,
} from "./constants";
import { balloonCountForLevel } from "./logic";
import { balloonInitialState, balloonReduce } from "./reducer";
import type { BalloonAction, BalloonState } from "./types";

/** Build a fresh seeded rng per test for deterministic balloon sets. */
const seeded = () => mulberry32(2024);

function run(state: BalloonState, actions: BalloonAction[], rng = seeded()): BalloonState {
  return actions.reduce((s, a) => balloonReduce(s, a, rng), state);
}

/** Tap through every balloon in the current set, in correct ascending order. */
function completeSet(state: BalloonState, rng: ReturnType<typeof seeded>): BalloonState {
  let s = state;
  const ids = [...state.sortedIds];
  for (const id of ids) {
    s = balloonReduce(s, { type: "TAP", id }, rng);
  }
  return s;
}

describe("balloonInitialState", () => {
  it("starts idle with a full clock and minimum level", () => {
    const state = balloonInitialState();
    expect(state.phase).toBe("idle");
    expect(state.timeLeftMs).toBe(BALLOON_GAME_MS);
    expect(state.level).toBe(MIN_LEVEL);
    expect(state.score).toBe(0);
    expect(state.balloons).toEqual([]);
  });
});

describe("START", () => {
  it("enters playing with a level-1 set of balloons", () => {
    const state = run(balloonInitialState(), [{ type: "START" }]);
    expect(state.phase).toBe("playing");
    expect(state.level).toBe(MIN_LEVEL);
    expect(state.balloons).toHaveLength(balloonCountForLevel(MIN_LEVEL));
    expect(state.sortedIds).toHaveLength(state.balloons.length);
    expect(state.nextIndex).toBe(0);
  });
});

describe("TAP correct", () => {
  it("pops the balloon, scores points, and advances to the next expected balloon", () => {
    const rng = seeded();
    const started = balloonReduce(balloonInitialState(), { type: "START" }, rng);
    const firstId = started.sortedIds[0];

    const after = balloonReduce(started, { type: "TAP", id: firstId }, rng);

    expect(after.score).toBe(POINTS_PER_BALLOON);
    expect(after.correctTaps).toBe(1);
    expect(after.nextIndex).toBe(1);
    expect(after.lastResult).toEqual({ id: firstId, correct: true });
    expect(after.balloons.find((b) => b.id === firstId)?.popped).toBe(true);
  });
});

describe("TAP wrong", () => {
  it("does not pop the balloon or change score, and reports the wrong result", () => {
    const rng = seeded();
    const started = balloonReduce(balloonInitialState(), { type: "START" }, rng);
    // Pick a balloon that is not the next expected one (the set has >1 balloon).
    const wrongId = started.sortedIds[started.sortedIds.length - 1];
    expect(wrongId).not.toBe(started.sortedIds[0]);

    const after = balloonReduce(started, { type: "TAP", id: wrongId }, rng);

    expect(after.score).toBe(0);
    expect(after.wrongTaps).toBe(1);
    expect(after.correctTaps).toBe(0);
    expect(after.nextIndex).toBe(0);
    expect(after.lastResult).toEqual({ id: wrongId, correct: false });
    expect(after.balloons.find((b) => b.id === wrongId)?.popped).toBe(false);
    expect(after.sortedIds).toEqual(started.sortedIds);
  });
});

describe("completing a set", () => {
  it("advances the level, resets nextIndex, and generates a fresh set", () => {
    const rng = seeded();
    const started = balloonReduce(balloonInitialState(), { type: "START" }, rng);
    const setSize = started.balloons.length;

    const after = completeSet(started, rng);

    expect(after.completedSets).toBe(1);
    expect(after.correctTaps).toBe(setSize);
    expect(after.score).toBe(setSize * POINTS_PER_BALLOON);
    expect(after.level).toBe(MIN_LEVEL + 1);
    expect(after.peakLevel).toBe(MIN_LEVEL + 1);
    expect(after.nextIndex).toBe(0);
    expect(after.balloons).toHaveLength(balloonCountForLevel(after.level));
    expect(after.balloons.every((b) => !b.popped)).toBe(true);
  });

  it("awards a bonus every BONUS_EVERY_SETS completed sets", () => {
    const rng = seeded();
    let state = balloonReduce(balloonInitialState(), { type: "START" }, rng);
    let expectedScore = 0;

    for (let i = 1; i <= BONUS_EVERY_SETS; i++) {
      expectedScore += state.balloons.length * POINTS_PER_BALLOON;
      if (i === BONUS_EVERY_SETS) expectedScore += BONUS_POINTS;
      state = completeSet(state, rng);
    }

    expect(state.completedSets).toBe(BONUS_EVERY_SETS);
    expect(state.setsToBonus).toBe(0);
    expect(state.score).toBe(expectedScore);
  });
});

describe("TAP edge cases", () => {
  it("is a no-op while idle or over", () => {
    const idle = balloonInitialState();
    expect(balloonReduce(idle, { type: "TAP", id: 1 }, seeded())).toEqual(idle);
  });
});

describe("TICK", () => {
  it("counts down and ends the game at zero", () => {
    const rng = seeded();
    const started = balloonReduce(balloonInitialState(), { type: "START" }, rng);
    const ticked = balloonReduce(started, { type: "TICK", deltaMs: 1000 }, rng);
    expect(ticked.timeLeftMs).toBe(BALLOON_GAME_MS - 1000);
    expect(ticked.phase).toBe("playing");

    const ended = balloonReduce(ticked, { type: "TICK", deltaMs: BALLOON_GAME_MS }, rng);
    expect(ended.timeLeftMs).toBe(0);
    expect(ended.phase).toBe("over");
  });

  it("is a no-op while idle", () => {
    const idle = balloonInitialState();
    expect(balloonReduce(idle, { type: "TICK", deltaMs: 1000 }, seeded())).toEqual(idle);
  });
});

describe("RESET", () => {
  it("restores the initial state", () => {
    const rng = seeded();
    const started = balloonReduce(balloonInitialState(), { type: "START" }, rng);
    const reset = balloonReduce(started, { type: "RESET" }, rng);
    expect(reset).toEqual(balloonInitialState());
  });
});
