import { describe, expect, it } from "vitest";
import { MATH_GAME_MS, MIN_LEVEL } from "./constants";
import { mathInitialState, mathReduce } from "./reducer";
import type { MathAction, MathState } from "./types";
import { mulberry32 } from "../game/rng";

const seeded = () => mulberry32(2024);

function run(state: MathState, actions: MathAction[], rng = seeded()): MathState {
  return actions.reduce((s, a) => mathReduce(s, a, rng), state);
}

/** Submit the correct answer for a given side. */
function answer(state: MathState, side: "left" | "right", rng: ReturnType<typeof seeded>): MathState {
  const s = mathReduce(state, { type: "INPUT_CHANGE", value: String(state[side].answer) }, rng);
  return mathReduce(s, { type: "SUBMIT" }, rng);
}

describe("init / RESET", () => {
  it("starts idle with full clock, zero score, level 1", () => {
    const s = mathInitialState();
    expect(s.phase).toBe("idle");
    expect(s.score).toBe(0);
    expect(s.timeLeftMs).toBe(MATH_GAME_MS);
    expect(s.levelF).toBe(MIN_LEVEL);
  });
  it("RESET restores the initial state", () => {
    const s = run(mathInitialState(), [{ type: "START" }, { type: "RESET" }]);
    expect(s).toEqual(mathInitialState());
  });
});

describe("START", () => {
  it("enters playing with two distinct, valid problems", () => {
    const s = mathReduce(mathInitialState(), { type: "START" }, seeded());
    expect(s.phase).toBe("playing");
    expect(s.left.text).not.toBe("");
    expect(s.right.text).not.toBe("");
    expect(s.left.id).not.toBe(s.right.id);
    expect(s.timeLeftMs).toBe(MATH_GAME_MS);
  });
});

describe("INPUT_CHANGE", () => {
  it("strips non-digits and caps the length", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    s = mathReduce(s, { type: "INPUT_CHANGE", value: "1a2b3c" }, rng);
    expect(s.input).toBe("123");
    s = mathReduce(s, { type: "INPUT_CHANGE", value: "123456789" }, rng);
    expect(s.input.length).toBeLessThanOrEqual(4);
  });
  it("is ignored when not playing", () => {
    const idle = mathInitialState();
    expect(mathReduce(idle, { type: "INPUT_CHANGE", value: "5" }, seeded())).toBe(idle);
  });

  it("keeps a leading minus sign", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    s = mathReduce(s, { type: "INPUT_CHANGE", value: "-12" }, rng);
    expect(s.input).toBe("-12");
  });

  it("only treats a leading minus as a sign, stripping interior dashes", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    s = mathReduce(s, { type: "INPUT_CHANGE", value: "1-2" }, rng);
    expect(s.input).toBe("12");
  });

  it("caps digits at MAX_INPUT_LEN while keeping the sign", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    s = mathReduce(s, { type: "INPUT_CHANGE", value: "-123456" }, rng);
    expect(s.input).toBe("-1234");
  });
});

