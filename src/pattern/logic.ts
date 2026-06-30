/**
 * Pure, deterministic pattern-sequence generation.
 * All randomness is injected via the Rng function so every behaviour is
 * unit-testable with fixed seeds.
 *
 * Design constraints that guarantee unambiguous puzzles:
 *  - Every generated sequence has EXACTLY one correct answer.
 *  - Distractors are close neighbours of the answer (±step or nearby values)
 *    so they feel plausible without being correct.
 *  - Alphabet patterns use uppercase A–Z; numeric patterns use integers only.
 *  - Higher difficulty bands produce longer sequences, larger numbers, and
 *    harder pattern types (geometric, Fibonacci, polynomial, …).
 */

import { BASE_POINTS, MAX_LEVEL, MIN_LEVEL } from "./constants";
import type { Pattern, PatternKind } from "./types";
import type { Rng } from "../game/rng";

// ── helpers ──────────────────────────────────────────────────────────────────

export function clampLevel(level: number): number {
  if (Number.isNaN(level)) return MIN_LEVEL;
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
}

export function levelBand(levelF: number): number {
  return Math.floor(clampLevel(levelF));
}

export function nextLevel(levelF: number, correct: boolean, up: number, down: number): number {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, levelF + (correct ? up : -down)));
}

function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Points for this difficulty band (BASE_POINTS base, +5 per band above 1). */
export function pointsForBand(band: number): number {
  return BASE_POINTS + (band - 1) * 5;
}

/**
 * Map a Rated Patterns rating to a logic band (1–10).
 * Minimum band is 7 so rated mode always uses hard patterns regardless of rating.
 * Rating 1000 (start) → band 7; grows above 2000.
 */
export function bandForRating(rating: number): number {
  return Math.min(MAX_LEVEL, Math.max(7, Math.floor((rating - 600) / 200) + 1));
}

// ── prime helpers ─────────────────────────────────────────────────────────────

const PRIMES_CACHE: number[] = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

/** nth prime (0-indexed), for N ≤ 14 from cache, otherwise computed. */
export function nthPrime(n: number): number {
  while (PRIMES_CACHE.length <= n) {
    let candidate = PRIMES_CACHE[PRIMES_CACHE.length - 1] + 2;
    while (true) {
      const root = Math.sqrt(candidate);
      if (PRIMES_CACHE.every((p) => p > root || candidate % p !== 0)) {
        PRIMES_CACHE.push(candidate);
        break;
      }
      candidate++;
    }
  }
  return PRIMES_CACHE[n];
}

// ── distractor generation ─────────────────────────────────────────────────────

/**
 * Produce three plausible-but-wrong numeric distractors near `answer`.
 * We use offsets derived from the step-size of the sequence to keep them
 * within range and avoid duplicating the correct answer.
 */
function numericDistractors(answer: number, step: number, rng: Rng): string[] {
  const abs = Math.max(1, Math.abs(step));
  const offsets = [abs, abs * 2, abs * 3];
  const signs = [1, -1];
  const candidates: Set<number> = new Set();
  for (const off of offsets) {
    for (const s of signs) {
      const v = answer + off * s;
      if (v !== answer) candidates.add(v);
    }
  }
  // Shuffle and take 3
  const arr = Array.from(candidates);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3).map(String);
}

/**
 * Produce three plausible-but-wrong alphabet distractors near `answer`.
 */
function alphaDistractors(answerCode: number, step: number, rng: Rng): string[] {
  const abs = Math.max(1, Math.abs(step));
  const candidates: Set<number> = new Set();
  for (const off of [abs, abs * 2, abs * 3]) {
    for (const s of [1, -1]) {
      const v = answerCode + off * s;
      if (v >= 65 && v <= 90 && v !== answerCode) candidates.add(v);
    }
  }
  // Fallback if near the edge of the alphabet
  let code = 65;
  while (candidates.size < 3) {
    if (code !== answerCode) candidates.add(code);
    code++;
    if (code > 90) break;
  }
  const arr = Array.from(candidates);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3).map((c) => String.fromCharCode(c));
}

