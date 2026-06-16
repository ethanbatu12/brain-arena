import {
  FILL_RATIO,
  GRID_MAX,
  GRID_MIN,
  GROWTH_STREAK,
  MEMORIZE_LARGE_FROM,
  MEMORIZE_MS_LARGE,
  MEMORIZE_MS_SMALL,
  POINTS_PER_BOX,
} from "./constants";
import type { Rng } from "./rng";

/**
 * Pure, side-effect-free game rules. Everything here is deterministic given its
 * inputs (patterns take an Rng) so it can be exhaustively unit-tested.
 */

/** Clamp a board size into the legal [GRID_MIN, GRID_MAX] range. */
export function clampGridSize(
  size: number,
  min = GRID_MIN,
  max = GRID_MAX,
): number {
  if (Number.isNaN(size)) return min;
  return Math.max(min, Math.min(max, Math.floor(size)));
}

/**
 * How many cells light up for a given board size.
 * Scales with area but is always at least 2 and always leaves at least one
 * empty cell, so a round can never be "select the entire board".
 */
export function targetCountForSize(size: number): number {
  const total = size * size;
  const scaled = Math.round(total * FILL_RATIO);
  return Math.max(2, Math.min(total - 1, scaled));
}

/**
 * Pick the lit cells for a round as a set of cell indices in [0, size*size).
 * Uses a partial Fisher–Yates shuffle driven by the supplied Rng so results are
 * reproducible in tests.
 */
export function generatePattern(size: number, rng: Rng): Set<number> {
  const total = size * size;
  const count = targetCountForSize(size);
  const cells = Array.from({ length: total }, (_, i) => i);

  // Partial shuffle: only the first `count` slots need to be finalized.
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (total - i));
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }
  return new Set(cells.slice(0, count));
}

/**
 * How long the pattern is revealed for a given board size. Larger boards have
 * more lit cells to take in, so they get a longer look (4s vs 3s).
 */
export function memorizeMsForSize(size: number): number {
  return size >= MEMORIZE_LARGE_FROM ? MEMORIZE_MS_LARGE : MEMORIZE_MS_SMALL;
}

/**
 * The new board size (and growth streak) after a round.
 * A wrong round shrinks immediately and resets the streak. A correct round
 * only grows the board once GROWTH_STREAK consecutive wins have piled up at
 * the current size, otherwise it just advances the streak.
 */
export function nextGridSize(
  current: number,
  correct: boolean,
  growthStreak: number,
): { size: number; growthStreak: number } {
  if (!correct) {
    return { size: clampGridSize(current - 1), growthStreak: 0 };
  }
  if (growthStreak + 1 >= GROWTH_STREAK) {
    return { size: clampGridSize(current + 1), growthStreak: 0 };
  }
  return { size: current, growthStreak: growthStreak + 1 };
}

/**
 * Points earned for completing a full round at this board size.
 * Awards POINTS_PER_BOX for every lit cell in the sequence, but only if the
 * whole sequence was completed correctly (all-or-nothing).
 */
export function roundScore(size: number): number {
  return targetCountForSize(size) * POINTS_PER_BOX;
}

/**
 * True only when the selection is exactly the pattern — same cells, no extras,
 * none missing. Used to decide whether a *completed* round scored.
 */
export function isExactMatch(
  pattern: Set<number>,
  selection: Set<number>,
): boolean {
  if (pattern.size !== selection.size) return false;
  for (const cell of selection) {
    if (!pattern.has(cell)) return false;
  }
  return true;
}
