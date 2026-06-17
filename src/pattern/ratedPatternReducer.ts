import {
  RATED_PATTERN_GAIN,
  RATED_PATTERN_INITIAL_RATING,
  RATED_PATTERN_LOSS,
} from "./constants";
import { bandForRating, makePattern } from "./logic";
import type { Pattern, PatternPhase } from "./types";
import type { Rng } from "../game/rng";

export interface RatedPatternState {
  phase: PatternPhase;
  current: Pattern | null;
  rating: number;
  /** Solved correctly in this run (ends on first wrong answer). */
  solved: number;
  /** Total attempted in this run. */
  attempted: number;
  lastResult: "correct" | "wrong" | null;
  flashId: number;
}

export type RatedPatternAction =
  | { type: "START" }
  | { type: "ANSWER"; value: string }
  | { type: "RESET" };

export function ratedPatternInitialState(rating: number = RATED_PATTERN_INITIAL_RATING): RatedPatternState {
  return {
    phase: "idle",
    current: null,
    rating,
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

      if (!correct) {
        const newRating = Math.max(0, state.rating - RATED_PATTERN_LOSS);
        return {
          ...state,
          phase: "over",
          rating: newRating,
          attempted,
          lastResult: "wrong",
          flashId: state.flashId + 1,
        };
      }

      const solved = state.solved + 1;
      const newRating = state.rating + RATED_PATTERN_GAIN;
      const band = bandForRating(newRating);
      return {
        ...state,
        current: makePattern(band, rng),
        rating: newRating,
        solved,
        attempted,
        lastResult: "correct",
        flashId: state.flashId + 1,
      };
    }

    default:
      return state;
  }
}

/** Rating delta for the completed run (positive if any patterns solved, negative on wrong). */
export function ratedPatternDelta(state: RatedPatternState): number {
  return state.solved * RATED_PATTERN_GAIN - (state.phase === "over" && state.lastResult === "wrong" ? RATED_PATTERN_LOSS : 0);
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
