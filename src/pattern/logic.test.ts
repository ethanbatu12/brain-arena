import { describe, expect, it } from "vitest";
import { MAX_LEVEL, MIN_LEVEL } from "./constants";
import {
  clampLevel,
  kindsForBand,
  levelBand,
  makePattern,
  nextLevel,
  nthPrime,
  pointsForBand,
} from "./logic";
import { mulberry32 } from "../game/rng";

describe("clampLevel / levelBand", () => {
  it("clamps to [MIN_LEVEL, MAX_LEVEL]", () => {
    expect(clampLevel(-5)).toBe(MIN_LEVEL);
    expect(clampLevel(99)).toBe(MAX_LEVEL);
    expect(clampLevel(Number.NaN)).toBe(MIN_LEVEL);
  });

  it("floors a float to integer band", () => {
    expect(levelBand(3.9)).toBe(3);
    expect(levelBand(1.0)).toBe(1);
    expect(levelBand(10)).toBe(10);
  });
});

describe("nextLevel", () => {
  it("rises on correct, falls on wrong", () => {
    expect(nextLevel(3, true, 0.4, 0.6)).toBeCloseTo(3.4);
    expect(nextLevel(3, false, 0.4, 0.6)).toBeCloseTo(2.4);
  });

  it("never leaves the legal range", () => {
    expect(nextLevel(MAX_LEVEL, true, 1, 1)).toBe(MAX_LEVEL);
    expect(nextLevel(MIN_LEVEL, false, 1, 1)).toBe(MIN_LEVEL);
  });
});

describe("pointsForBand", () => {
  it("is 75 at band 1 and grows with band", () => {
    expect(pointsForBand(1)).toBe(75);
    expect(pointsForBand(10)).toBe(120);
    expect(pointsForBand(5)).toBeGreaterThan(pointsForBand(3));
  });
});

describe("nthPrime", () => {
  it("returns known primes in order", () => {
    expect(nthPrime(0)).toBe(2);
    expect(nthPrime(1)).toBe(3);
    expect(nthPrime(2)).toBe(5);
    expect(nthPrime(4)).toBe(11);
  });
});

describe("kindsForBand", () => {
  it("only returns easy kinds at band 1", () => {
    const kinds = kindsForBand(1);
    expect(kinds).toContain("arithmetic-add");
    expect(kinds).not.toContain("fibonacci");
    expect(kinds).not.toContain("cubes");
  });

  it("includes harder kinds at high bands", () => {
    const kinds = kindsForBand(9);
    expect(kinds).toContain("fibonacci");
    expect(kinds).toContain("squares");
    expect(kinds).toContain("cubes");
  });
});

