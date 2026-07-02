import { BONUS_EVERY, BONUS_POINTS, CUBE_GAME_MS, MAX_INPUT_LEN, MIN_LEVEL, POINTS_PER_CORRECT } from "./constants";
import { generateStructure, levelForCorrectCount } from "./logic";
import type { CubeAction, CubeState, Structure } from "./types";
import type { Rng } from "../game/rng";

/** A placeholder shown only while idle (before the first START). */
const BLANK: Structure = { id: 0, cols: 0, rows: 0, heights: [], total: 0, questionKind: "total", questionPrompt: "", questionAnswer: 0 };

export function cubeInitialState(): CubeState {
  return {
    phase: "idle",
    structure: BLANK,
    input: "",
    score: 0,
    timeLeftMs: CUBE_GAME_MS,
    level: MIN_LEVEL,
    correct: 0,
    wrong: 0,
    streakToBonus: 0,
    peakLevel: MIN_LEVEL,
    lastResult: null,
    flashId: 0,
    nextId: 1,
  };
}

/** Keep only digits and cap the length, so the input is always a clean number. */
function sanitize(value: string): string {
  return value.replace(/\D/g, "").slice(0, MAX_INPUT_LEN);
}

export function cubeReduce(state: CubeState, action: CubeAction, rng: Rng): CubeState {
  switch (action.type) {
    case "RESET":
      return cubeInitialState();

    case "START": {
      const base = cubeInitialState();
      const structure = generateStructure(base.level, rng, 1);
      return { ...base, phase: "playing", structure, nextId: 2 };
    }

    case "INPUT_CHANGE": {
      if (state.phase !== "playing") return state;
      return { ...state, input: sanitize(action.value) };
    }

    case "SUBMIT": {
      if (state.phase !== "playing") return state;
      if (state.input === "") return state;
      const guess = Number(state.input);

      if (guess === state.structure.questionAnswer) {
        const correct = state.correct + 1;
        const level = levelForCorrectCount(correct);
        const streakToBonus = (state.streakToBonus + 1) % BONUS_EVERY;
        const bonus = streakToBonus === 0 ? BONUS_POINTS : 0;
        const structure = generateStructure(level, rng, state.nextId);

        return {
          ...state,
          structure,
          input: "",
          score: state.score + POINTS_PER_CORRECT + bonus,
          correct,
          streakToBonus,
          level,
          peakLevel: Math.max(state.peakLevel, level),
          lastResult: "correct",
          flashId: state.flashId + 1,
          nextId: state.nextId + 1,
        };
      }

      // Wrong: feedback, move on, difficulty holds steady.
      const structure = generateStructure(state.level, rng, state.nextId);
      return {
        ...state,
        structure,
        input: "",
        wrong: state.wrong + 1,
        lastResult: "wrong",
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