// ── sequence builders ─────────────────────────────────────────────────────────

/** Choose gap position: not first, not last, preferably in the middle. */
function chooseGap(length: number, rng: Rng): number {
  const candidates = [];
  for (let i = 1; i < length - 1; i++) candidates.push(i);
  return pick(candidates.length ? candidates : [Math.floor(length / 2)], rng);
}

function buildArithmeticAdd(band: number, rng: Rng): Pattern {
  const maxStart = band === 1 ? 5  : band <= 3 ? 10 : band <= 6 ? 50 : 200;
  const maxStep  = band === 1 ? 3  : band <= 3 ? 5  : band <= 6 ? 15 : 40;
  const length   = band === 1 ? 5  : band <= 3 ? 5  : band <= 6 ? 6  : 7;
  const start = randInt(1, maxStart, rng);
  const step  = randInt(1, maxStep, rng);
  const nums  = Array.from({ length }, (_, i) => start + step * i);
  const gap   = chooseGap(length, rng);
  const answer = nums[gap];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "arithmetic-add",
    hint: "Arithmetic",
    points: pointsForBand(band),
  };
}

function buildArithmeticSub(band: number, rng: Rng): Pattern {
  const maxStart = band === 1 ? 20  : band <= 3 ? 50  : band <= 6 ? 200 : 500;
  const maxStep  = band === 1 ? 3   : band <= 3 ? 5   : band <= 6 ? 15  : 40;
  const length   = band === 1 ? 5   : band <= 3 ? 5   : band <= 6 ? 6   : 7;
  const step  = randInt(1, maxStep, rng);
  const start = randInt(step * (length - 1), maxStart, rng); // ensures all terms positive
  const nums  = Array.from({ length }, (_, i) => start - step * i);
  const gap   = chooseGap(length, rng);
  const answer = nums[gap];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "arithmetic-sub",
    hint: "Arithmetic",
    points: pointsForBand(band),
  };
}

function buildGeometric(band: number, rng: Rng): Pattern {
  // ratio 2 or 3 at lower bands; up to 4 at higher; terms stay ≤ 10 000
  const maxRatio = band <= 4 ? 2 : band <= 7 ? 3 : 4;
  const ratio  = randInt(2, maxRatio, rng);
  const length = band <= 4 ? 5 : 6;
  const maxStart = Math.floor(10_000 / Math.pow(ratio, length - 1));
  const start = randInt(1, Math.max(1, maxStart), rng);
  const nums  = Array.from({ length }, (_, i) => start * Math.pow(ratio, i));
  const gap   = chooseGap(length, rng);
  const answer = nums[gap];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, nums[gap > 0 ? gap - 1 : 1] * (ratio - 1), rng),
    kind: "geometric",
    hint: "Geometric ×",
    points: pointsForBand(band) + 5,
  };
}

function buildGeometricDiv(band: number, rng: Rng): Pattern {
  const ratio  = randInt(2, band <= 5 ? 2 : 3, rng);
  const length = band <= 4 ? 5 : 6;
  const start  = Math.pow(ratio, length - 1) * randInt(1, band <= 4 ? 3 : 6, rng);
  const nums   = Array.from({ length }, (_, i) => start / Math.pow(ratio, i));
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, Math.round(nums[0] / ratio), rng),
    kind: "geometric-div",
    hint: "Geometric ÷",
    points: pointsForBand(band) + 5,
  };
}

function buildSquares(band: number, rng: Rng): Pattern {
  // Choose which consecutive squares to show (starting square)
  const maxN  = band <= 5 ? 7 : band <= 8 ? 10 : 14;
  const n0    = randInt(1, maxN - 4, rng);
  const length = band <= 4 ? 5 : 6;
  const nums  = Array.from({ length }, (_, i) => (n0 + i) ** 2);
  const gap   = chooseGap(length, rng);
  const answer = nums[gap];
  const gapN  = n0 + gap;
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, 2 * gapN - 1, rng),
    kind: "squares",
    hint: "Perfect squares",
    points: pointsForBand(band) + 10,
  };
}

