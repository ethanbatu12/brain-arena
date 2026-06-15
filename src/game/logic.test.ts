import { describe, expect, it } from "vitest";
import { GRID_MAX, GRID_MIN } from "./constants";
import {
  clampGridSize,
  generatePattern,
  isExactMatch,
  memorizeMsForSize,
  nextGridSize,
  roundScore,
  targetCountForSize,
} from "./logic";
import {
  MEMORIZE_LARGE_FROM,
  MEMORIZE_MS_LARGE,
  MEMORIZE_MS_SMALL,
} from "./constants";
import { mulberry32 } from "./rng";

describe("clampGridSize", () => {
  it("keeps in-range values unchanged", () => {
    expect(clampGridSize(4)).toBe(4);
  });
  it("clamps below the minimum", () => {
    expect(clampGridSize(GRID_MIN - 5)).toBe(GRID_MIN);
  });
  it("clamps above the maximum", () => {
    expect(clampGridSize(GRID_MAX + 5)).toBe(GRID_MAX);
  });
  it("floors fractional sizes", () => {
    expect(clampGridSize(4.9)).toBe(4);
  });
  it("falls back to the minimum on NaN", () => {
    expect(clampGridSize(Number.NaN)).toBe(GRID_MIN);
  });
  it("honours custom bounds", () => {
    expect(clampGridSize(10, 1, 5)).toBe(5);
    expect(clampGridSize(0, 1, 5)).toBe(1);
  });
});

describe("targetCountForSize", () => {
  it("is at least 2 even on the smallest board", () => {
    expect(targetCountForSize(2)).toBeGreaterThanOrEqual(2);
  });
  it("always leaves at least one empty cell", () => {
    for (let size = GRID_MIN; size <= GRID_MAX; size++) {
      expect(targetCountForSize(size)).toBeLessThanOrEqual(size * size - 1);
    }
  });
  it("never decreases as the board grows (monotonic)", () => {
    let prev = 0;
    for (let size = GRID_MIN; size <= GRID_MAX; size++) {
      const count = targetCountForSize(size);
      expect(count).toBeGreaterThanOrEqual(prev);
      prev = count;
    }
  });
});

describe("generatePattern", () => {
  it("returns exactly targetCountForSize unique cells", () => {
    const size = 5;
    const pattern = generatePattern(size, mulberry32(1));
    expect(pattern.size).toBe(targetCountForSize(size));
  });
  it("only contains indices within the board", () => {
    const size = 4;
    const pattern = generatePattern(size, mulberry32(7));
    for (const cell of pattern) {
      expect(cell).toBeGreaterThanOrEqual(0);
      expect(cell).toBeLessThan(size * size);
    }
  });
  it("is deterministic for a given seed", () => {
    const a = [...generatePattern(6, mulberry32(42))];
    const b = [...generatePattern(6, mulberry32(42))];
    expect(a).toEqual(b);
  });
  it("differs across seeds (not a constant pattern)", () => {
    const a = [...generatePattern(6, mulberry32(1))].sort((x, y) => x - y);
    const b = [...generatePattern(6, mulberry32(999))].sort((x, y) => x - y);
    expect(a).not.toEqual(b);
  });
  it("works at the smallest board without looping forever", () => {
    const pattern = generatePattern(GRID_MIN, mulberry32(3));
    expect(pattern.size).toBe(targetCountForSize(GRID_MIN));
  });
});

describe("nextGridSize", () => {
  it("grows on a correct round", () => {
    expect(nextGridSize(3, true)).toBe(4);
  });
  it("shrinks on a wrong round", () => {
    expect(nextGridSize(3, false)).toBe(2);
  });
  it("never grows past the maximum", () => {
    expect(nextGridSize(GRID_MAX, true)).toBe(GRID_MAX);
  });
  it("never shrinks below the minimum", () => {
    expect(nextGridSize(GRID_MIN, false)).toBe(GRID_MIN);
  });
});

describe("memorizeMsForSize", () => {
  it("gives small boards the shorter reveal", () => {
    expect(memorizeMsForSize(MEMORIZE_LARGE_FROM - 1)).toBe(MEMORIZE_MS_SMALL);
    expect(memorizeMsForSize(GRID_MIN)).toBe(MEMORIZE_MS_SMALL);
  });
  it("gives bigger boards the longer (4s) reveal", () => {
    expect(memorizeMsForSize(MEMORIZE_LARGE_FROM)).toBe(MEMORIZE_MS_LARGE);
    expect(memorizeMsForSize(GRID_MAX)).toBe(MEMORIZE_MS_LARGE);
  });
  it("never decreases as the board grows", () => {
    let prev = 0;
    for (let size = GRID_MIN; size <= GRID_MAX; size++) {
      const ms = memorizeMsForSize(size);
      expect(ms).toBeGreaterThanOrEqual(prev);
      prev = ms;
    }
  });
});

describe("roundScore", () => {
  it("is strictly larger for bigger boards", () => {
    for (let size = GRID_MIN; size < GRID_MAX; size++) {
      expect(roundScore(size + 1)).toBeGreaterThan(roundScore(size));
    }
  });
  it("grows super-linearly (quadratic incentive to grow)", () => {
    // doubling the side should more than double the reward
    expect(roundScore(6)).toBeGreaterThan(2 * roundScore(3));
  });
  it("is always positive", () => {
    expect(roundScore(GRID_MIN)).toBeGreaterThan(0);
  });
});

describe("isExactMatch", () => {
  it("is true for identical sets", () => {
    expect(isExactMatch(new Set([1, 2, 3]), new Set([3, 2, 1]))).toBe(true);
  });
  it("is false when a cell is missing", () => {
    expect(isExactMatch(new Set([1, 2, 3]), new Set([1, 2]))).toBe(false);
  });
  it("is false when an extra cell is selected", () => {
    expect(isExactMatch(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
  });
  it("is false for disjoint sets of equal size", () => {
    expect(isExactMatch(new Set([1, 2]), new Set([3, 4]))).toBe(false);
  });
  it("treats two empty sets as a match", () => {
    expect(isExactMatch(new Set(), new Set())).toBe(true);
  });
});
