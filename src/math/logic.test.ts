import { describe, expect, it } from "vitest";
import { MAX_LEVEL, MIN_LEVEL } from "./constants";
import {
  clampLevel,
  countBorrows,
  countCarries,
  levelBand,
  makeProblem,
  negativeChance,
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
    expect(problemPoints("+", 15, 24, 39)).toBe(20);
    expect(problemPoints("×", 87, 9, 783)).toBeGreaterThan(80);
  });
  it("is always positive across operations", () => {
    expect(problemPoints("+", 10, 10, 20)).toBeGreaterThan(0);
    expect(problemPoints("-", 99, 10, 89)).toBeGreaterThan(0);
    expect(problemPoints("÷", 72, 8, 9)).toBeGreaterThan(0);
  });

  it("awards a bonus when an operand or the result is negative", () => {
    const plain = problemPoints("+", 10, 20, 30);
    const withNegativeAddend = problemPoints("+", -10, 20, 10);
    const withNegativeResult = problemPoints("-", 10, 20, -10);
    expect(withNegativeAddend).toBe(plain + 10);
    expect(withNegativeResult).toBe(problemPoints("-", 10, 20, 10) + 10);
  });

  it("stays positive even with negative operands (no infinite loops)", () => {
    expect(problemPoints("+", -15, 24, 9)).toBeGreaterThan(0);
    expect(problemPoints("-", 10, 30, -20)).toBeGreaterThan(0);
    expect(problemPoints("×", 12, -4, -48)).toBeGreaterThan(0);
  });
});

describe("negativeChance", () => {
  it("is zero below the unlock band", () => {
    expect(negativeChance(3, 5)).toBe(0);
    expect(negativeChance(4, 5)).toBe(0);
  });
  it("starts low right at the unlock band and grows with band", () => {
    expect(negativeChance(5, 5)).toBeCloseTo(0.2);
    expect(negativeChance(6, 5)).toBeCloseTo(0.4);
  });
  it("never exceeds 0.6", () => {
    for (let band = MIN_LEVEL; band <= MAX_LEVEL; band++) {
      expect(negativeChance(band, 1)).toBeLessThanOrEqual(0.6);
    }
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
            expect(Number.isInteger(p.answer)).toBe(true);
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
        expect(Math.abs(p.b)).toBeGreaterThanOrEqual(2);
        expect(Math.abs(p.b)).toBeLessThanOrEqual(9);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const p1 = makeProblem(6, mulberry32(42), 1);
    const p2 = makeProblem(6, mulberry32(42), 1);
    expect(p1).toEqual(p2);
  });
});

describe("makeProblem — negative numbers introduced gradually", () => {
  it("keeps addition non-negative below the unlock band", () => {
    for (let band = 1; band < 5; band++) {
      const rng = mulberry32(band * 13 + 3);
      for (let i = 0; i < 100; i++) {
        const p = makeProblem(band, rng, i);
        if (p.op === "+") {
          expect(p.a).toBeGreaterThanOrEqual(0);
          expect(p.b).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("eventually produces a negative addend from the unlock band", () => {
    let sawNegative = false;
    for (let seed = 0; seed < 50; seed++) {
      const p = makeProblem(MAX_LEVEL, mulberry32(seed), 1);
      if (p.op === "+" && (p.a < 0 || p.b < 0)) sawNegative = true;
    }
    expect(sawNegative).toBe(true);
  });

  it("keeps subtraction results non-negative below the unlock band", () => {
    for (let band = 1; band < 4; band++) {
      const rng = mulberry32(band * 17 + 5);
      for (let i = 0; i < 100; i++) {
        const p = makeProblem(band, rng, i);
        if (p.op === "-") {
          expect(p.answer).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("eventually produces a negative subtraction result from the unlock band", () => {
    let sawNegative = false;
    for (let seed = 0; seed < 50; seed++) {
      const p = makeProblem(MAX_LEVEL, mulberry32(seed), 1);
      if (p.op === "-" && p.answer < 0) sawNegative = true;
    }
    expect(sawNegative).toBe(true);
  });

  it("keeps the multiplier non-negative below the unlock band", () => {
    for (let band = 1; band < 7; band++) {
      const rng = mulberry32(band * 19 + 7);
      for (let i = 0; i < 100; i++) {
        const p = makeProblem(band, rng, i);
        if (p.op === "×") {
          expect(p.b).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("eventually produces a negative multiplier at the top band", () => {
    let sawNegative = false;
    for (let seed = 0; seed < 50; seed++) {
      const p = makeProblem(MAX_LEVEL, mulberry32(seed), 1);
      if (p.op === "×" && p.b < 0) {
        sawNegative = true;
        expect(p.text).toMatch(/^\d+ × \(-\d+\)$/);
      }
    }
    expect(sawNegative).toBe(true);
  });

  it("keeps division positive at every band", () => {
    for (let band = MIN_LEVEL; band <= MAX_LEVEL; band++) {
      const rng = mulberry32(band * 23 + 11);
      for (let i = 0; i < 100; i++) {
        const p = makeProblem(band, rng, i);
        if (p.op === "÷") {
          expect(p.a).toBeGreaterThan(0);
          expect(p.b).toBeGreaterThan(0);
          expect(p.answer).toBeGreaterThan(0);
        }
      }
    }
  });
});