function buildCubes(band: number, rng: Rng): Pattern {
  const maxN  = band <= 7 ? 5 : 7;
  const n0    = randInt(1, maxN - 3, rng);
  const length = 5;
  const nums  = Array.from({ length }, (_, i) => (n0 + i) ** 3);
  const gap   = chooseGap(length, rng);
  const answer = nums[gap];
  const gapN  = n0 + gap;
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, 3 * gapN ** 2, rng),
    kind: "cubes",
    hint: "Perfect cubes",
    points: pointsForBand(band) + 15,
  };
}

function buildFibonacci(band: number, rng: Rng): Pattern {
  // Classic Fib or generalized (random seed a, b where a+b = c, etc.)
  const maxSeed = band <= 5 ? 5 : band <= 8 ? 10 : 20;
  const a0 = randInt(1, maxSeed, rng);
  const b0 = randInt(1, maxSeed, rng);
  const length = band <= 4 ? 6 : 7;
  const nums: number[] = [a0, b0];
  while (nums.length < length) nums.push(nums[nums.length - 1] + nums[nums.length - 2]);
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  // Step for distractors: difference between adjacent terms near the gap
  const step = gap > 0 ? nums[gap] - nums[gap - 1] : nums[1] - nums[0];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "fibonacci",
    hint: "Sum of two",
    points: pointsForBand(band) + 10,
  };
}

function buildAlternating(band: number, rng: Rng): Pattern {
  // Two interleaved arithmetic sequences: a, b, a+da, b+db, a+2da, …
  const maxA  = band <= 3 ? 10  : 50;
  const maxDA = band <= 3 ? 5   : 15;
  const maxB  = band <= 3 ? 10  : 50;
  const maxDB = band <= 3 ? 3   : 10;
  const a0 = randInt(1, maxA, rng);
  const b0 = randInt(1, maxB, rng);
  const da = randInt(1, maxDA, rng);
  const db = randInt(1, maxDB, rng);
  const length = 7;
  const nums = Array.from({ length }, (_, i) => {
    if (i % 2 === 0) return a0 + (i / 2) * da;
    return b0 + Math.floor(i / 2) * db;
  });
  // Only offer gaps on the even or odd sub-series so the answer is unambiguous
  const gap = pick([1, 2, 3, 4, 5], rng);
  const answer = nums[gap];
  const step = gap % 2 === 0 ? da : db;
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "alternating",
    hint: "Two series",
    points: pointsForBand(band) + 10,
  };
}

function buildPrimes(band: number, rng: Rng): Pattern {
  const maxStart = band <= 5 ? 6 : 10;
  const n0     = randInt(0, maxStart, rng);
  const length = 6;
  const nums   = Array.from({ length }, (_, i) => nthPrime(n0 + i));
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, 2, rng),
    kind: "primes",
    hint: "Prime numbers",
    points: pointsForBand(band) + 10,
  };
}

function buildTriangular(band: number, rng: Rng): Pattern {
  const maxN = band <= 5 ? 8 : 12;
  const n0   = randInt(1, maxN - 4, rng);
  const length = 5;
  const nums = Array.from({ length }, (_, i) => {
    const n = n0 + i;
    return (n * (n + 1)) / 2;
  });
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  const step   = n0 + gap; // step between T(n) and T(n-1) is n
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "triangular",
    hint: "Triangular numbers",
    points: pointsForBand(band) + 10,
  };
}

function buildAlphabetAdd(band: number, rng: Rng): Pattern {
  // A, B, C, D, ? — step of 1
  const start  = randInt(65, 85, rng); // A–U so 5-term sequence stays in A–Z
  const step   = 1;
  const length = 5;
  const codes  = Array.from({ length }, (_, i) => start + i * step);
  const gap    = chooseGap(length, rng);
  const answer = codes[gap];
  return {
    terms: codes.map((c, i) => (i === gap ? null : String.fromCharCode(c))) as (string | null)[],
    gapIndex: gap,
    answer: String.fromCharCode(answer),
    distractors: alphaDistractors(answer, step, rng),
    kind: "alphabet-add",
    hint: "Alphabet",
    points: pointsForBand(band),
  };
}

