import { useCallback, useEffect, useReducer, useRef } from "react";
import { FEEDBACK_MS } from "../game/constants";
import { memorizeMsForSize } from "../game/logic";
import { mulberry32 } from "../game/rng";
import { initialState, reduce } from "../game/reducer";
import type { Action, GameState } from "../game/types";
import { usePlayerProfile } from "../player/PlayerContext";

const TICK_MS = 100;

/**
 * React binding for the pure game reducer. Owns the wall-clock timers
 * (memorize reveal, feedback pause, the 60s countdown); all *rules* still
 * live in the tested reducer. Best score and result recording come from the
 * shared player profile.
 */
export function useMemoryGame() {
  // A single rng instance, reseeded on each new game so runs differ.
  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));
  const wrapped = useCallback(
    (state: GameState, action: Action) => reduce(state, action, rngRef.current),
    [],
  );
  const [state, dispatch] = useReducer(wrapped, undefined, initialState);

  const { profile, recordResult } = usePlayerProfile();
  const best = profile?.games.memory.bestScore ?? 0;

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase === "over" && !recordedRef.current) {
      recordedRef.current = true;
      recordResult("memory", state.score);
    }
    if (state.phase !== "over") recordedRef.current = false;
  }, [state.phase, state.score, recordResult]);

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
