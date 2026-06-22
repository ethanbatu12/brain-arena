import { useCallback, useEffect, useReducer, useRef } from "react";
import { mulberry32 } from "../game/rng";
import { triviaInitialState, triviaReduce } from "../trivia/reducer";
import type { TriviaAction, TriviaState } from "../trivia/types";
import { usePlayerProfile } from "../player/PlayerContext";

const TICK_MS = 100;

/**
 * React binding for the pure Brain Blitz Trivia reducer. Owns the 60-second
 * countdown; all rules live in the tested reducer. Best score and result
 * recording come from the shared player profile.
 */
export function useTriviaGame() {
  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));
  const wrapped = useCallback(
    (state: TriviaState, action: TriviaAction) => triviaReduce(state, action, rngRef.current),
    [],
  );
  const [state, dispatch] = useReducer(wrapped, undefined, triviaInitialState);

  const { profile, recordTriviaResult } = usePlayerProfile();
  const best = profile?.games.trivia.bestScore ?? 0;

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase === "over" && !recordedRef.current) {
      recordedRef.current = true;
      recordTriviaResult(state.score, state.correctCount, state.totalAnswered);
    }
    if (state.phase !== "over") recordedRef.current = false;
  }, [state.phase, state.score, state.correctCount, state.totalAnswered, recordTriviaResult]);

  const start = useCallback(() => {
    rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
    dispatch({ type: "START" });
  }, []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const answer = useCallback(
    (questionId: number, choiceIndex: number) => dispatch({ type: "ANSWER", questionId, choiceIndex }),
    [],
  );

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