function buildAlphabetSkip(band: number, rng: Rng): Pattern {
  // A, C, E, ? — step of 2 (or higher at harder levels)
  const maxStep = band <= 4 ? 2 : band <= 7 ? 3 : 4;
  const step    = randInt(2, maxStep, rng);
  const maxStart = 90 - step * 5; // ensure 5-term sequence stays ≤ Z
  const start   = randInt(65, Math.max(65, maxStart), rng);
  const length  = 5;
  const codes   = Array.from({ length }, (_, i) => start + i * step);
  if (codes.some((c) => c > 90)) {
    // Fallback: re-root at A
    const safeStart = 65;
    const safeCodes = Array.from({ length }, (_, i) => safeStart + i * step);
    const gap = chooseGap(length, rng);
    const answer = safeCodes[gap];
    return {
      terms: safeCodes.map((c, i) => (i === gap ? null : String.fromCharCode(c))) as (string | null)[],
      gapIndex: gap,
      answer: String.fromCharCode(answer),
      distractors: alphaDistractors(answer, step, rng),
      kind: "alphabet-skip",
      hint: "Alphabet skip",
      points: pointsForBand(band),
    };
  }
  const gap    = chooseGap(length, rng);
  const answer = codes[gap];
  return {
    terms: codes.map((c, i) => (i === gap ? null : String.fromCharCode(c))) as (string | null)[],
    gapIndex: gap,
    answer: String.fromCharCode(answer),
    distractors: alphaDistractors(answer, step, rng),
    kind: "alphabet-skip",
    hint: "Alphabet skip",
    points: pointsForBand(band),
  };
}

function buildPolynomial(band: number, rng: Rng): Pattern {
  // n*(n+k) for k ∈ {1,2,3,4,5}
  const k      = randInt(1, Math.min(band, 5), rng);
  const n0     = randInt(1, band <= 5 ? 4 : 7, rng);
  const length = 5;
  const nums   = Array.from({ length }, (_, i) => {
    const n = n0 + i;
    return n * (n + k);
  });
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  const step   = gap > 0 ? nums[gap] - nums[gap - 1] : nums[1] - nums[0];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "polynomial",
    hint: "Polynomial",
    points: pointsForBand(band) + 15,
  };
}

/**
 * Negative arithmetic sequences — arithmetic with negative terms or crossing zero.
 * e.g. −8, −4, 0, 4, ?, 12  or  −12, −9, −6, −3, ?, 3
 */
function buildNegativeArithmetic(band: number, rng: Rng): Pattern {
  const maxStep  = band <= 5 ? 5 : band <= 8 ? 10 : 20;
  const length   = band <= 6 ? 6 : 7;
  const step     = randInt(1, maxStep, rng);
  // Pick a negative start that makes the sequence cross zero (or stay negative)
  const crossAt  = randInt(1, length - 2, rng); // which index hits 0 or positive
  const start    = -(step * crossAt);            // so terms[crossAt] = 0
  const nums     = Array.from({ length }, (_, i) => start + step * i);
  const gap      = chooseGap(length, rng);
  const answer   = nums[gap];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "negative-arithmetic",
    hint: "Negative arithmetic",
    points: pointsForBand(band) + 10,
  };
}

/**
 * Double-step (second-difference) sequences.
 * Differences increase by a constant: 3, 4, 6, 9, 13, ?, 22
 * terms[i] = a0 + i*d0 + i*(i−1)/2 * dd
 */
