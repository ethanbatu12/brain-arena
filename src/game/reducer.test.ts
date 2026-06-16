import { describe, expect, it } from "vitest";
import { GAME_MS, GRID_MIN, GRID_START, GROWTH_STREAK } from "./constants";
import { roundScore } from "./logic";
import { mulberry32 } from "./rng";
import { initialState, reduce } from "./reducer";
import type { Action, GameState } from "./types";

/** Build a fresh seeded rng per test for deterministic patterns. */
const seeded = () => mulberry32(12345);

/** Apply a sequence of actions with one shared rng. */
function run(state: GameState, actions: Action[], rng = seeded()): GameState {
  return actions.reduce((s, a) => reduce(s, a, rng), state);
}

/** Drive a round to a win by clicking every pattern cell. */
function winRound(state: GameState, rng: ReturnType<typeof seeded>): GameState {
  let s = reduce(state, { type: "MEMORIZE_DONE" }, rng);
  for (const cell of s.pattern) {
    s = reduce(s, { type: "CLICK_CELL", index: cell }, rng);
  }
  return s;
}

describe("initialState / RESET", () => {
  it("starts idle with a full clock and zero score", () => {
    const s = initialState();
    expect(s.phase).toBe("idle");
    expect(s.score).toBe(0);
    expect(s.timeLeftMs).toBe(GAME_MS);
    expect(s.gridSize).toBe(GRID_START);
  });
  it("RESET returns to the initial state from anywhere", () => {
    const s = run(initialState(), [{ type: "START" }, { type: "RESET" }]);
    expect(s).toEqual(initialState());
  });
});

describe("START", () => {
  it("enters memorize with a generated pattern and full clock", () => {
    const s = reduce(initialState(), { type: "START" }, seeded());
    expect(s.phase).toBe("memorize");
    expect(s.gridSize).toBe(GRID_START);
    expect(s.pattern.size).toBeGreaterThan(0);
    expect(s.round).toBe(1);
    expect(s.timeLeftMs).toBe(GAME_MS);
  });
});

describe("MEMORIZE_DONE", () => {
  it("moves memorize -> recall", () => {
    const rng = seeded();
    const s = run(initialState(), [{ type: "START" }, { type: "MEMORIZE_DONE" }], rng);
    expect(s.phase).toBe("recall");
  });
  it("is ignored outside the memorize phase", () => {
    const before = initialState();
    expect(reduce(before, { type: "MEMORIZE_DONE" }, seeded())).toBe(before);
  });
});

