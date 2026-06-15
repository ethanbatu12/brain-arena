export type Op = "+" | "-" | "×" | "÷";

export interface Problem {
  id: number; // unique per generated problem (for React keys / animations)
  a: number;
  b: number;
  op: Op;
  answer: number;
  text: string; // e.g. "15 + 24"
  points: number; // difficulty-weighted reward for solving this one
}

export type MathPhase = "idle" | "playing" | "over";

/** Which side (if any) was just resolved — drives the feedback flash. */
export type LastResult = "left" | "right" | "wrong" | null;

export interface MathState {
  phase: MathPhase;
  left: Problem;
  right: Problem;
  input: string; // current typed answer (digits only)
  score: number;
  timeLeftMs: number;
  /** Difficulty as a float "rating"; the integer floor drives generation. */
  levelF: number;
  streak: number;
  bestStreak: number;
  correct: number;
  wrong: number;
  /** Highest integer level reached (for the end screen). */
  peakLevel: number;
  lastResult: LastResult;
  /** Bumped on every resolved answer so the UI can retrigger flashes. */
  flashId: number;
  /** Monotonic id source for freshly generated problems. */
  nextId: number;
}

export type MathAction =
  | { type: "START" }
  | { type: "INPUT_CHANGE"; value: string }
  | { type: "SUBMIT" }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