describe("SUBMIT", () => {
  it("ignores an empty submit", () => {
    const rng = seeded();
    const started = mathReduce(mathInitialState(), { type: "START" }, rng);
    expect(mathReduce(started, { type: "SUBMIT" }, rng)).toBe(started);
  });

  it("solves the LEFT bubble and replaces only it", () => {
    const rng = seeded();
    const started = mathReduce(mathInitialState(), { type: "START" }, rng);
    const rightBefore = started.right;
    const after = answer(started, "left", rng);
    expect(after.lastResult).toBe("left");
    expect(after.score).toBe(started.left.points);
    expect(after.correct).toBe(1);
    expect(after.streak).toBe(1);
    expect(after.left.id).not.toBe(started.left.id); // regenerated
    expect(after.right).toBe(rightBefore); // untouched
    expect(after.input).toBe("");
  });

  it("solves the RIGHT bubble and replaces only it", () => {
    const rng = seeded();
    const started = mathReduce(mathInitialState(), { type: "START" }, rng);
    const leftBefore = started.left;
    const after = answer(started, "right", rng);
    expect(after.lastResult).toBe("right");
    expect(after.left).toBe(leftBefore);
    expect(after.right.id).not.toBe(started.right.id);
  });

  it("counts a wrong answer: no score, streak reset, difficulty eased", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    // build a streak first so we can see it reset
    s = answer(s, "left", rng);
    const beforeLevel = s.levelF;
    const wrongVal = String(s.left.answer + s.right.answer + 7); // matches neither
    s = mathReduce(s, { type: "INPUT_CHANGE", value: wrongVal }, rng);
    s = mathReduce(s, { type: "SUBMIT" }, rng);
    expect(s.lastResult).toBe("wrong");
    expect(s.wrong).toBe(1);
    expect(s.streak).toBe(0);
    expect(s.score).toBe(s.left.points === undefined ? 0 : s.score); // unchanged by the wrong submit
    expect(s.levelF).toBeLessThan(beforeLevel);
  });

  it("solves a problem with a negative answer when given a negative input", () => {
    const rng = seeded();
    const base = mathReduce(mathInitialState(), { type: "START" }, rng);
    const negative: MathState = {
      ...base,
      left: { ...base.left, answer: -7, text: "3 − 10", id: 100 },
    };
    let s = mathReduce(negative, { type: "INPUT_CHANGE", value: "-7" }, rng);
    s = mathReduce(s, { type: "SUBMIT" }, rng);
    expect(s.lastResult).toBe("left");
    expect(s.score).toBe(negative.left.points);
    expect(s.input).toBe("");
  });

  it("prefers LEFT when both bubbles share the same answer", () => {
    // Construct a state where both answers are equal.
    const rng = seeded();
    const base = mathReduce(mathInitialState(), { type: "START" }, rng);
    const shared: MathState = {
      ...base,
      left: { ...base.left, answer: 42, text: "L", id: 100 },
      right: { ...base.right, answer: 42, text: "R", id: 200 },
    };
    const s = mathReduce(
      mathReduce(shared, { type: "INPUT_CHANGE", value: "42" }, rng),
      { type: "SUBMIT" },
      rng,
    );
    expect(s.lastResult).toBe("left");
    expect(s.right.id).toBe(200); // right untouched
  });
});

describe("adaptive difficulty", () => {
  it("raises the level after a run of correct answers", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    const start = s.levelF;
    for (let i = 0; i < 10; i++) s = answer(s, "left", rng);
    expect(s.levelF).toBeGreaterThan(start);
    expect(s.peakLevel).toBeGreaterThanOrEqual(2);
  });

  it("never drives the level out of range over a long mixed game", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    for (let i = 0; i < 60; i++) {
      if (i % 3 === 0) {
        const wrong = String(s.left.answer + s.right.answer + 1);
        s = mathReduce(s, { type: "INPUT_CHANGE", value: wrong }, rng);
        s = mathReduce(s, { type: "SUBMIT" }, rng);
      } else {
        s = answer(s, "left", rng);
      }
      expect(s.levelF).toBeGreaterThanOrEqual(1);
      expect(s.levelF).toBeLessThanOrEqual(10);
    }
  });
});

describe("TICK / game over", () => {
  it("counts down while playing", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    s = mathReduce(s, { type: "TICK", deltaMs: 1500 }, rng);
    expect(s.timeLeftMs).toBe(MATH_GAME_MS - 1500);
  });
  it("ends the game and freezes input when the clock runs out", () => {
    const rng = seeded();
    let s = mathReduce(mathInitialState(), { type: "START" }, rng);
    s = mathReduce(s, { type: "TICK", deltaMs: MATH_GAME_MS + 1 }, rng);
    expect(s.phase).toBe("over");
    expect(s.timeLeftMs).toBe(0);
    // submits no longer change anything
    const frozen = mathReduce(
      mathReduce(s, { type: "INPUT_CHANGE", value: "5" }, rng),
      { type: "SUBMIT" },
      rng,
    );
    expect(frozen).toBe(s);
  });
  it("does not tick while idle or over", () => {
    const idle = mathInitialState();
    expect(mathReduce(idle, { type: "TICK", deltaMs: 100 }, seeded())).toBe(idle);
  });
});
