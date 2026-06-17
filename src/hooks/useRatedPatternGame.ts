import { useCallback, useEffect, useReducer, useRef } from "react";
import { mulberry32 } from "../game/rng";
import {
  ratedPatternInitialState,
  ratedPatternReduce,
  type RatedPatternAction,
  type RatedPatternState,
} from "../pattern/ratedPatternReducer";
import { usePlayerProfile } from "../player/PlayerContext";
import { RATED_PATTERN_GAIN, RATED_PATTERN_LOSS } from "../pattern/constants";

export function useRatedPatternGame() {
  const { profile, recordRatedPatternRun } = usePlayerProfile();
  const currentRating = profile?.ratedPatterns.rating ?? 600;

  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));

  const wrapped = useCallback(
    (state: RatedPatternState, action: RatedPatternAction) =>
      ratedPatternReduce(state, action, rngRef.current),
    [],
  );

  const [state, dispatch] = useReducer(wrapped, undefined, () =>
    ratedPatternInitialState(currentRating),
  );

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase === "over" && !recordedRef.current) {
      recordedRef.current = true;
      const ratingDelta =
        state.solved * RATED_PATTERN_GAIN -
        (state.lastResult === "wrong" ? RATED_PATTERN_LOSS : 0);
      recordRatedPatternRun(state.solved, state.attempted, ratingDelta);
    }
    if (state.phase !== "over") recordedRef.current = false;
  }, [state.phase, state.solved, state.attempted, state.lastResult, recordRatedPatternRun]);

  const start = useCallback(() => {
    rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
    dispatch({ type: "START" });
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const answer = useCallback((value: string) => {
    dispatch({ type: "ANSWER", value });
  }, []);

  return { state, start, reset, answer };
}
