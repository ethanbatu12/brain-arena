/** The game's finite-state-machine phases. */
export type Phase = "idle" | "memorize" | "recall" | "feedback" | "over";

export interface GameState {
  phase: Phase;
  gridSize: number;
  /** Cells that are lit for the current round. */
  pattern: Set<number>;
  /** Pattern cells the player has correctly clicked this round. */
  found: Set<number>;
  /** The wrong cell that ended the round, if any (for feedback rendering). */
  wrong: number | null;
  score: number;
  /** Milliseconds remaining in the whole game. */
  timeLeftMs: number;
  /** 1-based index of the current round. */
  round: number;
  /** Outcome of the round currently shown in the `feedback` phase. */
  lastRoundCorrect: boolean | null;
  /** Largest board size reached this game (for the end screen). */
  peakSize: number;
  /** Number of rounds completed successfully. */
  roundsWon: number;
  /** Consecutive wins at the current board size (gates growth). */
  growthStreak: number;
}

export type Action =
  | { type: "START" }
  | { type: "MEMORIZE_DONE" }
  | { type: "CLICK_CELL"; index: number }
  | { type: "FEEDBACK_DONE" }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
