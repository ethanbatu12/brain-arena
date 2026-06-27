import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import {
  LEVEL_UP_EVERY,
  MAX_FOOTPRINT,
  MAX_HEIGHT,
  MAX_LEVEL,
  MIN_FOOTPRINT,
  MIN_HEIGHT,
  MIN_LEVEL,
} from "./constants";
import {
  clampLevel,
  cubesToDraw,
  footprintForLevel,
  generateStructure,
  levelForCorrectCount,
  maxHeightForLevel,
} from "./logic";

describe("clampLevel", () => {
  it("clamps below the minimum", () => {
    expect(clampLevel(-3)).toBe(MIN_LEVEL);
  });
  it("clamps above the maximum", () => {
    expect(clampLevel(99)).toBe(MAX_LEVEL);
  });
  it("falls back to the minimum on NaN", () => {
    expect(clampLevel(Number.NaN)).toBe(MIN_LEVEL);
  });
  it("keeps in-range values unchanged", () => {
    expect(clampLevel(5)).toBe(5);
  });
});

describe("footprintForLevel", () => {
  it("starts at the minimum footprint for the lowest levels", () => {
    expect(footprintForLevel(MIN_LEVEL)).toEqual({ cols: MIN_FOOTPRINT, rows: MIN_FOOTPRINT });
  });
  it("reaches the maximum footprint by the highest levels", () => {
    expect(footprintForLevel(MAX_LEVEL)).toEqual({ cols: MAX_FOOTPRINT, rows: MAX_FOOTPRINT });
  });
  it("never decreases as the level increases (monotonic)", () => {
    let prev = 0;
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const { cols } = footprintForLevel(level);
      expect(cols).toBeGreaterThanOrEqual(prev);
      prev = cols;
    }
  });
  it("never exceeds the configured bounds", () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const { cols, rows } = footprintForLevel(level);
      expect(cols).toBeGreaterThanOrEqual(MIN_FOOTPRINT);
      expect(cols).toBeLessThanOrEqual(MAX_FOOTPRINT);
      expect(rows).toBeGreaterThanOrEqual(MIN_FOOTPRINT);
      expect(rows).toBeLessThanOrEqual(MAX_FOOTPRINT);
    }
  });
});

describe("maxHeightForLevel", () => {
  it("starts at the minimum height for the lowest levels", () => {
    expect(maxHeightForLevel(MIN_LEVEL)).toBe(MIN_HEIGHT);
  });
  it("reaches the maximum height by the highest levels", () => {
    expect(maxHeightForLevel(MAX_LEVEL)).toBe(MAX_HEIGHT);
  });
  it("never decreases as the level increases (monotonic)", () => {
    let prev = 0;
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const h = maxHeightForLevel(level);
      expect(h).toBeGreaterThanOrEqual(prev);
      prev = h;
    }
  });
});

describe("levelForCorrectCount", () => {
  it("stays at the minimum level before the first level-up threshold", () => {
    for (let correct = 0; correct < LEVEL_UP_EVERY; correct++) {
      expect(levelForCorrectCount(correct)).toBe(MIN_LEVEL);
    }
  });
  it("advances by one every LEVEL_UP_EVERY correct answers", () => {
    expect(levelForCorrectCount(LEVEL_UP_EVERY)).toBe(MIN_LEVEL + 1);
    expect(levelForCorrectCount(2 * LEVEL_UP_EVERY)).toBe(MIN_LEVEL + 2);
  });
  it("never grows past the maximum", () => {
    expect(levelForCorrectCount(LEVEL_UP_EVERY * (MAX_LEVEL + 10))).toBe(MAX_LEVEL);
  });
});

