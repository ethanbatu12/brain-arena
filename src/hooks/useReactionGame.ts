import { useCallback, useEffect, useReducer, useRef } from "react";
import { mulberry32 } from "../game/rng";
import { reactionInitialState, reactionReduce } from "../reaction/reducer";
import type { ReactionAction, ReactionState } from "../reaction/types";
import { usePlayerProfile } from "../player/PlayerContext";

const TICK_MS = 100;

/**
 * React binding for the pure Reaction Grid reducer. Owns the 60-second
 * countdown; all rules live in the tested reducer. Best score and result
 * recording come from the shared player profile.
 */
export function useReactionGame() {
  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));
  const wrapped = useCallback(
    (state: ReactionState, action: ReactionAction) => reactionReduce(state, action, rngRef.current),
    [],
  );
  const [state, dispatch] = useReducer(wrapped, undefined, reactionInitialState);

  const { profile, recordReactionResult } = usePlayerProfile();
  const best = profile?.games.reaction.bestScore ?? 0;

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase === "over" && !recordedRef.current) {
      recordedRef.current = true;
      recordReactionResult(state.score, state.hits);
    }
    if (state.phase !== "over") recordedRef.current = false;
  }, [state.phase, state.score, state.hits, recordReactionResult]);

  const start = useCallback(() => {
    rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
    dispatch({ type: "START" });
  }, []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const tap = useCallback((id: number) => dispatch({ type: "TAP", id }), []);

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

  return { state, best, start, reset, tap };
}