function buildDoubleStep(band: number, rng: Rng): Pattern {
  const maxA0   = band <= 6 ? 10 : 30;
  const maxD0   = band <= 6 ? 5  : 15;
  const maxDD   = band <= 7 ? 2  : 4;   // second difference
  const length  = band <= 7 ? 6  : 7;
  const a0      = randInt(1, maxA0, rng);
  const d0      = randInt(1, maxD0, rng);
  const dd      = randInt(1, maxDD, rng);
  const nums    = Array.from({ length }, (_, i) => a0 + i * d0 + (i * (i - 1)) / 2 * dd);
  const gap     = chooseGap(length, rng);
  const answer  = nums[gap];
  // Distractor step = local first difference at gap
  const localStep = gap > 0 ? nums[gap] - nums[gap - 1] : d0;
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, localStep, rng),
    kind: "double-step",
    hint: "Growing gaps",
    points: pointsForBand(band) + 15,
  };
}

/**
 * Mixed-multiply sequences: each term = prev × k + c.
 * e.g. k=2, c=1: 1, 3, 7, 15, 31, ?, 127
 *      k=3, c=−1: 2, 5, 14, 41, ?, 365
 */
function buildMixedMultiply(band: number, rng: Rng): Pattern {
  const k       = randInt(2, band <= 8 ? 2 : 3, rng);
  // c can be +1, −1, +2, −2 at high bands
  const cOptions: number[] = band <= 8 ? [1, -1] : [1, -1, 2, -2];
  const c       = pick(cOptions, rng);
  const length  = 5;
  // Keep terms bounded: first term × k^(length−1) ≤ 10 000
  const maxStart = Math.floor(10_000 / Math.pow(k, length - 1));
  const a0      = randInt(1, Math.max(1, maxStart), rng);
  const nums: number[] = [a0];
  for (let i = 1; i < length; i++) nums.push(nums[i - 1] * k + c);
  // Ensure all terms are positive (they should be with k≥2, c≥−1, a0≥1)
  if (nums.some((n) => n <= 0)) {
    // Fallback: k=2, c=1 from a0=1
    const safe: number[] = [1];
    for (let i = 1; i < length; i++) safe.push(safe[i - 1] * 2 + 1);
    const gap = chooseGap(length, rng);
    return {
      terms: safe.map((v, i) => (i === gap ? null : v)) as (number | null)[],
      gapIndex: gap,
      answer: String(safe[gap]),
      distractors: numericDistractors(safe[gap], safe[gap > 0 ? gap - 1 : 1] * (k - 1), rng),
      kind: "mixed-multiply",
      hint: "Multiply & add",
      points: pointsForBand(band) + 20,
    };
  }
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  const step   = gap > 0 ? nums[gap] - nums[gap - 1] : nums[1] - nums[0];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, Math.max(1, step), rng),
    kind: "mixed-multiply",
    hint: "Multiply & add",
    points: pointsForBand(band) + 20,
  };
}

// ── new pattern builders ──────────────────────────────────────────────────────

/** Descending alphabet: Z, Y, X, W, V, ? */
function buildAlphabetReverse(band: number, rng: Rng): Pattern {
  const maxStep  = band <= 4 ? 1 : 2;
  const step     = randInt(1, maxStep, rng);
  const length   = 5;
  // Start high enough that all terms stay ≥ A (65)
  const minStart = 65 + step * (length - 1);
  const start    = randInt(minStart, 90, rng);
  const codes    = Array.from({ length }, (_, i) => start - i * step);
  const gap      = chooseGap(length, rng);
  const answer   = codes[gap];
  return {
    terms: codes.map((c, i) => (i === gap ? null : String.fromCharCode(c))) as (string | null)[],
    gapIndex: gap,
    answer: String.fromCharCode(answer),
    distractors: alphaDistractors(answer, step, rng),
    kind: "alphabet-reverse",
    hint: "Alphabet reverse",
    points: pointsForBand(band),
  };
}

