import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import {
  BONUS_EVERY,
  BONUS_POINTS,
  CUBE_GAME_MS,
  LEVEL_UP_EVERY,
  MIN_LEVEL,
  POINTS_PER_CORRECT,
} from "./constants";
import { cubeInitialState, cubeReduce } from "./reducer";
import type { CubeAction, CubeState } from "./types";

/** Build a fresh seeded rng per test for deterministic structures. */
const seeded = () => mulberry32(2024);

function run(state: CubeState, actions: CubeAction[], rng = seeded()): CubeState {
  return actions.reduce((s, a) => cubeReduce(s, a, rng), state);
}

describe("cubeInitialState", () => {
  it("starts idle with a full clock and minimum level", () => {
    const state = cubeInitialState();
    expect(state.phase).toBe("idle");
    expect(state.timeLeftMs).toBe(CUBE_GAME_MS);
    expect(state.level).toBe(MIN_LEVEL);
    expect(state.score).toBe(0);
  });
});

describe("START", () => {
  it("enters playing with a level-1 structure", () => {
    const state = run(cubeInitialState(), [{ type: "START" }]);
    expect(state.phase).toBe("playing");
    expect(state.level).toBe(MIN_LEVEL);
    expect(state.structure.total).toBeGreaterThan(0);
  });
});

describe("INPUT_CHANGE", () => {
  it("sanitizes to digits and caps the length", () => {
    const started = run(cubeInitialState(), [{ type: "START" }]);
    const state = cubeReduce(started, { type: "INPUT_CHANGE", value: "12a3456" }, seeded());
    expect(state.input).toBe("123");
  });

  it("is a no-op while idle", () => {
    const state = cubeReduce(cubeInitialState(), { type: "INPUT_CHANGE", value: "5" }, seeded());
    expect(state.input).toBe("");
  });
});

describe("SUBMIT correct", () => {
  it("awards points and generates a new structure", () => {
    const rng = seeded();
    const started = cubeReduce(cubeInitialState(), { type: "START" }, rng);
    const total = started.structure.total;
    const withInput = cubeReduce(started, { type: "INPUT_CHANGE", value: String(total) }, rng);

    const after = cubeReduce(withInput, { type: "SUBMIT" }, rng);

    expect(after.score).toBe(POINTS_PER_CORRECT);
    expect(after.correct).toBe(1);
    expect(after.level).toBe(MIN_LEVEL);
    expect(after.lastResult).toBe("correct");
    expect(after.input).toBe("");
    expect(after.structure.id).not.toBe(started.structure.id);
  });

  it("advances the level after LEVEL_UP_EVERY correct answers", () => {
    const rng = seeded();
    let state = cubeReduce(cubeInitialState(), { type: "START" }, rng);

    for (let i = 0; i < LEVEL_UP_EVERY; i++) {
      const total = state.structure.total;
      state = cubeReduce(state, { type: "INPUT_CHANGE", value: String(total) }, rng);
      state = cubeReduce(state, { type: "SUBMIT" }, rng);
    }

    expect(state.correct).toBe(LEVEL_UP_EVERY);
    expect(state.level).toBe(MIN_LEVEL + 1);
  });

  it("awards a bonus on every BONUS_EVERY-th correct answer", () => {
    const rng = seeded();
    let state = cubeReduce(cubeInitialState(), { type: "START" }, rng);

    for (let i = 1; i <= BONUS_EVERY; i++) {
      const total = state.structure.total;
      state = cubeReduce(state, { type: "INPUT_CHANGE", value: String(total) }, rng);
      state = cubeReduce(state, { type: "SUBMIT" }, rng);
    }

    expect(state.correct).toBe(BONUS_EVERY);
    expect(state.streakToBonus).toBe(0);
    expect(state.score).toBe(BONUS_EVERY * POINTS_PER_CORRECT + BONUS_POINTS);
  });
});

describe("SUBMIT wrong", () => {
  it("does not change the score or level, and moves on to a new structure", () => {
    const rng = seeded();
    const started = cubeReduce(cubeInitialState(), { type: "START" }, rng);
    const wrongGuess = started.structure.total + 1;
    const withInput = cubeReduce(started, { type: "INPUT_CHANGE", value: String(wrongGuess) }, rng);

    const after = cubeReduce(withInput, { type: "SUBMIT" }, rng);

    expect(after.score).toBe(0);
    expect(after.wrong).toBe(1);
    expect(after.level).toBe(started.level);
    expect(after.lastResult).toBe("wrong");
    expect(after.input).toBe("");
    expect(after.structure.id).not.toBe(started.structure.id);
  });
});

describe("SUBMIT edge cases", () => {
  it("is a no-op with empty input", () => {
    const rng = seeded();
    const started = cubeReduce(cubeInitialState(), { type: "START" }, rng);
    const after = cubeReduce(started, { type: "SUBMIT" }, rng);
    expect(after).toEqual(started);
  });

  it("is a no-op while idle or over", () => {
    const idle = cubeReduce(
      cubeInitialState(),
      { type: "INPUT_CHANGE", value: "5" },
      seeded(),
    );
    expect(cubeReduce(idle, { type: "SUBMIT" }, seeded())).toEqual(idle);
  });
});

describe("TICK", () => {
  it("counts down and ends the game at zero", () => {
    const rng = seeded();
    const started = cubeReduce(cubeInitialState(), { type: "START" }, rng);
    const ticked = cubeReduce(started, { type: "TICK", deltaMs: 1000 }, rng);
    expect(ticked.timeLeftMs).toBe(CUBE_GAME_MS - 1000);
    expect(ticked.phase).toBe("playing");

    const ended = cubeReduce(ticked, { type: "TICK", deltaMs: CUBE_GAME_MS }, rng);
    expect(ended.timeLeftMs).toBe(0);
    expect(ended.phase).toBe("over");
    expect(ended.input).toBe("");
  });

  it("is a no-op while idle", () => {
    const idle = cubeInitialState();
    expect(cubeReduce(idle, { type: "TICK", deltaMs: 1000 }, seeded())).toEqual(idle);
  });
});

describe("RESET", () => {
  it("restores the initial state", () => {
    const rng = seeded();
    const started = cubeReduce(cubeInitialState(), { type: "START" }, rng);
    const reset = cubeReduce(started, { type: "RESET" }, rng);
    expect(reset).toEqual(cubeInitialState());
  });
});
