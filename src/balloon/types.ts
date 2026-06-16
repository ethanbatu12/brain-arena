export type ExprKind =
  | "num"
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "negNum"
  | "subNeg"
  | "addNeg"
  | "mulNeg";

export interface Balloon {
  id: number;
  value: number;
  label: string;
  x: number;
  y: number;
  popped: boolean;
}

export type BalloonPhase = "idle" | "playing" | "over";

/** Which balloon (if any) was just resolved, and how — drives the feedback flash. */
export type LastResult = { id: number; correct: boolean } | null;

export interface BalloonState {
  phase: BalloonPhase;
  balloons: Balloon[];
  sortedIds: number[];
  nextIndex: number;
  score: number;
  timeLeftMs: number;
  level: number;
  completedSets: number;
  setsToBonus: number;
  correctTaps: number;
  wrongTaps: number;
  peakLevel: number;
  lastResult: LastResult;
  flashId: number;
  nextId: number;
}

export type BalloonAction =
  | { type: "START" }
  | { type: "TAP"; id: number }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