describe("CLICK_CELL", () => {
  it("is ignored while idle, in feedback, or over", () => {
    const rng = seeded();
    const idle = initialState();
    expect(reduce(idle, { type: "CLICK_CELL", index: 0 }, rng)).toBe(idle);
    const feedback: GameState = { ...idle, phase: "feedback" };
    expect(reduce(feedback, { type: "CLICK_CELL", index: 0 }, rng)).toBe(feedback);
    const over: GameState = { ...idle, phase: "over" };
    expect(reduce(over, { type: "CLICK_CELL", index: 0 }, rng)).toBe(over);
  });

  it("accepts a correct tap during the reveal and commits to recall", () => {
    const rng = seeded();
    const memorizing = reduce(initialState(), { type: "START" }, rng);
    expect(memorizing.phase).toBe("memorize");
    const first = [...memorizing.pattern][0];
    const after = reduce(memorizing, { type: "CLICK_CELL", index: first }, rng);
    expect(after.found.has(first)).toBe(true);
    expect(after.phase).toBe("recall"); // reveal hides on first tap
  });

  it("lets a wrong tap during the reveal end the round", () => {
    const rng = seeded();
    const memorizing = reduce(initialState(), { type: "START" }, rng);
    const total = memorizing.gridSize * memorizing.gridSize;
    const wrongCell = Array.from({ length: total }, (_, i) => i).find(
      (i) => !memorizing.pattern.has(i),
    )!;
    const after = reduce(memorizing, { type: "CLICK_CELL", index: wrongCell }, rng);
    expect(after.phase).toBe("feedback");
    expect(after.lastRoundCorrect).toBe(false);
  });

  it("can win a round entirely during the reveal without MEMORIZE_DONE", () => {
    const rng = seeded();
    let s = reduce(initialState(), { type: "START" }, rng);
    for (const cell of s.pattern) {
      s = reduce(s, { type: "CLICK_CELL", index: cell }, rng);
    }
    expect(s.phase).toBe("feedback");
    expect(s.lastRoundCorrect).toBe(true);
    expect(s.roundsWon).toBe(1);
  });

  it("records a correct click and stays in recall until complete", () => {
    const rng = seeded();
    let s = run(initialState(), [{ type: "START" }, { type: "MEMORIZE_DONE" }], rng);
    const first = [...s.pattern][0];
    s = reduce(s, { type: "CLICK_CELL", index: first }, rng);
    // pattern has >1 cell, so still recalling
    expect(s.phase).toBe("recall");
    expect(s.found.has(first)).toBe(true);
  });

  it("ignores a repeated click on an already-found cell (no double count)", () => {
    const rng = seeded();
    let s = run(initialState(), [{ type: "START" }, { type: "MEMORIZE_DONE" }], rng);
    const first = [...s.pattern][0];
    s = reduce(s, { type: "CLICK_CELL", index: first }, rng);
    const again = reduce(s, { type: "CLICK_CELL", index: first }, rng);
    expect(again).toBe(s);
    expect(again.found.size).toBe(1);
  });

  it("awards points and wins the round when the full pattern is clicked", () => {
    const rng = seeded();
    const started = run(initialState(), [{ type: "START" }], rng);
    const won = winRound(started, rng);
    expect(won.phase).toBe("feedback");
    expect(won.lastRoundCorrect).toBe(true);
    expect(won.score).toBe(roundScore(GRID_START));
    expect(won.roundsWon).toBe(1);
  });

  it("loses the round immediately on a wrong cell with no points", () => {
    const rng = seeded();
    let s = run(initialState(), [{ type: "START" }, { type: "MEMORIZE_DONE" }], rng);
    // find a cell NOT in the pattern
    const total = s.gridSize * s.gridSize;
    let wrongCell = -1;
    for (let i = 0; i < total; i++) if (!s.pattern.has(i)) { wrongCell = i; break; }
    s = reduce(s, { type: "CLICK_CELL", index: wrongCell }, rng);
    expect(s.phase).toBe("feedback");
    expect(s.lastRoundCorrect).toBe(false);
    expect(s.wrong).toBe(wrongCell);
    expect(s.score).toBe(0);
    expect(s.roundsWon).toBe(0);
  });

  it("does not score a partial round (points only on full completion)", () => {
    const rng = seeded();
    let s = run(initialState(), [{ type: "START" }, { type: "MEMORIZE_DONE" }], rng);
    const cells = [...s.pattern];
    // click all but the last correct cell, then a wrong one
    for (let i = 0; i < cells.length - 1; i++) {
      s = reduce(s, { type: "CLICK_CELL", index: cells[i] }, rng);
    }
    expect(s.score).toBe(0);
    const total = s.gridSize * s.gridSize;
    const wrongCell = Array.from({ length: total }, (_, i) => i).find((i) => !s.pattern.has(i))!;
    s = reduce(s, { type: "CLICK_CELL", index: wrongCell }, rng);
    expect(s.lastRoundCorrect).toBe(false);
    expect(s.score).toBe(0);
  });
});

