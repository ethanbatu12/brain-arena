import type { Rng } from "../game/rng";
import { DIRECTION_GAME_MS, MIN_FEATURES_REQUIRED } from "./constants";
import { makeQuestion, scoreForCorrect } from "./logic";
import type { DirectionAction, DirectionState } from "./types";

export function directionInitialState(): DirectionState {
  return {
    phase: "idle",
    origin: null,
    features: [],
    routes: [],
    question: null,
    score: 0,
    timeLeftMs: DIRECTION_GAME_MS,
    correctCount: 0,
    wrongCount: 0,
    totalAnswered: 0,
    nextId: 1,
    lastResult: null,
    flashId: 0,
    errorMessage: null,
  };
}

export function directionReduce(state: DirectionState, action: DirectionAction, rng: Rng): DirectionState {
  switch (action.type) {
    case "RESET":
      return directionInitialState();

    case "START": {
      const base = directionInitialState();
      return { ...base, phase: "locating" };
    }

    case "LOCATED": {
      if (state.phase !== "locating") return state;
      return { ...state, phase: "loading", origin: action.origin };
    }

    case "LOAD_FAILED": {
      if (state.phase !== "locating" && state.phase !== "loading") return state;
      return { ...state, phase: "error", errorMessage: action.message };
    }

    case "FEATURES_LOADED": {
      if (state.phase !== "loading" || !state.origin) return state;
      if (action.features.length < MIN_FEATURES_REQUIRED) {
        return {
          ...state,
          phase: "error",
          errorMessage: "Not enough nearby map data was found to generate questions. Try again outdoors or in a denser area.",
        };
      }
      const question = makeQuestion(state.origin, action.features, action.routes, rng, state.nextId);
      return {
        ...state,
        phase: "playing",
        features: action.features,
        routes: action.routes,
        question,
        nextId: state.nextId + 1,
      };
    }

    case "ANSWER": {
      if (state.phase !== "playing" || !state.question || !state.origin) return state;
      if (action.questionId !== state.question.id) return state; // stale answer, ignore

      const correct = action.choiceIndex === state.question.correctIndex;
      const correctCount = correct ? state.correctCount + 1 : state.correctCount;
      const wrongCount = correct ? state.wrongCount : state.wrongCount + 1;
      const totalAnswered = state.totalAnswered + 1;
      const score = correct ? state.score + scoreForCorrect(correctCount) : state.score;
      const question = makeQuestion(state.origin, state.features, state.routes, rng, state.nextId);

      return {
        ...state,
        question,
        score,
        correctCount,
        wrongCount,
        totalAnswered,
        nextId: state.nextId + 1,
        lastResult: { questionId: state.question.id, chosenIndex: action.choiceIndex, correct },
        flashId: state.flashId + 1,
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
