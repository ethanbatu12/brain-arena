import { describe, expect, it } from "vitest";
import { MAX_LEVEL, MIN_LEVEL } from "./constants";
import {
  clampLevel,
  countBorrows,
  countCarries,
  levelBand,
  makeProblem,
  nextLevel,
  opsForBand,
  problemPoints,
} from "./logic";
import { mulberry32 } from "../game/rng";

describe("clampLevel / levelBand", () => {
  it("clamps to [MIN_LEVEL, MAX_LEVEL]", () => {
    expect(clampLevel(-3)).toBe(MIN_LEVEL);
    expect(clampLevel(99)).toBe(MAX_LEVEL);
    expect(clampLevel(Number.NaN)).toBe(MIN_LEVEL);
  });
  it("floors a float rating into an integer band", () => {
    expect(levelBand(3.9)).toBe(3);
    expect(levelBand(1)).toBe(1);
  });
});

describe("nextLevel", () => {
  it("rises on correct, falls on wrong", () => {
    expect(nextLevel(3, true, 0.34, 0.5)).toBeCloseTo(3.34);
    expect(nextLevel(3, false, 0.34, 0.5)).toBeCloseTo(2.5);
  });
  it("never leaves the legal range", () => {
    expect(nextLevel(MAX_LEVEL, true, 1, 1)).toBe(MAX_LEVEL);
    expect(nextLevel(MIN_LEVEL, false, 1, 1)).toBe(MIN_LEVEL);
  });
});

describe("countCarries / countBorrows", () => {
  it("counts carries in addition", () => {
    expect(countCarries(15, 24)).toBe(0); // 5+4=9, 1+2=3
    expect(countCarries(58, 67)).toBe(2); // units carry, tens carry
  });
  it("counts borrows in subtraction", () => {
    expect(countBorrows(45, 23)).toBe(0);
    expect(countBorrows(52, 27)).toBe(1); // 2-7 borrows
  });
});

describe("opsForBand", () => {
  it("unlocks operations progressively", () => {
    expect(opsForBand(1)).toEqual(["+"]);
    expect(opsForBand(2)).toContain("-");
    expect(opsForBand(5)).toContain("×");
    expect(opsForBand(6)).toContain("÷");
  });
});

describe("problemPoints", () => {
  it("rewards an easy add modestly and a hard multiply richly", () => {
    expect(problemPoints("+", 15, 24, 39)).toBe(10);
    expect(problemPoints("×", 87, 9, 783)).toBeGreaterThan(40);
  });
  it("is always positive across operations", () => {
    expect(problemPoints("+", 10, 10, 20)).toBeGreaterThan(0);
    expect(problemPoints("-", 99, 10, 89)).toBeGreaterThan(0);
    expect(problemPoints("÷", 72, 8, 9)).toBeGreaterThan(0);
  });
});

describe("makeProblem — arithmetic validity (fuzzed across all bands)", () => {
  it("always produces a correct, well-formed problem", () => {
    for (let band = MIN_LEVEL; band <= MAX_LEVEL; band++) {
      const rng = mulberry32(band * 7 + 1);
      for (let i = 0; i < 200; i++) {
        const p = makeProblem(band, rng, i);
        switch (p.op) {
          case "+":
            expect(p.a + p.b).toBe(p.answer);
            break;
          case "-":
            expect(p.a - p.b).toBe(p.answer);
            expect(p.answer).toBeGreaterThanOrEqual(0); // never negative
            break;
          case "×":
            expect(p.a * p.b).toBe(p.answer);
            break;
          case "÷":
            expect(p.a / p.b).toBe(p.answer);
            expect(Number.isInteger(p.answer)).toBe(true); // exact division
            break;
        }
        expect(p.points).toBeGreaterThan(0);
        expect(p.text).toContain(String(p.a)); // text is well-formed
        expect(p.text).toContain(String(p.b));
      }
    }
  });

  it("only uses + on the easiest band", () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      expect(makeProblem(1, rng, i).op).toBe("+");
    }
  });

  it("keeps multiplication to 2-digit × 1-digit at the top band", () => {
    const rng = mulberry32(55);
    for (let i = 0; i < 300; i++) {
      const p = makeProblem(MAX_LEVEL, rng, i);
      if (p.op === "×") {
        expect(p.a).toBeGreaterThanOrEqual(10);
        expect(p.a).toBeLessThanOrEqual(99);
        expect(p.b).toBeGreaterThanOrEqual(2);
        expect(p.b).toBeLessThanOrEqual(9);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const p1 = makeProblem(6, mulberry32(42), 1);
    const p2 = makeProblem(6, mulberry32(42), 1);
    expect(p1).toEqual(p2);
  });
});
