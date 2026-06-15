import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { mulberry32 } from "../game/rng";
import { mathInitialState, mathReduce } from "../math/reducer";
import type { MathAction, MathState } from "../math/types";

const TICK_MS = 100;
const BEST_KEY = "mm_math_best_score";

/**
 * React binding for the pure mental-math reducer. Owns the 60-second countdown
 * and the persisted best score; all rules live in the tested reducer.
 */
export function useMathGame() {
  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));
  const wrapped = useCallback(
    (state: MathState, action: MathAction) => mathReduce(state, action, rngRef.current),
    [],
  );
  const [state, dispatch] = useReducer(wrapped, undefined, mathInitialState);

  const [best, setBest] = useState(0);
  useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_KEY));
    if (Number.isFinite(stored)) setBest(stored);
  }, []);
  useEffect(() => {
    if (state.phase === "over" && state.score > best) {
      setBest(state.score);
      localStorage.setItem(BEST_KEY, String(state.score));
    }
  }, [state.phase, state.score, best]);

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
