import {
  LEVEL_UP_EVERY,
  MAX_FOOTPRINT,
  MAX_HEIGHT,
  MAX_LEVEL,
  MIN_FOOTPRINT,
  MIN_HEIGHT,
  MIN_LEVEL,
} from "./constants";
import type { Structure } from "./types";
import type { Rng } from "../game/rng";

/**
 * Pure, deterministic cube-structure generation and counting.
 * All randomness flows through the injected Rng, so generation is reproducible
 * and every property (footprint/height progression, total = sum of heights,
 * draw order) is unit-tested.
 */

export function clampLevel(level: number): number {
  if (Number.isNaN(level)) return MIN_LEVEL;
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
}

/** Footprint grows from MIN_FOOTPRINT x MIN_FOOTPRINT to MAX_FOOTPRINT x MAX_FOOTPRINT. */
export function footprintForLevel(level: number): { cols: number; rows: number } {
  const l = clampLevel(level);
  const dim = Math.min(MAX_FOOTPRINT, MIN_FOOTPRINT + Math.floor((l - 1) / 2));
  return { cols: dim, rows: dim };
}

/** Max stack height grows from MIN_HEIGHT to MAX_HEIGHT. */
export function maxHeightForLevel(level: number): number {
  const l = clampLevel(level);
  return Math.min(MAX_HEIGHT, MIN_HEIGHT + Math.floor((l - 1) / 2));
}

/**
 * Difficulty level derived from the total number of correct answers so far.
 * The level advances by one every LEVEL_UP_EVERY correct answers, so the
 * player gets multiple reps at each footprint/height tier before it grows.
 */
export function levelForCorrectCount(correctCount: number): number {
  return clampLevel(MIN_LEVEL + Math.floor(correctCount / LEVEL_UP_EVERY));
}

function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Build one cube structure for the given difficulty level. Guarantees:
 *  - footprint and max height follow footprintForLevel / maxHeightForLevel
 *  - every footprint cell holds a stack of height >= 1, and every cube in
 *    every stack is drawn (full towers, not just the top cube) — the player
 *    sees the actual stacking and counts every unit cube
 *  - total is the sum of every stack's height, so the answer varies with
 *    the structure instead of always being cols * rows
 */
export function generateStructure(level: number, rng: Rng, id: number): Structure {
  const { cols, rows } = footprintForLevel(level);
  const maxHeight = maxHeightForLevel(level);

  const heights: number[][] = [];
  let total = 0;
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const h = randInt(1, maxHeight, rng);
      row.push(h);
      total += h;
    }
    heights.push(row);
  }

  return { id, cols, rows, heights, total };
}

/**
 * Flatten a structure into every individual visible unit cube, in
 * back-to-front, bottom-to-top painter's-algorithm order: sorted by
 * (row + col) ascending (depth from the viewer), then by height ascending
 * within a cell. Every cube in every stack is included — full towers are
 * visible, not just the top cube — so the player can see and count the
 * stacking directly instead of having to infer hidden cubes.
 */
export function cubesToDraw(structure: Structure): { col: number; row: number; z: number }[] {
  const cubes: { col: number; row: number; z: number }[] = [];
  for (let row = 0; row < structure.rows; row++) {
    for (let col = 0; col < structure.cols; col++) {
      const height = structure.heights[row][col];
      for (let z = 0; z < height; z++) {
        cubes.push({ col, row, z });
      }
    }
  }
  cubes.sort((a, b) => a.row + a.col - (b.row + b.col) || a.z - b.z);
  return cubes;
}
