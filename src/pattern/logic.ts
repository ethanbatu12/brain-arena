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
 * Each 200 rating points = one band, so 600 → band 4, 1200 → band 7, etc.
 * Clamped to [MIN_LEVEL, MAX_LEVEL].
 */
export function bandForRating(rating: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(rating / 200) + 1));
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
    points: pointsForBand(band) + 5, // slightly richer reward
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
    distractors: numericDistractors(answer, 2 * gapN - 1, rng), // step between consecutive squares
    kind: "squares",
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
    points: pointsForBand(band),
  };
}

function buildPolynomial(band: number, rng: Rng): Pattern {
  // n² + c or n*(n+1)/2 or 2n²-1 etc.
  // Keep it clean: use n*(n+k) for k ∈ {1,2,3}
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
    points: pointsForBand(band) + 15,
  };
}

// ── kind pool per band ────────────────────────────────────────────────────────

/**
 * Pattern kinds available at each integer band (1–10).
 *
 * Design rules:
 *  - Number-based patterns make up the large majority at every band.
 *  - Letter patterns appear at most once in each pool (≈1-in-6 at low bands,
 *    absent from band 5+).
 *  - Band 1 is entry-level: only the simplest arithmetic sequences.
 *  - Difficulty widens gradually so some questions are very quick while
 *    higher bands require real thought.
 *
 * The pool array is used for uniform random selection, so repeating a kind
 * gives it proportionally higher weight.
 */
export function kindsForBand(band: number): PatternKind[] {
  if (band === 1) {
    // Purely simple arithmetic — 2,4,6,?,10 style
    return [
      "arithmetic-add", "arithmetic-add", "arithmetic-add",
      "arithmetic-sub", "arithmetic-sub",
    ];
  }
  if (band === 2) {
    // Still simple; no letters yet
    return [
      "arithmetic-add", "arithmetic-add",
      "arithmetic-sub", "arithmetic-sub",
      "arithmetic-add",
    ];
  }
  if (band <= 4) {
    // ~85 % numeric, ~15 % letter (1 out of 7 slots)
    return [
      "arithmetic-add", "arithmetic-add",
      "arithmetic-sub", "arithmetic-sub",
      "alternating",
      "arithmetic-add",
      "alphabet-add",   // ← only letter slot
    ];
  }
  if (band <= 6) {
    // Geometric + Fibonacci introduced; one rare letter slot (1 in 8)
    return [
      "arithmetic-add", "arithmetic-sub",
      "geometric", "fibonacci",
      "triangular", "alternating",
      "arithmetic-sub",
      "alphabet-skip",  // ← only letter slot
    ];
  }
  if (band <= 8) {
    // No letters; harder number types
    return [
      "geometric", "geometric-div",
      "fibonacci", "squares",
      "primes", "triangular",
      "polynomial", "alternating",
    ];
  }
  // Band 9–10: hardest pure-number types only
  return [
    "fibonacci", "squares", "cubes",
    "primes", "polynomial", "geometric",
    "triangular", "alternating",
    "geometric-div",
  ];
}

// ── main entry point ──────────────────────────────────────────────────────────

export function makePattern(levelF: number, rng: Rng): Pattern {
  const band = levelBand(levelF);
  const kind = pick(kindsForBand(band), rng);

  switch (kind) {
    case "arithmetic-add":   return buildArithmeticAdd(band, rng);
    case "arithmetic-sub":   return buildArithmeticSub(band, rng);
    case "geometric":        return buildGeometric(band, rng);
    case "geometric-div":    return buildGeometricDiv(band, rng);
    case "squares":          return buildSquares(band, rng);
    case "cubes":            return buildCubes(band, rng);
    case "fibonacci":        return buildFibonacci(band, rng);
    case "alternating":      return buildAlternating(band, rng);
    case "primes":           return buildPrimes(band, rng);
    case "triangular":       return buildTriangular(band, rng);
    case "alphabet-add":     return buildAlphabetAdd(band, rng);
    case "alphabet-skip":    return buildAlphabetSkip(band, rng);
    case "polynomial":       return buildPolynomial(band, rng);
  }
}