describe("FEEDBACK_DONE -> next round", () => {
  it("does not grow the board after a single win, but advances the growth streak", () => {
    const rng = seeded();
    const won = winRound(run(initialState(), [{ type: "START" }], rng), rng);
    const next = reduce(won, { type: "FEEDBACK_DONE" }, rng);
    expect(next.phase).toBe("memorize");
    expect(next.gridSize).toBe(GRID_START);
    expect(next.growthStreak).toBe(1);
    expect(next.round).toBe(2);
    expect(next.found.size).toBe(0);
    expect(next.wrong).toBeNull();
  });

  it("grows the board after GROWTH_STREAK consecutive wins and resets the streak", () => {
    const rng = seeded();
    let s = run(initialState(), [{ type: "START" }], rng);
    for (let i = 0; i < GROWTH_STREAK; i++) {
      s = winRound(s, rng);
      s = reduce(s, { type: "FEEDBACK_DONE" }, rng);
    }
    expect(s.gridSize).toBe(GRID_START + 1);
    expect(s.growthStreak).toBe(0);
    expect(s.peakSize).toBe(GRID_START + 1);
  });

  it("shrinks the board after a loss and resets the growth streak, but not below the minimum", () => {
    const rng = seeded();
    // start, go to recall, click wrong
    let s = run(initialState(), [{ type: "START" }, { type: "MEMORIZE_DONE" }], rng);
    const wrongCell = Array.from({ length: s.gridSize * s.gridSize }, (_, i) => i).find((i) => !s.pattern.has(i))!;
    s = reduce(s, { type: "CLICK_CELL", index: wrongCell }, rng);
    s = reduce(s, { type: "FEEDBACK_DONE" }, rng);
    expect(s.gridSize).toBe(GRID_MIN);
    expect(s.growthStreak).toBe(0);
  });

  it("is ignored outside the feedback phase", () => {
    const before = reduce(initialState(), { type: "START" }, seeded());
    expect(reduce(before, { type: "FEEDBACK_DONE" }, seeded())).toBe(before);
  });
});

describe("TICK / game over", () => {
  it("counts down while playing", () => {
    const rng = seeded();
    let s = reduce(initialState(), { type: "START" }, rng);
    s = reduce(s, { type: "TICK", deltaMs: 1000 }, rng);
    expect(s.timeLeftMs).toBe(GAME_MS - 1000);
    expect(s.phase).toBe("memorize");
  });

  it("ends the game when the clock runs out from any active phase", () => {
    const rng = seeded();
    let s = run(initialState(), [{ type: "START" }, { type: "MEMORIZE_DONE" }], rng);
    s = reduce(s, { type: "TICK", deltaMs: GAME_MS + 5 }, rng);
    expect(s.phase).toBe("over");
    expect(s.timeLeftMs).toBe(0);
  });

  it("does not tick while idle or over", () => {
    const idle = initialState();
    expect(reduce(idle, { type: "TICK", deltaMs: 1000 }, seeded())).toBe(idle);
    const over: GameState = { ...idle, phase: "over" };
    expect(reduce(over, { type: "TICK", deltaMs: 1000 }, seeded())).toBe(over);
  });

  it("freezes input once the game is over", () => {
    const rng = seeded();
    const over: GameState = { ...initialState(), phase: "over" };
    expect(reduce(over, { type: "CLICK_CELL", index: 0 }, rng)).toBe(over);
    expect(reduce(over, { type: "MEMORIZE_DONE" }, rng)).toBe(over);
  });
});

describe("full game flow integration", () => {
  it("plays several winning rounds, accumulating score and growing the board", () => {
    const rng = seeded();
    let s = reduce(initialState(), { type: "START" }, rng);
    let expectedScore = 0;
    for (let i = 0; i < 3; i++) {
      s = winRound(s, rng);
      expectedScore += roundScore(s.gridSize);
      s = reduce(s, { type: "FEEDBACK_DONE" }, rng);
    }
    expect(s.score).toBe(expectedScore);
    expect(s.gridSize).toBe(GRID_START + 1);
    expect(s.roundsWon).toBe(3);
  });

  it("never lets the board leave [GRID_MIN, GRID_MAX] over a long mixed game", () => {
    const rng = seeded();
    let s = reduce(initialState(), { type: "START" }, rng);
    for (let i = 0; i < 30; i++) {
      // alternate wins and losses
      if (i % 2 === 0) {
        s = winRound(s, rng);
      } else {
        s = reduce(s, { type: "MEMORIZE_DONE" }, rng);
        const wrong = Array.from({ length: s.gridSize * s.gridSize }, (_, k) => k).find((k) => !s.pattern.has(k))!;
        s = reduce(s, { type: "CLICK_CELL", index: wrong }, rng);
      }
      s = reduce(s, { type: "FEEDBACK_DONE" }, rng);
      expect(s.gridSize).toBeGreaterThanOrEqual(GRID_MIN);
      expect(s.gridSize).toBeLessThanOrEqual(8);
    }
  });
});
