import {
  LEVEL_UP_EVERY,
  MAX_FOOTPRINT,
  MAX_HEIGHT,
  MAX_LEVEL,
  MIN_FOOTPRINT,
  MIN_HEIGHT,
  MIN_LEVEL,
} from "./constants";
import type { QuestionKind, Structure } from "./types";
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
function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Choose which question to ask about the structure, based on level. */
function generateQuestion(
  heights: number[][],
  level: number,
  rng: Rng,
): { questionKind: QuestionKind; questionPrompt: string; questionAnswer: number } {
  const allH = heights.flat();
  const total = allH.reduce((a, b) => a + b, 0);

  const pool: QuestionKind[] = ["total"];
  if (level >= 3) pool.push("tallest", "shortest");
  if (level >= 5) pool.push("front-row");
  if (level >= 7 && new Set(allH).size > 1) pool.push("exact-height");

  const kind = pick(pool, rng);

  switch (kind) {
    case "total":
      return { questionKind: "total", questionPrompt: "How many cubes in total?", questionAnswer: total };

    case "tallest": {
      const answer = Math.max(...allH);
      return { questionKind: "tallest", questionPrompt: "What is the height of the tallest tower?", questionAnswer: answer };
    }

    case "shortest": {
      const answer = Math.min(...allH);
      return { questionKind: "shortest", questionPrompt: "What is the height of the shortest tower?", questionAnswer: answer };
    }

    case "front-row": {
      // Row 0 is the front row in the isometric view
      const answer = heights[0].reduce((a, b) => a + b, 0);
      return { questionKind: "front-row", questionPrompt: "How many cubes are in the front row?", questionAnswer: answer };
    }

    case "exact-height": {
      // Pick a height value that actually appears, then count towers with that height
      const target = pick(allH, rng);
      const answer = allH.filter(h => h === target).length;
      const word = target === 1 ? "1 cube" : `${target} cubes`;
      return { questionKind: "exact-height", questionPrompt: `How many towers are exactly ${word} tall?`, questionAnswer: answer };
    }
  }
}

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

  const { questionKind, questionPrompt, questionAnswer } = generateQuestion(heights, level, rng);
  return { id, cols, rows, heights, total, questionKind, questionPrompt, questionAnswer };
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
