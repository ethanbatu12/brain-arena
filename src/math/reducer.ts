import {
  BONUS_EVERY_CORRECT,
  BONUS_POINTS,
  LEVEL_DOWN,
  LEVEL_UP,
  MATH_GAME_MS,
  MAX_INPUT_LEN,
  MIN_LEVEL,
} from "./constants";
import { levelBand, makeProblem, nextLevel } from "./logic";
import type { MathAction, MathState, Problem } from "./types";
import type { Rng } from "../game/rng";

/** A placeholder shown only while idle (before the first START). */
const BLANK: Problem = { id: 0, a: 0, b: 0, op: "+", answer: 0, text: "", points: 0 };

export function mathInitialState(): MathState {
  return {
    phase: "idle",
    left: BLANK,
    right: BLANK,
    input: "",
    score: 0,
    timeLeftMs: MATH_GAME_MS,
    levelF: MIN_LEVEL,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    peakLevel: MIN_LEVEL,
    lastResult: null,
    flashId: 0,
    nextId: 1,
  };
}

/**
 * Keep only an optional leading minus sign plus digits, capping the digit
 * count so the input is always a clean (possibly negative) number.
 */
function sanitize(value: string): string {
  const isNegative = value.trimStart().startsWith("-");
  const digits = value.replace(/[^0-9]/g, "").slice(0, MAX_INPUT_LEN);
  return (isNegative ? "-" : "") + digits;
}

export function mathReduce(
  state: MathState,
  action: MathAction,
  rng: Rng,
): MathState {
  switch (action.type) {
    case "RESET":
      return mathInitialState();

    case "START": {
      const base = mathInitialState();
      const left = makeProblem(base.levelF, rng, 1);
      const right = makeProblem(base.levelF, rng, 2);
      return { ...base, phase: "playing", left, right, nextId: 3 };
    }

    case "INPUT_CHANGE": {
      if (state.phase !== "playing") return state;
      return { ...state, input: sanitize(action.value) };
    }

    case "SUBMIT": {
      if (state.phase !== "playing") return state;
      if (state.input === "") return state;
      const val = Number(state.input);

      // Decide which bubble (if either) this answer solves. Left wins ties.
      const side: "left" | "right" | null =
        val === state.left.answer
          ? "left"
          : val === state.right.answer
            ? "right"
            : null;

      if (side === null) {
        // Wrong: reset streak, ease difficulty down, no score change.
        return {
          ...state,
          input: "",
          wrong: state.wrong + 1,
          streak: 0,
          levelF: nextLevel(state.levelF, false, LEVEL_UP, LEVEL_DOWN),
          lastResult: "wrong",
          flashId: state.flashId + 1,
        };
      }

      const solved = state[side];
      const levelF = nextLevel(state.levelF, true, LEVEL_UP, LEVEL_DOWN);
      const fresh = makeProblem(levelF, rng, state.nextId);
      const streak = state.streak + 1;
      const correct = state.correct + 1;
      const bonus = correct % BONUS_EVERY_CORRECT === 0 ? BONUS_POINTS : 0;

      return {
        ...state,
        [side]: fresh,
        input: "",
        score: state.score + solved.points + bonus,
        correct,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        levelF,
        peakLevel: Math.max(state.peakLevel, levelBand(levelF)),
        lastResult: side,
        flashId: state.flashId + 1,
        nextId: state.nextId + 1,
      };
    }

    case "TICK": {
      if (state.phase !== "playing") return state;
      const timeLeftMs = state.timeLeftMs - action.deltaMs;
      if (timeLeftMs <= 0) {
        return { ...state, timeLeftMs: 0, phase: "over", input: "" };
      }
      return { ...state, timeLeftMs };
    }

    default:
      return state;
  }
}
