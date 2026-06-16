import { useCallback, useEffect, useReducer, useRef } from "react";
import { mulberry32 } from "../game/rng";
import { cubeInitialState, cubeReduce } from "../cube/reducer";
import type { CubeAction, CubeState } from "../cube/types";
import { usePlayerProfile } from "../player/PlayerContext";

const TICK_MS = 100;

/**
 * React binding for the pure Logic Challenge reducer. Owns the 60-second
 * countdown; all rules live in the tested reducer. Best score and result
 * recording come from the shared player profile.
 */
export function useCubeGame() {
  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));
  const wrapped = useCallback(
    (state: CubeState, action: CubeAction) => cubeReduce(state, action, rngRef.current),
    [],
  );
  const [state, dispatch] = useReducer(wrapped, undefined, cubeInitialState);

  const { profile, recordResult } = usePlayerProfile();
  const best = profile?.games.logic.bestScore ?? 0;

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase === "over" && !recordedRef.current) {
      recordedRef.current = true;
      recordResult("logic", state.score);
    }
    if (state.phase !== "over") recordedRef.current = false;
  }, [state.phase, state.score, recordResult]);

  const start = useCallback(() => {
    rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
    dispatch({ type: "START" });
  }, []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const setInput = useCallback(
    (value: string) => dispatch({ type: "INPUT_CHANGE", value }),
    [],
  );
  const submit = useCallback(() => dispatch({ type: "SUBMIT" }), []);

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

  return { state, best, start, reset, setInput, submit };
}
