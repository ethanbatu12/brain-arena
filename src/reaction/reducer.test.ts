import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { BONUS_POINTS, POINTS_PER_DOT, REACTION_GAME_MS } from "./constants";
import { reactionInitialState, reactionReduce } from "./reducer";
import type { ReactionState } from "./types";

const rng = () => mulberry32(99);

function start(): ReactionState {
  return reactionReduce(reactionInitialState(), { type: "START" }, rng());
}

describe("reactionInitialState", () => {
  it("starts idle with zeroed stats and a full timer", () => {
    const s = reactionInitialState();
    expect(s.phase).toBe("idle");
    expect(s.dot).toBeNull();
    expect(s.score).toBe(0);
    expect(s.hits).toBe(0);
    expect(s.misses).toBe(0);
    expect(s.timeLeftMs).toBe(REACTION_GAME_MS);
  });
});

describe("START", () => {
  it("transitions to playing and spawns a dot", () => {
    const s = start();
    expect(s.phase).toBe("playing");
    expect(s.dot).not.toBeNull();
    expect(s.score).toBe(0);
  });
});

describe("TAP", () => {
  it("awards points and spawns a new dot on a correct tap", () => {
    const s = start();
    const tapped = s.dot!.id;
    const next = reactionReduce(s, { type: "TAP", id: tapped }, rng());
    expect(next.score).toBe(POINTS_PER_DOT);
    expect(next.hits).toBe(1);
    expect(next.dot).not.toBeNull();
    expect(next.dot!.id).not.toBe(tapped);
    expect(next.lastHitId).toBe(tapped);
  });

  it("ignores taps on a stale dot id", () => {
    const s = start();
    const staleId = s.dot!.id - 999;
    const next = reactionReduce(s, { type: "TAP", id: staleId }, rng());
    expect(next).toEqual(s);
  });

  it("ignores taps while idle or over", () => {
    const idle = reactionInitialState();
    expect(reactionReduce(idle, { type: "TAP", id: 1 }, rng())).toEqual(idle);
  });

  it("awards the bonus on the 10th hit", () => {
    let s = start();
    for (let i = 0; i < 9; i++) {
      s = reactionReduce(s, { type: "TAP", id: s.dot!.id }, rng());
    }
    expect(s.hits).toBe(9);
    expect(s.score).toBe(9 * POINTS_PER_DOT);

    s = reactionReduce(s, { type: "TAP", id: s.dot!.id }, rng());
    expect(s.hits).toBe(10);
    expect(s.score).toBe(9 * POINTS_PER_DOT + POINTS_PER_DOT + BONUS_POINTS);
    expect(s.score).toBe(300);
  });
});

describe("TICK", () => {
  it("counts down the round timer", () => {
    const s = start();
    const next = reactionReduce(s, { type: "TICK", deltaMs: 1000 }, rng());
    expect(next.timeLeftMs).toBe(REACTION_GAME_MS - 1000);
    expect(next.phase).toBe("playing");
  });

  it("ends the round when time runs out", () => {
    const s = start();
    const next = reactionReduce(s, { type: "TICK", deltaMs: REACTION_GAME_MS + 1000 }, rng());
    expect(next.phase).toBe("over");
    expect(next.timeLeftMs).toBe(0);
  });

  it("expires the active dot as a miss and spawns a replacement after its lifetime elapses", () => {
    const s = start();
    const lifetime = s.dot!.lifeMs;
    const next = reactionReduce(s, { type: "TICK", deltaMs: lifetime + 1 }, rng());
    expect(next.misses).toBe(1);
    expect(next.dot).not.toBeNull();
    expect(next.dot!.id).not.toBe(s.dot!.id);
    expect(next.phase).toBe("playing");
  });

  it("does nothing while idle", () => {
    const idle = reactionInitialState();
    expect(reactionReduce(idle, { type: "TICK", deltaMs: 100 }, rng())).toEqual(idle);
  });
});

describe("RESET", () => {
  it("returns to the initial idle state", () => {
    const s = reactionReduce(start(), { type: "TAP", id: 1 }, rng());
    expect(reactionReduce(s, { type: "RESET" }, rng())).toEqual(reactionInitialState());
  });
});
