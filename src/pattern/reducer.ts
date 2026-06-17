import {
  BONUS_EVERY,
  BONUS_POINTS,
  LEVEL_DOWN,
  LEVEL_UP,
  MIN_LEVEL,
  PATTERN_GAME_MS,
} from "./constants";
import { levelBand, makePattern, nextLevel } from "./logic";
import type { PatternAction, PatternState } from "./types";
import type { Rng } from "../game/rng";

export function patternInitialState(): PatternState {
  return {
    phase: "idle",
    current: null,
    score: 0,
    timeLeftMs: PATTERN_GAME_MS,
    levelF: MIN_LEVEL,
    correct: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    peakLevel: MIN_LEVEL,
    lastResult: null,
    flashId: 0,
    bonusCount: 0,
  };
}

export function patternReduce(
  state: PatternState,
  action: PatternAction,
  rng: Rng,
): PatternState {
  switch (action.type) {
    case "RESET":
      return patternInitialState();

    case "START": {
      const base = patternInitialState();
      const current = makePattern(base.levelF, rng);
      return { ...base, phase: "playing", current };
    }

    case "ANSWER": {
      if (state.phase !== "playing" || !state.current) return state;
      const correct = action.value === state.current.answer;

      if (!correct) {
        return {
          ...state,
          wrong: state.wrong + 1,
          streak: 0,
          levelF: nextLevel(state.levelF, false, LEVEL_UP, LEVEL_DOWN),
          lastResult: "wrong",
          flashId: state.flashId + 1,
          current: makePattern(nextLevel(state.levelF, false, LEVEL_UP, LEVEL_DOWN), rng),
        };
      }

      const streak     = state.streak + 1;
      const levelF     = nextLevel(state.levelF, true, LEVEL_UP, LEVEL_DOWN);
      const totalCorrect = state.correct + 1;

      // Award a bonus every BONUS_EVERY correct answers
      const newBonusCount = Math.floor(totalCorrect / BONUS_EVERY);
      const bonusGained   = newBonusCount - state.bonusCount;
      const bonusScore    = bonusGained * BONUS_POINTS;

      return {
        ...state,
        current: makePattern(levelF, rng),
        score: state.score + state.current.points + bonusScore,
        correct: totalCorrect,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        levelF,
        peakLevel: Math.max(state.peakLevel, levelBand(levelF)),
        lastResult: "correct",
        flashId: state.flashId + 1,
        bonusCount: newBonusCount,
      };
    }

    case "TICK": {
      if (state.phase !== "playing") return state;
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
