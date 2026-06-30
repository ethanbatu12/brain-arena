import type { Rng } from "../game/rng";
import { TRIVIA_GAME_MS, WRONG_ANSWER_LOCK_MS } from "./constants";
import { scoreForCorrect } from "./logic";
import { pickNextQuestion } from "./selection";
import type { TriviaAction, TriviaState } from "./types";

export function triviaInitialState(): TriviaState {
  return {
    phase: "idle",
    question: null,
    score: 0,
    timeLeftMs: TRIVIA_GAME_MS,
    correctCount: 0,
    wrongCount: 0,
    totalAnswered: 0,
    usedIds: [],
    lastResult: null,
    flashId: 0,
    lockedMs: 0,
  };
}

export function triviaReduce(state: TriviaState, action: TriviaAction, rng: Rng): TriviaState {
  switch (action.type) {
    case "RESET":
      return triviaInitialState();

    case "START": {
      const base = triviaInitialState();
      const question = pickNextQuestion(new Set(), 0, rng);
      return { ...base, phase: "playing", question, usedIds: [question.id] };
    }

    case "ANSWER": {
      if (state.phase !== "playing" || !state.question || state.lockedMs > 0) return state;
      if (action.questionId !== state.question.id) return state; // stale answer, ignore

      const correct = action.choiceIndex === state.question.correctIndex;
      const totalAnswered = state.totalAnswered + 1;
      const lastResult = { questionId: state.question.id, chosenIndex: action.choiceIndex, correct };

      if (!correct) {
        // Hold the same question on screen so the player can see what they
        // missed, instead of immediately jumping to the next one.
        return {
          ...state,
          wrongCount: state.wrongCount + 1,
          totalAnswered,
          lastResult,
          flashId: state.flashId + 1,
          lockedMs: WRONG_ANSWER_LOCK_MS,
        };
      }

      const correctCount = state.correctCount + 1;
      const score = state.score + scoreForCorrect(correctCount);
      const question = pickNextQuestion(new Set(state.usedIds), totalAnswered, rng);

      return {
        ...state,
        question,
        score,
        correctCount,
        totalAnswered,
        usedIds: [...state.usedIds, question.id].slice(-200),
        lastResult,
        flashId: state.flashId + 1,
      };
    }

    case "TICK": {
      if (state.phase !== "playing") return state;
      const timeLeftMs = state.timeLeftMs - action.deltaMs;
      if (timeLeftMs <= 0) {
        return { ...state, timeLeftMs: 0, phase: "over" };
      }

      if (state.lockedMs > 0) {
        const lockedMs = state.lockedMs - action.deltaMs;
        if (lockedMs <= 0 && state.question) {
          const question = pickNextQuestion(new Set(state.usedIds), state.totalAnswered, rng);
          return {
            ...state,
            timeLeftMs,
            lockedMs: 0,
            question,
            usedIds: [...state.usedIds, question.id].slice(-200),
          };
        }
        return { ...state, timeLeftMs, lockedMs: Math.max(0, lockedMs) };
      }

      return { ...state, timeLeftMs };
    }

    default:
      return state;
  }
}
