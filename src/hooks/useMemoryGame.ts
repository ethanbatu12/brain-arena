import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { FEEDBACK_MS } from "../game/constants";
import { memorizeMsForSize } from "../game/logic";
import { mulberry32 } from "../game/rng";
import { initialState, reduce } from "../game/reducer";
import type { Action, GameState } from "../game/types";

const TICK_MS = 100;
const BEST_KEY = "mm_best_score";

/**
 * React binding for the pure game reducer. Owns the wall-clock timers
 * (memorize reveal, feedback pause, the 60s countdown) and the persisted
 * best score; all *rules* still live in the tested reducer.
 */
export function useMemoryGame() {
  // A single rng instance, reseeded on each new game so runs differ.
  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));
  const wrapped = useCallback(
    (state: GameState, action: Action) => reduce(state, action, rngRef.current),
    [],
  );
  const [state, dispatch] = useReducer(wrapped, undefined, initialState);

  const [best, setBest] = useState(0);
  useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_KEY));
    if (Number.isFinite(stored)) setBest(stored);
  }, []);

  // Persist a new best when a game ends.
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
  const clickCell = useCallback(
    (index: number) => dispatch({ type: "CLICK_CELL", index }),
    [],
  );

  // Memorize reveal timer — restarts every round. Larger boards reveal longer.
  useEffect(() => {
    if (state.phase !== "memorize") return;
    const ms = memorizeMsForSize(state.gridSize);
    const id = setTimeout(() => dispatch({ type: "MEMORIZE_DONE" }), ms);
    return () => clearTimeout(id);
  }, [state.phase, state.round, state.gridSize]);

  // Feedback pause timer — shows the answer briefly, then advances.
  useEffect(() => {
    if (state.phase !== "feedback") return;
    const id = setTimeout(() => dispatch({ type: "FEEDBACK_DONE" }), FEEDBACK_MS);
    return () => clearTimeout(id);
  }, [state.phase, state.round]);

  // Global 60s countdown — runs across every active phase, drift-corrected.
  const isActive = state.phase !== "idle" && state.phase !== "over";
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

  return { state, best, start, reset, clickCell };
}