describe("makePattern — structural invariants across all bands", () => {
  it("always produces a valid pattern with an answer and exactly 3 distractors", () => {
    for (let band = MIN_LEVEL; band <= MAX_LEVEL; band++) {
      const rng = mulberry32(band * 31 + 7);
      for (let i = 0; i < 100; i++) {
        const p = makePattern(band, rng);
        // Exactly one gap
        const gaps = p.terms.filter((t) => t === null);
        expect(gaps).toHaveLength(1);
        // Gap is at gapIndex
        expect(p.terms[p.gapIndex]).toBeNull();
        // Answer is a non-empty string
        expect(typeof p.answer).toBe("string");
        expect(p.answer.length).toBeGreaterThan(0);
        // Exactly 3 distractors
        expect(p.distractors).toHaveLength(3);
        // Distractors do not contain the correct answer
        expect(p.distractors).not.toContain(p.answer);
        // Points are positive
        expect(p.points).toBeGreaterThan(0);
        // Gap is not at position 0 or last
        expect(p.gapIndex).toBeGreaterThan(0);
        expect(p.gapIndex).toBeLessThan(p.terms.length - 1);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const p1 = makePattern(5, mulberry32(42));
    const p2 = makePattern(5, mulberry32(42));
    expect(p1).toEqual(p2);
  });

  it("only produces letter values for alphabet kinds", () => {
    let sawAlpha = false;
    // Band 1 has no alphabet kinds; use band 3 where alphabet-add can appear
    for (let seed = 0; seed < 200; seed++) {
      const p = makePattern(3, mulberry32(seed));
      if (p.kind === "alphabet-add" || p.kind === "alphabet-skip") {
        sawAlpha = true;
        // Every non-null term is a single uppercase letter
        for (const t of p.terms) {
          if (t !== null) {
            expect(typeof t).toBe("string");
            expect((t as string).length).toBe(1);
            expect(/^[A-Z]$/.test(t as string)).toBe(true);
          }
        }
        expect(/^[A-Z]$/.test(p.answer)).toBe(true);
        for (const d of p.distractors) {
          expect(/^[A-Z]$/.test(d)).toBe(true);
        }
      }
    }
    expect(sawAlpha).toBe(true);
  });

  it("arithmetic-add answer equals start + step*gapIndex", () => {
    for (let seed = 0; seed < 50; seed++) {
      const p = makePattern(2, mulberry32(seed));
      if (p.kind !== "arithmetic-add") continue;
      const terms = p.terms.filter((t) => t !== null) as number[];
      // Reconstruct step from two consecutive non-null adjacent terms
      let step: number | null = null;
      for (let j = 1; j < p.terms.length; j++) {
        if (p.terms[j] !== null && p.terms[j - 1] !== null) {
          step = (p.terms[j] as number) - (p.terms[j - 1] as number);
          break;
        }
      }
      expect(step).not.toBeNull();
      // Verify answer is consistent with the step
      const idx = p.gapIndex;
      if (idx > 0 && p.terms[idx - 1] !== null) {
        expect(Number(p.answer)).toBe((p.terms[idx - 1] as number) + step!);
      }
      if (idx < p.terms.length - 1 && p.terms[idx + 1] !== null) {
        expect(Number(p.answer)).toBe((p.terms[idx + 1] as number) - step!);
      }
      void terms; // used for clarity
    }
  });

  it("fibonacci answer equals sum of two preceding terms (where visible)", () => {
    let checked = 0;
    for (let seed = 0; seed < 300; seed++) {
      const p = makePattern(5, mulberry32(seed));
      if (p.kind !== "fibonacci") continue;
      const idx = p.gapIndex;
      // Can only verify if both previous terms are visible
      if (idx >= 2 && p.terms[idx - 2] !== null && p.terms[idx - 1] !== null) {
        const expected = (p.terms[idx - 2] as number) + (p.terms[idx - 1] as number);
        expect(Number(p.answer)).toBe(expected);
        checked++;
        if (checked >= 5) break;
      }
    }
  });

  it("squares answer is a perfect square", () => {
    let checked = 0;
    for (let seed = 0; seed < 200; seed++) {
      const p = makePattern(6, mulberry32(seed));
      if (p.kind !== "squares") continue;
      const n = Math.round(Math.sqrt(Number(p.answer)));
      expect(n * n).toBe(Number(p.answer));
      checked++;
      if (checked >= 5) break;
    }
  });

  it("produces only arithmetic kinds at band 1 (no letters)", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const p = makePattern(1, mulberry32(seed));
      seen.add(p.kind);
    }
    expect(seen.has("arithmetic-add")).toBe(true);
    expect(seen.has("arithmetic-sub")).toBe(true);
    // Band 1 must not have letter kinds
    expect(seen.has("alphabet-add")).toBe(false);
    expect(seen.has("alphabet-skip")).toBe(false);
  });

  it("produces harder kinds at high bands", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const p = makePattern(10, mulberry32(seed));
      seen.add(p.kind);
    }
    expect(seen.has("cubes")).toBe(true);
    expect(seen.has("fibonacci")).toBe(true);
    expect(seen.has("squares")).toBe(true);
  });
});
