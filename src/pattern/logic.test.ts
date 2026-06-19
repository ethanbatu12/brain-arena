import { describe, expect, it } from "vitest";
import { MAX_LEVEL, MIN_LEVEL } from "./constants";
import {
  bandForRating,
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

describe("bandForRating", () => {
  it("maps 1000 (starting rating) to band 7 (hard floor)", () => {
    expect(bandForRating(1000)).toBe(7);
  });

  it("clamps all ratings below 1800 to the minimum band 7", () => {
    expect(bandForRating(0)).toBe(7);
    expect(bandForRating(600)).toBe(7);
    expect(bandForRating(800)).toBe(7);
    expect(bandForRating(1200)).toBe(7);
    expect(bandForRating(1400)).toBe(7);
    expect(bandForRating(1600)).toBe(7);
    expect(bandForRating(1800)).toBe(7);
  });

  it("increases band above 1800", () => {
    expect(bandForRating(2000)).toBe(8);
    expect(bandForRating(2200)).toBe(9);
    expect(bandForRating(2400)).toBe(10);
    expect(bandForRating(5000)).toBe(10);
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
  it("only returns arithmetic kinds at band 1", () => {
    const kinds = kindsForBand(1);
    expect(kinds).toContain("arithmetic-add");
    expect(kinds).not.toContain("fibonacci");
    expect(kinds).not.toContain("cubes");
    expect(kinds).not.toContain("negative-arithmetic");
    expect(kinds).not.toContain("double-step");
    expect(kinds).not.toContain("mixed-multiply");
  });

  it("includes negative-arithmetic at bands 5–6", () => {
    expect(kindsForBand(5)).toContain("negative-arithmetic");
    expect(kindsForBand(6)).toContain("negative-arithmetic");
  });

  it("includes double-step at bands 7–10", () => {
    for (let b = 7; b <= 10; b++) {
      expect(kindsForBand(b)).toContain("double-step");
    }
  });

  it("includes mixed-multiply only at bands 9–10", () => {
    expect(kindsForBand(8)).not.toContain("mixed-multiply");
    expect(kindsForBand(9)).toContain("mixed-multiply");
    expect(kindsForBand(10)).toContain("mixed-multiply");
  });

  it("has no letter kinds at band 7+", () => {
    for (let b = 7; b <= 10; b++) {
      const kinds = kindsForBand(b);
      expect(kinds).not.toContain("alphabet-add");
      expect(kinds).not.toContain("alphabet-skip");
    }
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
      let step: number | null = null;
      for (let j = 1; j < p.terms.length; j++) {
        if (p.terms[j] !== null && p.terms[j - 1] !== null) {
          step = (p.terms[j] as number) - (p.terms[j - 1] as number);
          break;
        }
      }
      expect(step).not.toBeNull();
      const idx = p.gapIndex;
      if (idx > 0 && p.terms[idx - 1] !== null) {
        expect(Number(p.answer)).toBe((p.terms[idx - 1] as number) + step!);
      }
      if (idx < p.terms.length - 1 && p.terms[idx + 1] !== null) {
        expect(Number(p.answer)).toBe((p.terms[idx + 1] as number) - step!);
      }
    }
  });

  it("fibonacci answer equals sum of two preceding terms (where visible)", () => {
    let checked = 0;
    for (let seed = 0; seed < 300; seed++) {
      const p = makePattern(5, mulberry32(seed));
      if (p.kind !== "fibonacci") continue;
      const idx = p.gapIndex;
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

  it("negative-arithmetic sequence contains at least one negative term", () => {
    let checked = 0;
    for (let seed = 0; seed < 300; seed++) {
      const p = makePattern(5, mulberry32(seed));
      if (p.kind !== "negative-arithmetic") continue;
      const allNums = p.terms.map((t) => (t === null ? Number(p.answer) : Number(t)));
      expect(allNums.some((n) => n < 0)).toBe(true);
      checked++;
      if (checked >= 5) break;
    }
  });

  it("double-step sequence has consistently increasing first differences", () => {
    let checked = 0;
    for (let seed = 0; seed < 500; seed++) {
      const p = makePattern(8, mulberry32(seed));
      if (p.kind !== "double-step") continue;
      // Reconstruct full sequence
      const full = p.terms.map((t, i) => (i === p.gapIndex ? Number(p.answer) : Number(t)));
      // First differences
      const diffs = full.slice(1).map((v, i) => v - full[i]);
      // Second differences should all be equal (and positive)
      const dd = diffs.slice(1).map((v, i) => v - diffs[i]);
      const firstDD = dd[0];
      expect(firstDD).toBeGreaterThan(0);
      for (const d of dd) expect(d).toBe(firstDD);
      checked++;
      if (checked >= 5) break;
    }
  });

  it("mixed-multiply sequence satisfies term[i] = term[i-1] * k + c", () => {
    let checked = 0;
    for (let seed = 0; seed < 500; seed++) {
      const p = makePattern(9, mulberry32(seed));
      if (p.kind !== "mixed-multiply") continue;
      const full = p.terms.map((t, i) => (i === p.gapIndex ? Number(p.answer) : Number(t)));
      // Infer k and c from first two terms
      // term[1] = term[0]*k + c, term[2] = term[1]*k + c → (t2−t1)/(t1−t0) = k
      const k = (full[2] - full[1]) / (full[1] - full[0]);
      const c = full[1] - full[0] * k;
      // Verify all consecutive pairs satisfy the rule
      for (let i = 1; i < full.length; i++) {
        expect(full[i]).toBeCloseTo(full[i - 1] * k + c, 5);
      }
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
    expect(seen.has("alphabet-add")).toBe(false);
    expect(seen.has("alphabet-skip")).toBe(false);
    expect(seen.has("negative-arithmetic")).toBe(false);
    expect(seen.has("double-step")).toBe(false);
    expect(seen.has("mixed-multiply")).toBe(false);
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
    expect(seen.has("double-step")).toBe(true);
    expect(seen.has("mixed-multiply")).toBe(true);
  });
});
