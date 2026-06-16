import type { Rng } from "../game/rng";
import { MAX_BALLOONS, MAX_LEVEL, MIN_BALLOONS, MIN_LEVEL } from "./constants";
import type { Balloon, ExprKind } from "./types";

/**
 * Pure, deterministic balloon-set generation. All randomness flows through
 * the injected Rng, so generation is reproducible and every property (set
 * size/difficulty progression, value uniqueness, layout) is unit-tested.
 */

export function clampLevel(level: number): number {
  if (Number.isNaN(level)) return MIN_LEVEL;
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
}

/** Balloon count grows from MIN_BALLOONS at level 1 to MAX_BALLOONS at MAX_LEVEL. */
export function balloonCountForLevel(level: number): number {
  const l = clampLevel(level);
  const span = MAX_BALLOONS - MIN_BALLOONS;
  return MIN_BALLOONS + Math.round(((l - 1) * span) / (MAX_LEVEL - MIN_LEVEL));
}

/**
 * Which expression kinds are unlocked at the given level.
 * Negative numbers and negative results are introduced gradually: levels 1-2
 * stay all-positive, "negNum" (a plain negative balloon) appears from level 3,
 * "subNeg" (subtraction with a negative result) from level 5, "addNeg" (a
 * negative addend) from level 7, and "mulNeg" (multiplication by a negative)
 * only at the highest levels.
 */
export function opsForLevel(level: number): ExprKind[] {
  const l = clampLevel(level);
  if (l <= 2) return ["num"];
  if (l <= 4) return ["num", "add", "negNum"];
  if (l <= 6) return ["num", "add", "sub", "negNum", "subNeg"];
  if (l <= 8) return ["add", "sub", "mul", "negNum", "subNeg", "addNeg"];
  return ["add", "sub", "mul", "div", "negNum", "subNeg", "addNeg", "mulNeg"];
}

/** Max value magnitude for the level, with plenty of headroom for unique values. */
export function valueRangeForLevel(level: number): number {
  const l = clampLevel(level);
  return Math.min(80, 20 + l * 6);
}

/** New difficulty level after completing a set. */
export function nextLevelOnSetComplete(level: number): number {
  return clampLevel(level + 1);
}

function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Generate a single balloon's value and display label for the given expression kind. */
export function generateBalloon(kind: ExprKind, level: number, rng: Rng): { value: number; label: string } {
  const max = valueRangeForLevel(level);

  switch (kind) {
    case "num": {
      const value = randInt(1, max, rng);
      return { value, label: String(value) };
    }
    case "add": {
      const half = Math.max(1, Math.floor(max / 2));
      const a = randInt(1, half, rng);
      const b = randInt(1, half, rng);
      return { value: a + b, label: `${a} + ${b}` };
    }
    case "sub": {
      const a = randInt(2, max, rng);
      const b = randInt(1, a - 1, rng);
      return { value: a - b, label: `${a} − ${b}` };
    }
    case "mul": {
      const a = randInt(2, 9, rng);
      const b = randInt(2, 9, rng);
      return { value: a * b, label: `${a} × ${b}` };
    }
    case "div": {
      const b = randInt(2, 9, rng);
      const q = randInt(1, 12, rng);
      const a = b * q;
      return { value: q, label: `${a} ÷ ${b}` };
    }
    case "negNum": {
      const value = -randInt(1, max, rng);
      return { value, label: String(value) };
    }
    case "subNeg": {
      // a − b with b > a, so the result is always negative.
      const a = randInt(1, max - 1, rng);
      const b = randInt(a + 1, max, rng);
      return { value: a - b, label: `${a} − ${b}` };
    }
    case "addNeg": {
      // A negative addend plus a positive one — the sum can land on either side of zero.
      const half = Math.max(1, Math.floor(max / 2));
      const a = -randInt(1, half, rng);
      const b = randInt(1, half, rng);
      return { value: a + b, label: `${a} + ${b}` };
    }
    case "mulNeg": {
      const a = randInt(2, 9, rng);
      const b = -randInt(2, 9, rng);
      return { value: a * b, label: `${a} × (${b})` };
    }
  }
}

/**
 * Lay out `count` balloons on a cols x cols grid (cols = ceil(sqrt(count))),
 * one balloon per cell with the cell assignment shuffled for visual variety,
 * then jitter within each cell (bounded so cells never overlap).
 */
export function generateLayout(count: number, rng: Rng): { x: number; y: number }[] {
  const cols = Math.ceil(Math.sqrt(count));
  const cellSize = 1 / cols;
  const totalCells = cols * cols;

  const cellIndices = Array.from({ length: totalCells }, (_, i) => i);
  for (let i = cellIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
  }

  return cellIndices.slice(0, count).map((cell) => {
    const cellRow = Math.floor(cell / cols);
    const cellCol = cell % cols;
    const jitterX = (rng() - 0.5) * cellSize * 0.5;
    const jitterY = (rng() - 0.5) * cellSize * 0.5;
    return {
      x: clamp01((cellCol + 0.5) * cellSize + jitterX),
      y: clamp01((cellRow + 0.5) * cellSize + jitterY),
    };
  });
}

/**
 * Build one set of balloons for the given difficulty level. Guarantees:
 *  - exactly balloonCountForLevel(level) balloons
 *  - every balloon's value is unique within the set (no ambiguous ties)
 *  - sortedIds lists balloon ids in ascending order of value
 */
export function generateBalloonSet(
  level: number,
  rng: Rng,
  startId: number
): { balloons: Balloon[]; sortedIds: number[] } {
  const count = balloonCountForLevel(level);
  const ops = opsForLevel(level);
  const used = new Set<number>();
  const balloons: Balloon[] = [];

  for (let i = 0; i < count; i++) {
    let { value, label } = generateBalloon(pick(ops, rng), level, rng);
    let attempts = 0;
    while (used.has(value) && attempts < 30) {
      ({ value, label } = generateBalloon(pick(ops, rng), level, rng));
      attempts++;
    }
    while (used.has(value)) {
      value += 1;
      label = String(value);
    }
    used.add(value);
    balloons.push({ id: startId + i, value, label, x: 0, y: 0, popped: false });
  }

  const positions = generateLayout(count, rng);
  balloons.forEach((b, i) => {
    b.x = positions[i].x;
    b.y = positions[i].y;
  });

  const sortedIds = [...balloons].sort((a, b) => a.value - b.value).map((b) => b.id);
  return { balloons, sortedIds };
}
