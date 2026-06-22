import type { Rng } from "../game/rng";
import { REACTION_GAME_MS } from "./constants";
import { scoreForHit, spawnDot } from "./logic";
import type { ReactionAction, ReactionState } from "./types";

export function reactionInitialState(): ReactionState {
  return {
    phase: "idle",
    dot: null,
    score: 0,
    timeLeftMs: REACTION_GAME_MS,
    hits: 0,
    misses: 0,
    hitsTowardBonus: 0,
    nextId: 1,
    lastHitId: null,
    flashId: 0,
  };
}

export function reactionReduce(state: ReactionState, action: ReactionAction, rng: Rng): ReactionState {
  switch (action.type) {
    case "RESET":
      return reactionInitialState();

    case "START": {
      const base = reactionInitialState();
      const dot = spawnDot(null, rng, base.nextId);
      return { ...base, phase: "playing", dot, nextId: base.nextId + 1 };
    }

    case "TAP": {
      if (state.phase !== "playing" || !state.dot) return state;
      if (action.id !== state.dot.id) return state;

      const hits = state.hits + 1;
      const score = state.score + scoreForHit(hits);
      const dot = spawnDot({ col: state.dot.col, row: state.dot.row }, rng, state.nextId);

      return {
        ...state,
        dot,
        score,
        hits,
        nextId: state.nextId + 1,
        lastHitId: action.id,
        flashId: state.flashId + 1,
      };
    }

    case "TICK": {
      if (state.phase !== "playing") return state;
      const timeLeftMs = state.timeLeftMs - action.deltaMs;
      if (timeLeftMs <= 0) {
        return { ...state, timeLeftMs: 0, phase: "over" };
      }

      if (!state.dot) return { ...state, timeLeftMs };

      const lifeMs = state.dot.lifeMs - action.deltaMs;
      if (lifeMs <= 0) {
        // Dot expired unhit — counts as a miss, a fresh dot spawns immediately.
        const dot = spawnDot({ col: state.dot.col, row: state.dot.row }, rng, state.nextId);
        return { ...state, timeLeftMs, dot, misses: state.misses + 1, nextId: state.nextId + 1 };
      }

      return { ...state, timeLeftMs, dot: { ...state.dot, lifeMs } };
    }

    default:
      return state;
  }
}
