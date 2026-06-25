import type { Rng } from "../game/rng";
import { TRIVIA_GAME_MS } from "./constants";
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
      if (state.phase !== "playing" || !state.question) return state;
      if (action.questionId !== state.question.id) return state; // stale answer, ignore

      const correct = action.choiceIndex === state.question.correctIndex;
      const correctCount = correct ? state.correctCount + 1 : state.correctCount;
      const wrongCount = correct ? state.wrongCount : state.wrongCount + 1;
      const totalAnswered = state.totalAnswered + 1;
      const score = correct ? state.score + scoreForCorrect(correctCount) : state.score;

      const question = pickNextQuestion(new Set(state.usedIds), totalAnswered, rng);

      return {
        ...state,
        question,
        score,
        correctCount,
        wrongCount,
        totalAnswered,
        usedIds: [...state.usedIds, question.id].slice(-200),
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
