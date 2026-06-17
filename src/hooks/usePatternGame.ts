import { useCallback, useEffect, useReducer, useRef } from "react";
import { mulberry32 } from "../game/rng";
import { patternInitialState, patternReduce } from "../pattern/reducer";
import type { PatternAction, PatternState } from "../pattern/types";
import { usePlayerProfile } from "../player/PlayerContext";

const TICK_MS = 100;

export function usePatternGame() {
  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));
  const wrapped = useCallback(
    (state: PatternState, action: PatternAction) =>
      patternReduce(state, action, rngRef.current),
    [],
  );
  const [state, dispatch] = useReducer(wrapped, undefined, patternInitialState);

  const { profile, recordResult } = usePlayerProfile();
  const best = profile?.games.pattern.bestScore ?? 0;

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase === "over" && !recordedRef.current) {
      recordedRef.current = true;
      recordResult("pattern", state.score);
    }
    if (state.phase !== "over") recordedRef.current = false;
  }, [state.phase, state.score, recordResult]);

  const start = useCallback(() => {
    rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
    dispatch({ type: "START" });
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const answer = useCallback((value: string) => {
    dispatch({ type: "ANSWER", value });
  }, []);

  const isActive = state.phase === "playing";
  useEffect(() => {
    if (!isActive) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      dispatch({ type: "TICK", deltaMs: delta });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isActive]);

  return { state, best, start, reset, answer };
}