/** Factorial sequence: n! for consecutive n. */
function buildFactorial(_band: number, rng: Rng): Pattern {
  // n! values: 1,2,6,24,120,720,5040
  const factorials = [1, 2, 6, 24, 120, 720, 5040];
  // Start from index n0 (0=1!, 1=2!, ...)
  const n0     = randInt(0, 2, rng); // keep terms manageable
  const length = 5;
  const nums   = factorials.slice(n0, n0 + length);
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  // Distractors: adjacent factorials + one "off by small number"
  const prev   = gap > 0 ? nums[gap - 1] : 1;
  const next   = gap < length - 1 ? nums[gap + 1] : answer * (n0 + gap + 2);
  const nearby = answer + randInt(1, 3, rng) * (gap % 2 === 0 ? 1 : -1);
  const raw    = [prev, next, nearby].filter(v => v > 0 && v !== answer);
  // Pad if needed
  while (raw.length < 3) raw.push(answer + raw.length + 1);
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: raw.slice(0, 3).map(String),
    kind: "factorial",
    hint: "Factorials",
    points: pointsForBand(_band) + 20,
  };
}

/** Tribonacci: each term = sum of the 3 preceding. */
function buildTribonacci(band: number, rng: Rng): Pattern {
  const maxSeed = band <= 8 ? 3 : 5;
  const a = randInt(0, maxSeed, rng);
  const b = randInt(1, maxSeed, rng);
  const c = randInt(1, maxSeed, rng);
  const length = 7;
  const nums: number[] = [a, b, c];
  while (nums.length < length) {
    nums.push(nums[nums.length - 1] + nums[nums.length - 2] + nums[nums.length - 3]);
  }
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  const step   = gap > 0 ? nums[gap] - nums[gap - 1] : nums[2] - nums[1];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, Math.max(1, step), rng),
    kind: "tribonacci",
    hint: "Sum of three",
    points: pointsForBand(band) + 15,
  };
}

/** Pentagonal numbers: P(n) = n(3n−1)/2 → 1, 5, 12, 22, 35, 51, 70 */
function buildPentagonal(band: number, rng: Rng): Pattern {
  const maxN0  = band <= 7 ? 4 : 7;
  const n0     = randInt(1, maxN0, rng);
  const length = 5;
  const nums   = Array.from({ length }, (_, i) => {
    const n = n0 + i;
    return (n * (3 * n - 1)) / 2;
  });
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  const step   = gap > 0 ? nums[gap] - nums[gap - 1] : nums[1] - nums[0];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "pentagonal",
    hint: "Pentagonal numbers",
    points: pointsForBand(band) + 15,
  };
}

/** Hexagonal numbers: H(n) = n(2n−1) → 1, 6, 15, 28, 45, 66 */
function buildHexagonal(band: number, rng: Rng): Pattern {
  const maxN0  = band <= 8 ? 3 : 5;
  const n0     = randInt(1, maxN0, rng);
  const length = 5;
  const nums   = Array.from({ length }, (_, i) => {
    const n = n0 + i;
    return n * (2 * n - 1);
  });
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  const step   = gap > 0 ? nums[gap] - nums[gap - 1] : nums[1] - nums[0];
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, step, rng),
    kind: "hexagonal",
    hint: "Hexagonal numbers",
    points: pointsForBand(band) + 15,
  };
}

/**
 * Alternate-ops: alternating ×k and +c each step.
 * e.g. k=2, c=3 from 2: 2, 4, 7, 14, 17, 34, 37
 */
function buildAlternateOps(band: number, rng: Rng): Pattern {
  const k      = randInt(2, band <= 9 ? 2 : 3, rng);
  const maxC   = band <= 9 ? 5 : 10;
  const c      = randInt(1, maxC, rng);
  const length = 7;
  const maxStart = Math.floor(500 / Math.pow(k, Math.ceil(length / 2)));
  const start  = randInt(1, Math.max(1, maxStart), rng);
  const nums: number[] = [start];
  for (let i = 1; i < length; i++) {
    if (i % 2 === 1) nums.push(nums[i - 1] * k);
    else             nums.push(nums[i - 1] + c);
  }
  const gap    = chooseGap(length, rng);
  const answer = nums[gap];
  // Step for distractor: approximate local change
  const step   = gap > 0 ? Math.abs(nums[gap] - nums[gap - 1]) : c;
  return {
    terms: nums.map((v, i) => (i === gap ? null : v)) as (number | null)[],
    gapIndex: gap,
    answer: String(answer),
    distractors: numericDistractors(answer, Math.max(1, step), rng),
    kind: "alternate-ops",
    hint: "× then +",
    points: pointsForBand(band) + 20,
  };
}

