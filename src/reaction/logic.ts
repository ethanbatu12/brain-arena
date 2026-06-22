/**
 * Pure, deterministic Reaction Grid helpers. All randomness is injected via
 * the Rng function so spawn placement is unit-testable with fixed seeds.
 */
import type { Rng } from "../game/rng";
import { BONUS_EVERY_HITS, BONUS_POINTS, DOT_LIFETIME_MS, GRID_SIZE, POINTS_PER_DOT } from "./constants";
import type { ReactionDot } from "./types";

export interface GridCell {
  col: number;
  row: number;
}

/** Picks a uniformly random cell in the GRID_SIZE x GRID_SIZE grid. */
export function randomCell(rng: Rng): GridCell {
  return {
    col: Math.floor(rng() * GRID_SIZE),
    row: Math.floor(rng() * GRID_SIZE),
  };
}

/**
 * Spawns a new dot, avoiding the cell the previous dot occupied (if any) so
 * the dot always visibly moves on every spawn.
 */
export function spawnDot(prev: GridCell | null, rng: Rng, id: number): ReactionDot {
  let cell = randomCell(rng);
  if (prev && GRID_SIZE * GRID_SIZE > 1) {
    let guard = 0;
    while (cell.col === prev.col && cell.row === prev.row && guard < 50) {
      cell = randomCell(rng);
      guard++;
    }
  }
  return { id, col: cell.col, row: cell.row, lifeMs: DOT_LIFETIME_MS };
}

/** Points earned for a single successful tap, before any bonus. */
export function pointsForHit(): number {
  return POINTS_PER_DOT;
}

/** Whether this hit count (after incrementing) completes a bonus streak. */
export function isBonusHit(hitsSoFar: number): boolean {
  return hitsSoFar > 0 && hitsSoFar % BONUS_EVERY_HITS === 0;
}

/** Total points awarded for a hit, including bonus if this hit completes a streak. */
export function scoreForHit(hitsSoFar: number): number {
  return pointsForHit() + (isBonusHit(hitsSoFar) ? BONUS_POINTS : 0);
}
