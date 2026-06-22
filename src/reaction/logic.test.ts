import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { GRID_SIZE, BONUS_EVERY_HITS, BONUS_POINTS, POINTS_PER_DOT } from "./constants";
import { isBonusHit, pointsForHit, randomCell, scoreForHit, spawnDot } from "./logic";

describe("randomCell", () => {
  it("always returns coordinates inside the grid", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 200; i++) {
      const { col, row } = randomCell(rng);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(GRID_SIZE);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(GRID_SIZE);
    }
  });
});

describe("spawnDot", () => {
  it("spawns a dot inside the grid bounds with a fresh id and full lifetime", () => {
    const rng = mulberry32(1);
    const dot = spawnDot(null, rng, 7);
    expect(dot.id).toBe(7);
    expect(dot.col).toBeGreaterThanOrEqual(0);
    expect(dot.col).toBeLessThan(GRID_SIZE);
    expect(dot.row).toBeGreaterThanOrEqual(0);
    expect(dot.row).toBeLessThan(GRID_SIZE);
    expect(dot.lifeMs).toBeGreaterThan(0);
  });

  it("never spawns at the same cell as the previous dot, across many spawns", () => {
    const rng = mulberry32(123);
    let prev = { col: 2, row: 2 };
    for (let i = 0; i < 300; i++) {
      const dot = spawnDot(prev, rng, i);
      expect(dot.col === prev.col && dot.row === prev.row).toBe(false);
      prev = { col: dot.col, row: dot.row };
    }
  });

  it("can spawn at any cell when there is no previous dot", () => {
    const rng = mulberry32(7);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const dot = spawnDot(null, rng, i);
      seen.add(`${dot.col},${dot.row}`);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("pointsForHit", () => {
  it("always awards the flat per-dot point value", () => {
    expect(pointsForHit()).toBe(POINTS_PER_DOT);
    expect(pointsForHit()).toBe(25);
  });
});

describe("isBonusHit", () => {
  it("is false for hit counts that aren't a multiple of BONUS_EVERY_HITS", () => {
    expect(isBonusHit(1)).toBe(false);
    expect(isBonusHit(9)).toBe(false);
    expect(isBonusHit(11)).toBe(false);
  });

  it("is true exactly every BONUS_EVERY_HITS hits", () => {
    expect(isBonusHit(BONUS_EVERY_HITS)).toBe(true);
    expect(isBonusHit(BONUS_EVERY_HITS * 2)).toBe(true);
    expect(isBonusHit(BONUS_EVERY_HITS * 3)).toBe(true);
  });

  it("is false at zero", () => {
    expect(isBonusHit(0)).toBe(false);
  });
});

describe("scoreForHit", () => {
  it("awards just the base points on a non-bonus hit", () => {
    expect(scoreForHit(1)).toBe(POINTS_PER_DOT);
  });

  it("awards base + bonus points on the 10th, 20th, ... hit", () => {
    expect(scoreForHit(10)).toBe(POINTS_PER_DOT + BONUS_POINTS);
    expect(scoreForHit(10)).toBe(75);
  });

  it("matches the spec's worked example: 10 hits totals 300 points", () => {
    let total = 0;
    for (let hit = 1; hit <= 10; hit++) total += scoreForHit(hit);
    expect(total).toBe(300);
  });
});
