import { useCallback, useEffect, useReducer, useRef } from "react";
import { mulberry32 } from "../game/rng";
import {
  ratedPatternInitialState,
  ratedPatternReduce,
  type RatedPatternAction,
  type RatedPatternState,
} from "../pattern/ratedPatternReducer";
import { usePlayerProfile } from "../player/PlayerContext";

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
      // Net rating delta over the whole session
      const ratingDelta = state.rating - state.startRating;
      recordRatedPatternRun(state.solved, state.attempted, ratingDelta);
    }
    if (state.phase !== "over") recordedRef.current = false;
  }, [state.phase, state.rating, state.startRating, state.solved, state.attempted, recordRatedPatternRun]);

  const start = useCallback(() => {
    rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
    dispatch({ type: "START" });
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const answer = useCallback((value: string) => {
    dispatch({ type: "ANSWER", value });
  }, []);

  const next = useCallback(() => dispatch({ type: "NEXT" }), []);

  const quit = useCallback(() => dispatch({ type: "QUIT" }), []);

  return { state, start, reset, answer, next, quit };
}
