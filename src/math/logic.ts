import { MAX_LEVEL, MIN_LEVEL } from "./constants";
import type { Op, Problem } from "./types";
import type { Rng } from "../game/rng";

/**
 * Pure, deterministic mental-math problem generation and scoring.
 * All randomness flows through the injected Rng, so generation is reproducible
 * and every property (valid arithmetic, exact division, difficulty bands) is
 * unit-tested.
 */

export function clampLevel(level: number): number {
  if (Number.isNaN(level)) return MIN_LEVEL;
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
}

/** Integer difficulty band (1–10) used to pick ranges and operations. */
export function levelBand(levelF: number): number {
  return Math.floor(clampLevel(levelF));
}

/** New difficulty rating after an answer (adaptive: up on correct, down on wrong). */
export function nextLevel(levelF: number, correct: boolean, up: number, down: number): number {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, levelF + (correct ? up : -down)));
}

function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Number of carries when adding a + b (a proxy for difficulty). */
export function countCarries(a: number, b: number): number {
  let carry = 0;
  let count = 0;
  while (a > 0 || b > 0) {
    const sum = (a % 10) + (b % 10) + carry;
    carry = sum >= 10 ? 1 : 0;
    if (carry) count++;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return count;
}

/** Number of borrows when subtracting a - b (assumes a >= b). */
export function countBorrows(a: number, b: number): number {
  let borrow = 0;
  let count = 0;
  while (a > 0 || b > 0) {
    const da = (a % 10) - borrow;
    const db = b % 10;
    if (da < db) {
      borrow = 1;
      count++;
    } else {
      borrow = 0;
    }
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return count;
}

/**
 * Difficulty-weighted reward. Calibrated so an easy "15 + 24" ≈ 10 and a hard
 * "87 × 9" ≈ 60: solving harder problems is worth proportionally more, which is
 * what makes the final score track skill rather than just raw speed.
 */
export function problemPoints(op: Op, a: number, b: number, answer: number): number {
  switch (op) {
    case "+":
      return 10 + countCarries(a, b) * 5;
    case "-":
      return 12 + countBorrows(a, b) * 5;
    case "×":
      // a is the 2-digit operand, b the 1-digit multiplier.
      return 20 + Math.floor(a / 10) * 3 + b * 2;
    case "÷":
      // b is the divisor, answer the quotient.
      return 24 + b * 2 + answer * 2;
  }
}

/** Which operations are unlocked at a given band. */
export function opsForBand(band: number): Op[] {
  const ops: Op[] = ["+"];
  if (band >= 2) ops.push("-");
  if (band >= 5) ops.push("×");
  if (band >= 6) ops.push("÷");
  return ops;
}

/**
 * Build one problem for the given difficulty rating. Guarantees:
 *  - addition/subtraction operands grow with level; subtraction never negative
 *  - multiplication is always 2-digit × 1-digit, growing toward 99 × 9
 *  - division is always exact (dividend = divisor × quotient)
 */
export function makeProblem(levelF: number, rng: Rng, id: number): Problem {
  const band = levelBand(levelF);
  const op = pick(opsForBand(band), rng);

  let a: number;
  let b: number;
  let answer: number;
  let text: string;

  switch (op) {
    case "+": {
      const hi = Math.min(99, 20 + band * 8);
      a = randInt(10, hi, rng);
      b = randInt(10, hi, rng);
      answer = a + b;
      text = `${a} + ${b}`;
      break;
    }
    case "-": {
      const hi = Math.min(99, 20 + band * 8);
      a = randInt(10, hi, rng);
      b = randInt(10, a, rng); // keep the result non-negative
      answer = a - b;
      text = `${a} − ${b}`;
      break;
    }
    case "×": {
      const aMax = band >= 8 ? 99 : band >= 7 ? 50 : 19; // the 2-digit operand
      const bMax = band >= 7 ? 9 : 5; // the 1-digit multiplier
      a = randInt(10, aMax, rng);
      b = randInt(2, bMax, rng);
      answer = a * b;
      text = `${a} × ${b}`;
      break;
    }
    case "÷": {
      const divMax = band >= 8 ? 9 : 6;
      const quoMax = band >= 8 ? 9 : 6;
      b = randInt(2, divMax, rng); // divisor (1-digit)
      answer = randInt(2, quoMax, rng); // quotient (1-digit)
      a = b * answer; // dividend → exact division
      text = `${a} ÷ ${b}`;
      break;
    }
  }

  return { id, a, b, op, answer, text, points: problemPoints(op, a, b, answer) };
}
