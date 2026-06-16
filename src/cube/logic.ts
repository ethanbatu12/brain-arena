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
 *  - every footprint cell holds a stack of height >= 1, but only the top
 *    cube of each stack is ever visible (taller stacks fully occlude the
 *    cubes beneath them in the isometric view)
 *  - total is the number of visible cubes — exactly one per footprint cell
 *    (cols * rows) — so the correct answer is always unambiguous
 */
export function generateStructure(level: number, rng: Rng, id: number): Structure {
  const { cols, rows } = footprintForLevel(level);
  const maxHeight = maxHeightForLevel(level);

  const heights: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(randInt(1, maxHeight, rng));
    }
    heights.push(row);
  }

  return { id, cols, rows, heights, total: cols * rows };
}

/**
 * Flatten a structure into the individual visible unit cubes in
 * back-to-front painter's-algorithm order: sorted by (row + col) ascending
 * (depth from the viewer). Only the top cube of each stack is visible, since
 * a taller neighboring stack would otherwise occlude everything below it.
 */
export function cubesToDraw(structure: Structure): { col: number; row: number; z: number }[] {
  const cubes: { col: number; row: number; z: number }[] = [];
  for (let row = 0; row < structure.rows; row++) {
    for (let col = 0; col < structure.cols; col++) {
      const height = structure.heights[row][col];
      cubes.push({ col, row, z: height - 1 });
    }
  }
  cubes.sort((a, b) => a.row + a.col - (b.row + b.col));
  return cubes;
}
