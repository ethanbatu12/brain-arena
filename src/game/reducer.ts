import { BONUS_EVERY_ROUNDS, BONUS_POINTS, GAME_MS, GRID_START } from "./constants";
import {
  generatePattern,
  nextGridSize,
  roundScore,
} from "./logic";
import type { Rng } from "./rng";
import type { Action, GameState } from "./types";

/**
 * The complete game as a pure function: `(state, action, rng) -> state`.
 * No timers, no DOM, no randomness except the injected Rng — so the entire
 * game flow can be driven and asserted in unit tests.
 */

/** The state before a game starts (and after RESET). */
export function initialState(): GameState {
  return {
    phase: "idle",
    gridSize: GRID_START,
    pattern: new Set(),
    found: new Set(),
    wrong: null,
    score: 0,
    timeLeftMs: GAME_MS,
    round: 0,
    lastRoundCorrect: null,
    peakSize: GRID_START,
    roundsWon: 0,
    growthStreak: 0,
  };
}

function startRound(
  base: GameState,
  size: number,
  rng: Rng,
  roundNumber: number,
): GameState {
  return {
    ...base,
    phase: "memorize",
    gridSize: size,
    pattern: generatePattern(size, rng),
    found: new Set(),
    wrong: null,
    lastRoundCorrect: null,
    round: roundNumber,
    peakSize: Math.max(base.peakSize, size),
  };
}

export function reduce(state: GameState, action: Action, rng: Rng): GameState {
  switch (action.type) {
    case "RESET":
      return initialState();

    case "START": {
      const fresh = { ...initialState(), score: 0, timeLeftMs: GAME_MS };
      return startRound(fresh, GRID_START, rng, 1);
    }

    case "MEMORIZE_DONE": {
      if (state.phase !== "memorize") return state;
      return { ...state, phase: "recall" };
    }

    case "CLICK_CELL": {
      // Taps are accepted during the reveal too — a confident player can start
      // answering early. The first tap commits them to recall (pattern hides).
      if (state.phase !== "recall" && state.phase !== "memorize") return state;
      const { index } = action;

      // Ignore clicks on cells already correctly found.
      if (state.found.has(index)) return state;

      if (state.pattern.has(index)) {
        const found = new Set(state.found);
        found.add(index);

        // Whole pattern recovered -> round won.
        if (found.size === state.pattern.size) {
          const roundsWon = state.roundsWon + 1;
          const bonus = roundsWon % BONUS_EVERY_ROUNDS === 0 ? BONUS_POINTS : 0;
          return {
            ...state,
            found,
            phase: "feedback",
            lastRoundCorrect: true,
            score: state.score + roundScore(state.gridSize) + bonus,
            roundsWon,
          };
        }
        // Correct but more to find — commit to recall so the reveal hides.
        return { ...state, found, phase: "recall" };
      }

      // Wrong cell -> round lost immediately.
      return {
        ...state,
        wrong: index,
        phase: "feedback",
        lastRoundCorrect: false,
      };
    }

    case "FEEDBACK_DONE": {
      if (state.phase !== "feedback") return state;
      const { size, growthStreak } = nextGridSize(
        state.gridSize,
        state.lastRoundCorrect === true,
        state.growthStreak,
      );
      return startRound({ ...state, growthStreak }, size, rng, state.round + 1);
    }

    case "TICK": {
      if (state.phase === "idle" || state.phase === "over") return state;
      const timeLeftMs = state.timeLeftMs - action.deltaMs;
      if (timeLeftMs <= 0) {
        return { ...state, timeLeftMs: 0, phase: "over" };
      }
      return { ...state, timeLeftMs };
    }

    default:
      return state;
  }
}
