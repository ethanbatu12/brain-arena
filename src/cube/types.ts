export interface Structure {
  id: number; // unique per generated structure (for React keys / animations)
  cols: number;
  rows: number;
  /** heights[row][col] = number of cubes stacked at that footprint cell (0..maxHeight). */
  heights: number[][];
  /** Sum of all heights — the correct answer. */
  total: number;
}

export type CubePhase = "idle" | "playing" | "over";

/** Which way the last answer resolved — drives the feedback flash. */
export type LastResult = "correct" | "wrong" | null;

export interface CubeState {
  phase: CubePhase;
  structure: Structure;
  input: string; // current typed guess (digits only)
  score: number;
  timeLeftMs: number;
  /** Integer difficulty level, 1..MAX_LEVEL. */
  level: number;
  correct: number;
  wrong: number;
  /** Correct answers since the last bonus, 0..BONUS_EVERY-1. */
  streakToBonus: number;
  /** Highest level reached (for the end screen). */
  peakLevel: number;
  lastResult: LastResult;
  /** Bumped on every resolved answer so the UI can retrigger flashes. */
  flashId: number;
  /** Monotonic id source for freshly generated structures. */
  nextId: number;
}

export type CubeAction =
  | { type: "START" }
  | { type: "INPUT_CHANGE"; value: string }
  | { type: "SUBMIT" }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
