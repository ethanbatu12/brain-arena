import { useCallback, useEffect, useReducer, useRef } from "react";
import { mulberry32 } from "../game/rng";
import { directionInitialState, directionReduce } from "../direction/reducer";
import { fetchNearbyFeatures } from "../direction/overpass";
import type { DirectionAction, DirectionState } from "../direction/types";
import { usePlayerProfile } from "../player/PlayerContext";
import { useGeolocation } from "./useGeolocation";

const TICK_MS = 100;

/**
 * React binding for the pure Direction Challenge reducer. Owns geolocation,
 * the Overpass fetch, and the 3-minute countdown; all game rules live in the
 * tested reducer. Best score and result recording come from the shared
 * player profile.
 */
export function useDirectionChallenge() {
  const rngRef = useRef(mulberry32((Math.random() * 2 ** 31) >>> 0));
  const wrapped = useCallback(
    (state: DirectionState, action: DirectionAction) => directionReduce(state, action, rngRef.current),
    [],
  );
  const [state, dispatch] = useReducer(wrapped, undefined, directionInitialState);
  const { getCurrentPosition } = useGeolocation();

  const { profile, recordDirectionResult } = usePlayerProfile();
  const best = profile?.games.direction.bestScore ?? 0;

  const recordedRef = useRef(false);
  useEffect(() => {
    if (state.phase === "over" && !recordedRef.current) {
      recordedRef.current = true;
      recordDirectionResult(state.score, state.correctCount, state.totalAnswered);
    }
    if (state.phase !== "over") recordedRef.current = false;
  }, [state.phase, state.score, state.correctCount, state.totalAnswered, recordDirectionResult]);

  const start = useCallback(() => {
    rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
    dispatch({ type: "START" });
    getCurrentPosition()
      .then((origin) => {
        dispatch({ type: "LOCATED", origin });
        return fetchNearbyFeatures(origin);
      })
      .then((features) => {
        dispatch({ type: "FEATURES_LOADED", features });
      })
      .catch((err: Error) => {
        dispatch({ type: "LOAD_FAILED", message: err.message || "Could not get your location." });
      });
  }, [getCurrentPosition]);

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
