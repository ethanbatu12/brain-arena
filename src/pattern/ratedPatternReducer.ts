import {
  RATED_PATTERN_GAIN,
  RATED_PATTERN_INITIAL_RATING,
  RATED_PATTERN_LOSS,
} from "./constants";
import { bandForRating, makePattern } from "./logic";
import type { Pattern } from "./types";
import type { Rng } from "../game/rng";

export type RatedPatternPhase = "idle" | "playing" | "feedback" | "over";

export interface RatedPatternState {
  phase: RatedPatternPhase;
  current: Pattern | null;
  rating: number;
  /** Rating at the moment the current session started (for net delta calculation). */
  startRating: number;
  /** Solved correctly in this session. */
  solved: number;
  /** Total attempted in this session. */
  attempted: number;
  lastResult: "correct" | "wrong" | null;
  flashId: number;
}

export type RatedPatternAction =
  | { type: "START" }
  | { type: "ANSWER"; value: string }
  | { type: "NEXT" }
  | { type: "QUIT" }
  | { type: "RESET" };

export function ratedPatternInitialState(rating: number = RATED_PATTERN_INITIAL_RATING): RatedPatternState {
  return {
    phase: "idle",
    current: null,
    rating,
    startRating: rating,
    solved: 0,
    attempted: 0,
    lastResult: null,
    flashId: 0,
  };
}

export function ratedPatternReduce(
  state: RatedPatternState,
  action: RatedPatternAction,
  rng: Rng,
): RatedPatternState {
  switch (action.type) {
    case "RESET":
      return ratedPatternInitialState(state.rating);

    case "START": {
      const band = bandForRating(state.rating);
      return {
        ...state,
        phase: "playing",
        current: makePattern(band, rng),
        startRating: state.rating,
        solved: 0,
        attempted: 0,
        lastResult: null,
        flashId: 0,
      };
    }

    case "ANSWER": {
      if (state.phase !== "playing" || !state.current) return state;
      const correct = action.value === state.current.answer;
      const attempted = state.attempted + 1;
      const solved = correct ? state.solved + 1 : state.solved;
      const newRating = correct
        ? state.rating + RATED_PATTERN_GAIN
        : Math.max(0, state.rating - RATED_PATTERN_LOSS);

      return {
        ...state,
        phase: "feedback",
        rating: newRating,
        solved,
        attempted,
        lastResult: correct ? "correct" : "wrong",
        flashId: state.flashId + 1,
      };
    }

    case "NEXT": {
      if (state.phase !== "feedback") return state;
      const band = bandForRating(state.rating);
      return {
        ...state,
        phase: "playing",
        current: makePattern(band, rng),
        flashId: state.flashId + 1,
      };
    }

    case "QUIT":
      return { ...state, phase: "over" };

    default:
      return state;
  }
}

/** Rating tier label for display. */
export function ratingTier(rating: number): string {
  if (rating < 1000) return "Provisional";
  if (rating < 1200) return "Beginner";
  if (rating < 1400) return "Easy";
  if (rating < 1600) return "Intermediate";
  if (rating < 1800) return "Advanced";
  if (rating < 2000) return "Expert";
  if (rating < 2200) return "Master";
  if (rating < 2400) return "Elite";
  return "Grandmaster";
}
