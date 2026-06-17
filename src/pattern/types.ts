export type PatternKind =
  | "arithmetic-add"      // a, a+d, a+2d, …  (constant difference)
  | "arithmetic-sub"      // descending constant difference
  | "geometric"           // a, a*r, a*r², …
  | "geometric-div"       // descending geometric
  | "squares"             // 1, 4, 9, 16, …
  | "cubes"               // 1, 8, 27, …
  | "fibonacci"           // each term = sum of previous two
  | "alternating"         // two interleaved arithmetic series
  | "primes"              // 2, 3, 5, 7, 11, …
  | "triangular"          // 1, 3, 6, 10, …
  | "alphabet-add"        // A, B, C, …  (step by 1 in alphabet)
  | "alphabet-skip"       // A, C, E, …  (step by 2 or more)
  | "polynomial"          // n² + n, n(n+1), etc.
  | "negative-arithmetic" // −8, −4, 0, 4, ?, 12  (arithmetic crossing zero or all-negative)
  | "double-step"         // 3, 4, 6, 9, 13, ?, 22  (differences increase by a constant)
  | "mixed-multiply";     // 1, 3, 7, 15, ?, 63  (×k + c at each step)

export interface Pattern {
  /** All terms including the missing one (null marks the gap). */
  terms: (number | string | null)[];
  /** Index of the missing term. */
  gapIndex: number;
  /** Correct value that fills the gap (stored as string for uniform comparison). */
  answer: string;
  /** Three distractors that are close but wrong. */
  distractors: string[];
  kind: PatternKind;
  /** Points awarded for a correct answer at this difficulty. */
  points: number;
}

export type PatternPhase = "idle" | "playing" | "over";

export type LastResult = "correct" | "wrong" | null;

export interface PatternState {
  phase: PatternPhase;
  current: Pattern | null;
  score: number;
  timeLeftMs: number;
  /** Float difficulty band (1 = easiest, 10 = hardest). Adapts after each answer. */
  levelF: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  peakLevel: number;
  lastResult: LastResult;
  /** Bumped on every answer so the UI can re-trigger animations. */
  flashId: number;
  /** Number of bonuses awarded so far (every 5 correct). */
  bonusCount: number;
}

export type PatternAction =
  | { type: "START" }
  | { type: "ANSWER"; value: string }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
