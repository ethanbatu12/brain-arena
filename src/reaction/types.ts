export type ReactionPhase = "idle" | "playing" | "over";

export interface ReactionDot {
  id: number;
  /** Grid column, 0-indexed. */
  col: number;
  /** Grid row, 0-indexed. */
  row: number;
  /** Time remaining before this dot disappears unhit, in ms. */
  lifeMs: number;
}

export interface ReactionState {
  phase: ReactionPhase;
  dot: ReactionDot | null;
  score: number;
  timeLeftMs: number;
  hits: number;
  misses: number;
  hitsTowardBonus: number;
  nextId: number;
  /** Last tapped dot id, used to drive a brief hit flash. */
  lastHitId: number | null;
  flashId: number;
}

export type ReactionAction =
  | { type: "START" }
  | { type: "TAP"; id: number }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
