import { useCallback, useEffect, useReducer, useRef } from "react";
import { mulberry32 } from "../game/rng";
import { MAX_SAMPLE_ROUTES, MIN_FEATURES_REQUIRED, SEARCH_RADIUS_M } from "../direction/constants";
import { fetchAiQuestions } from "../direction/aiQuestions";
import { fetchSampleRoutesGoogle } from "../direction/google/directions";
import { geocodeAddressGoogle } from "../direction/google/geocode";
import { fetchNearbyFeaturesGoogle } from "../direction/google/places";
import { directionInitialState, directionReduce } from "../direction/reducer";
import type { Coords, DirectionAction, DirectionState, MapFeature } from "../direction/types";
import { usePlayerProfile } from "../player/PlayerContext";
import { useGeolocation } from "./useGeolocation";

const TICK_MS = 100;

// Escalating search radii (meters) — widen the search before giving up,
// since 1.5km can genuinely be too sparse in suburban/rural areas.
const RETRY_RADII_M = [SEARCH_RADIUS_M, SEARCH_RADIUS_M * 2, SEARCH_RADIUS_M * 4];

/**
 * React binding for the pure Direction Challenge reducer. Owns geolocation,
 * the Google Places/Directions lookups, and the 3-minute countdown; all
 * game rules live in the tested reducer. Best score and result recording
 * come from the shared player profile.
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

  const proceedFromOrigin = useCallback((origin: Coords) => {
    dispatch({ type: "LOCATED", origin });
    (async () => {
      let features: MapFeature[] = [];
      let requestFailed = false;
      let failureMessage = "";

      for (const radius of RETRY_RADII_M) {
        try {
          features = await fetchNearbyFeaturesGoogle(origin, radius);
          if (features.length >= MIN_FEATURES_REQUIRED) break;
        } catch (err) {
          requestFailed = true;
          failureMessage = err instanceof Error ? err.message : String(err);
          // A hard failure (bad key, auth rejected, SDK wouldn't load) won't
          // be fixed by retrying at a bigger radius — surface it immediately
          // instead of repeating the same failure up to 3 times.
          break;
        }
      }

      if (features.length < MIN_FEATURES_REQUIRED) {
        dispatch({
          type: "LOAD_FAILED",
          message: requestFailed
            ? failureMessage || "Could not load Google Maps data."
            : `No named roads or landmarks were found within ${RETRY_RADII_M[RETRY_RADII_M.length - 1] / 1000}km of this location, even after expanding the search. Try a different address.`,
        });
        return;
      }

      // Sample routes are best-effort — if Directions is unreachable, the
      // game still plays fine with the non-routing question types.
      const routes = await fetchSampleRoutesGoogle(origin, features, rngRef.current, MAX_SAMPLE_ROUTES).catch(() => []);
      dispatch({ type: "FEATURES_LOADED", features, routes });

      // Fire-and-forget AI question generation — arrives after gameplay starts
      // and fills the pool; fails silently if the API is unavailable.
      fetchAiQuestions(origin, features, routes, 1000).then((questions) => {
        if (questions.length > 0) {
          dispatch({ type: "AI_QUESTIONS_LOADED", questions });
        }
      });
    })();
  }, []);

  const start = useCallback(() => {
    rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
    dispatch({ type: "START" });
    getCurrentPosition()
      .then(proceedFromOrigin)
      .catch((err: Error) => {
        dispatch({
          type: "LOAD_FAILED",
          message: err.message || "Could not get your location. Try entering your address instead.",
        });
      });
  }, [getCurrentPosition, proceedFromOrigin]);

  const startWithAddress = useCallback(
    (address: string) => {
      rngRef.current = mulberry32((Math.random() * 2 ** 31) >>> 0);
      dispatch({ type: "START" });
      geocodeAddressGoogle(address)
        .then((origin) => {
          if (!origin) {
            dispatch({ type: "LOAD_FAILED", message: "Could not find that address. Try being more specific." });
            return;
          }
          proceedFromOrigin(origin);
        })
        .catch(() => {
          dispatch({ type: "LOAD_FAILED", message: "Could not find that address. Try being more specific." });
        });
    },
    [proceedFromOrigin],
  );

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

  return { state, best, start, startWithAddress, reset, answer };
}
