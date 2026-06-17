import { describe, expect, it } from "vitest";
import { BONUS_EVERY, BONUS_POINTS, PATTERN_GAME_MS } from "./constants";
import { patternInitialState, patternReduce } from "./reducer";
import { mulberry32 } from "../game/rng";
import type { PatternAction } from "./types";

function rng() {
  return mulberry32(42);
}

function reduce(
  state = patternInitialState(),
  action: PatternAction,
  seed = 42,
) {
  return patternReduce(state, action, mulberry32(seed));
}

describe("patternInitialState", () => {
  it("starts idle with zeroed stats", () => {
    const s = patternInitialState();
    expect(s.phase).toBe("idle");
    expect(s.score).toBe(0);
    expect(s.timeLeftMs).toBe(PATTERN_GAME_MS);
    expect(s.correct).toBe(0);
    expect(s.wrong).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.current).toBeNull();
  });
});

describe("START action", () => {
  it("transitions to playing and provides a first pattern", () => {
    const s = reduce(patternInitialState(), { type: "START" });
    expect(s.phase).toBe("playing");
    expect(s.current).not.toBeNull();
  });
});

describe("TICK action", () => {
  it("decrements the timer while playing", () => {
    let s = reduce(patternInitialState(), { type: "START" });
    s = patternReduce(s, { type: "TICK", deltaMs: 5000 }, mulberry32(1));
    expect(s.timeLeftMs).toBe(PATTERN_GAME_MS - 5000);
    expect(s.phase).toBe("playing");
  });

  it("ends the game when timer reaches zero", () => {
    let s = reduce(patternInitialState(), { type: "START" });
    s = patternReduce(s, { type: "TICK", deltaMs: PATTERN_GAME_MS + 100 }, mulberry32(1));
    expect(s.phase).toBe("over");
    expect(s.timeLeftMs).toBe(0);
  });

  it("does nothing while idle", () => {
    const s = reduce(patternInitialState(), { type: "TICK", deltaMs: 1000 });
    expect(s.phase).toBe("idle");
    expect(s.timeLeftMs).toBe(PATTERN_GAME_MS);
  });
});

describe("ANSWER action — correct", () => {
  it("increments score, correct count, and streak", () => {
    const r = rng();
    let s = patternReduce(patternInitialState(), { type: "START" }, r);
    const answer = s.current!.answer;
    const points = s.current!.points;
    s = patternReduce(s, { type: "ANSWER", value: answer }, r);

    expect(s.correct).toBe(1);
    expect(s.wrong).toBe(0);
    expect(s.streak).toBe(1);
    expect(s.score).toBe(points);
    expect(s.lastResult).toBe("correct");
    expect(s.current).not.toBeNull(); // new puzzle loaded
  });

  it("awards a bonus every BONUS_EVERY correct answers", () => {
    const r = rng();
    let s = patternReduce(patternInitialState(), { type: "START" }, r);

    // Answer BONUS_EVERY puzzles correctly
    for (let i = 0; i < BONUS_EVERY; i++) {
      const answer = s.current!.answer;
      s = patternReduce(s, { type: "ANSWER", value: answer }, r);
    }

    // Score should include BONUS_POINTS for the milestone
    expect(s.score).toBeGreaterThan(BONUS_EVERY * 50); // at least base + bonus
    expect(s.bonusCount).toBe(1);
  });

  it("updates bestStreak and peakLevel", () => {
    const r = rng();
    let s = patternReduce(patternInitialState(), { type: "START" }, r);
    s = patternReduce(s, { type: "ANSWER", value: s.current!.answer }, r);
    s = patternReduce(s, { type: "ANSWER", value: s.current!.answer }, r);

    expect(s.bestStreak).toBeGreaterThanOrEqual(2);
    expect(s.peakLevel).toBeGreaterThanOrEqual(1);
  });
});

describe("ANSWER action — wrong", () => {
  it("increments wrong, resets streak, does not change score", () => {
    const r = rng();
    let s = patternReduce(patternInitialState(), { type: "START" }, r);
    const initialScore = s.score;
    s = patternReduce(s, { type: "ANSWER", value: "__definitely_wrong__" }, r);

    expect(s.wrong).toBe(1);
    expect(s.correct).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.score).toBe(initialScore); // no points for wrong
    expect(s.lastResult).toBe("wrong");
  });

  it("eases difficulty down on a wrong answer", () => {
    const r = rng();
    // Start at a mid level
    let s = patternReduce(patternInitialState(), { type: "START" }, r);
    // Answer several correct to get level up
    for (let i = 0; i < 5; i++) {
      s = patternReduce(s, { type: "ANSWER", value: s.current!.answer }, r);
    }
    const levelBefore = s.levelF;
    s = patternReduce(s, { type: "ANSWER", value: "__wrong__" }, r);
    expect(s.levelF).toBeLessThan(levelBefore);
  });
});

describe("RESET action", () => {
  it("returns to initial state", () => {
    const r = rng();
    let s = patternReduce(patternInitialState(), { type: "START" }, r);
    s = patternReduce(s, { type: "ANSWER", value: s.current!.answer }, r);
    s = patternReduce(s, { type: "RESET" }, r);

    expect(s).toEqual(patternInitialState());
  });
});

describe("scoring integration — bonus every 5 correct", () => {
  it("awards bonus exactly once after 5 corrects and again after 10", () => {
    const r = rng();
    let s = patternReduce(patternInitialState(), { type: "START" }, r);

    for (let i = 0; i < BONUS_EVERY * 2; i++) {
      s = patternReduce(s, { type: "ANSWER", value: s.current!.answer }, r);
    }

    expect(s.bonusCount).toBe(2);
    expect(s.correct).toBe(BONUS_EVERY * 2);
    expect(s.score).toBeGreaterThan(BONUS_EVERY * 2 * 50 + BONUS_POINTS); // base + at least 2 bonuses
  });

  it("streak resets after a wrong answer but bonusCount does not", () => {
    const r = rng();
    let s = patternReduce(patternInitialState(), { type: "START" }, r);
    for (let i = 0; i < BONUS_EVERY; i++) {
      s = patternReduce(s, { type: "ANSWER", value: s.current!.answer }, r);
    }
    const bonusCountAfterBonus = s.bonusCount;
    s = patternReduce(s, { type: "ANSWER", value: "__wrong__" }, r);

    expect(s.streak).toBe(0);
    expect(s.bonusCount).toBe(bonusCountAfterBonus); // bonus milestone preserved
  });
});