describe("generateStructure", () => {
  it("matches the footprint for the given level", () => {
    const s = generateStructure(5, mulberry32(1), 1);
    const { cols, rows } = footprintForLevel(5);
    expect(s.cols).toBe(cols);
    expect(s.rows).toBe(rows);
    expect(s.heights).toHaveLength(rows);
    for (const row of s.heights) expect(row).toHaveLength(cols);
  });

  it("keeps every height within [1, maxHeightForLevel(level)]", () => {
    const level = 8;
    const maxH = maxHeightForLevel(level);
    const s = generateStructure(level, mulberry32(42), 1);
    for (const row of s.heights) {
      for (const h of row) {
        expect(h).toBeGreaterThanOrEqual(1);
        expect(h).toBeLessThanOrEqual(maxH);
      }
    }
  });

  it("never leaves a footprint cell empty, at any level", () => {
    // Every position has a cube, so the player never has to guess whether a
    // hidden/missing cube is present — only how tall each visible stack is.
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const s = generateStructure(level, mulberry32(7), 1);
      for (const row of s.heights) {
        for (const h of row) expect(h).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("sets total to the sum of every stack's height", () => {
    const s = generateStructure(6, mulberry32(123), 1);
    const expectedTotal = s.heights.flat().reduce((sum, h) => sum + h, 0);
    expect(s.total).toBe(expectedTotal);
  });

  it("doesn't always land on a perfect square (heights vary the total)", () => {
    // At level 1 every stack is forced to height 1, so cols*rows (a perfect
    // square, since footprint is square) is unavoidable there — but once
    // heights can vary, the total should escape that pattern.
    const isPerfectSquare = (n: number) => Number.isInteger(Math.sqrt(n));
    let sawNonSquare = false;
    for (let seed = 0; seed < 30; seed++) {
      const s = generateStructure(MAX_LEVEL, mulberry32(seed), 1);
      if (!isPerfectSquare(s.total)) sawNonSquare = true;
    }
    expect(sawNonSquare).toBe(true);
  });

  it("is deterministic for a given seed", () => {
    const a = generateStructure(5, mulberry32(99), 1);
    const b = generateStructure(5, mulberry32(99), 1);
    expect(a).toEqual(b);
  });

  it("carries through the provided id", () => {
    const s = generateStructure(1, mulberry32(1), 42);
    expect(s.id).toBe(42);
  });

  it("always has at least one cube", () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = generateStructure(9, mulberry32(seed), 1);
      expect(s.total).toBeGreaterThan(0);
    }
  });
});

describe("cubesToDraw", () => {
  it("returns exactly `total` cubes", () => {
    const s = generateStructure(6, mulberry32(5), 1);
    expect(cubesToDraw(s)).toHaveLength(s.total);
  });

  it("every cube is within bounds and within its cell's stack height", () => {
    const s = generateStructure(7, mulberry32(11), 1);
    for (const { col, row, z } of cubesToDraw(s)) {
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(s.rows);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(s.cols);
      expect(z).toBeGreaterThanOrEqual(0);
      expect(z).toBeLessThan(s.heights[row][col]);
    }
  });

  it("draws every cube in every stack — count matches each cell's full height, not just the top", () => {
    const s = generateStructure(8, mulberry32(3), 1);
    const draws = cubesToDraw(s);
    const countPerCell = new Map<string, number>();
    for (const { col, row } of draws) {
      const key = `${row},${col}`;
      countPerCell.set(key, (countPerCell.get(key) ?? 0) + 1);
    }
    for (let row = 0; row < s.rows; row++) {
      for (let col = 0; col < s.cols; col++) {
        expect(countPerCell.get(`${row},${col}`)).toBe(s.heights[row][col]);
      }
    }
  });

  it("draws back-to-front: row+col is non-decreasing", () => {
    const s = generateStructure(8, mulberry32(3), 1);
    const draws = cubesToDraw(s);
    let prev = -Infinity;
    for (const { col, row } of draws) {
      const depth = row + col;
      expect(depth).toBeGreaterThanOrEqual(prev);
      prev = depth;
    }
  });

  it("within a cell, draws bottom-to-top: z is ascending for consecutive same-cell entries", () => {
    const s = generateStructure(9, mulberry32(4), 1);
    const draws = cubesToDraw(s);
    for (let i = 1; i < draws.length; i++) {
      const a = draws[i - 1];
      const b = draws[i];
      if (a.row === b.row && a.col === b.col) {
        expect(b.z).toBeGreaterThan(a.z);
      }
    }
  });

  it("draws at least one cube per footprint cell", () => {
    const s = generateStructure(8, mulberry32(3), 1);
    const draws = cubesToDraw(s);
    const seenCells = new Set(draws.map(({ col, row }) => `${row},${col}`));
    expect(seenCells.size).toBe(s.cols * s.rows);
  });
});