// ── kind pool per band ────────────────────────────────────────────────────────

/**
 * Pattern kinds available at each integer band (1–10).
 *
 * Design rules:
 *  - Number-based patterns make up the large majority at every band.
 *  - Letter patterns appear at most once in each pool (≈1-in-7 at low bands,
 *    absent from band 7+).
 *  - Band 1 is entry-level: only the simplest arithmetic sequences.
 *  - Difficulty widens gradually; higher bands require multi-step reasoning.
 *
 * The pool array is used for uniform random selection, so repeating a kind
 * gives it proportionally higher weight.
 */
export function kindsForBand(band: number): PatternKind[] {
  if (band === 1) {
    // Entry-level: only simple arithmetic
    return [
      "arithmetic-add", "arithmetic-add", "arithmetic-add",
      "arithmetic-sub", "arithmetic-sub",
    ];
  }
  if (band === 2) {
    return [
      "arithmetic-add", "arithmetic-add",
      "arithmetic-sub", "arithmetic-sub",
      "alphabet-reverse",
    ];
  }
  if (band <= 4) {
    return [
      "arithmetic-add", "arithmetic-add",
      "arithmetic-sub", "arithmetic-sub",
      "alternating",
      "alphabet-add",
      "alphabet-reverse",
    ];
  }
  if (band <= 6) {
    return [
      "arithmetic-add", "arithmetic-sub",
      "geometric", "fibonacci",
      "triangular", "alternating",
      "negative-arithmetic",
      "pentagonal",
      "alphabet-skip",
    ];
  }
  if (band <= 8) {
    return [
      "geometric", "geometric-div",
      "fibonacci", "squares",
      "primes", "triangular",
      "polynomial", "alternating",
      "negative-arithmetic",
      "double-step",
      "factorial",
      "tribonacci",
      "hexagonal",
    ];
  }
  // Band 9–10: all hard types including new ones
  return [
    "fibonacci", "squares", "cubes",
    "primes", "polynomial", "geometric",
    "triangular", "alternating",
    "geometric-div", "double-step",
    "mixed-multiply", "negative-arithmetic",
    "factorial", "tribonacci",
    "pentagonal", "hexagonal",
    "alternate-ops",
  ];
}

// ── main entry point ──────────────────────────────────────────────────────────

export function makePattern(levelF: number, rng: Rng): Pattern {
  const band = levelBand(levelF);
  const kind = pick(kindsForBand(band), rng);

  switch (kind) {
    case "arithmetic-add":      return buildArithmeticAdd(band, rng);
    case "arithmetic-sub":      return buildArithmeticSub(band, rng);
    case "geometric":           return buildGeometric(band, rng);
    case "geometric-div":       return buildGeometricDiv(band, rng);
    case "squares":             return buildSquares(band, rng);
    case "cubes":               return buildCubes(band, rng);
    case "fibonacci":           return buildFibonacci(band, rng);
    case "alternating":         return buildAlternating(band, rng);
    case "primes":              return buildPrimes(band, rng);
    case "triangular":          return buildTriangular(band, rng);
    case "alphabet-add":        return buildAlphabetAdd(band, rng);
    case "alphabet-skip":       return buildAlphabetSkip(band, rng);
    case "alphabet-reverse":    return buildAlphabetReverse(band, rng);
    case "polynomial":          return buildPolynomial(band, rng);
    case "negative-arithmetic": return buildNegativeArithmetic(band, rng);
    case "double-step":         return buildDoubleStep(band, rng);
    case "mixed-multiply":      return buildMixedMultiply(band, rng);
    case "factorial":           return buildFactorial(band, rng);
    case "tribonacci":          return buildTribonacci(band, rng);
    case "pentagonal":          return buildPentagonal(band, rng);
    case "hexagonal":           return buildHexagonal(band, rng);
    case "alternate-ops":       return buildAlternateOps(band, rng);
  }
}
