export type TriviaCategory =
  | "sports"
  | "geography"
  | "science"
  | "history"
  | "technology"
  | "entertainment"
  | "nature"
  | "space"
  | "math"
  | "logic"
  | "general";

export type TriviaDifficulty = "easy" | "medium" | "hard" | "expert";

export type TriviaQuestionType = "multiple-choice" | "image";

export interface TriviaQuestion {
  id: number;
  category: TriviaCategory;
  difficulty: TriviaDifficulty;
  type: TriviaQuestionType;
  prompt: string;
  /** Image-type questions only: an emoji/glyph shown above the prompt (e.g. a flag). */
  image?: string;
  /** Exactly 4 answer choices. */
  choices: string[];
  correctIndex: number;
}

export type TriviaPhase = "idle" | "playing" | "over";

export interface TriviaLastResult {
  questionId: number;
  chosenIndex: number;
  correct: boolean;
}

export interface TriviaState {
  phase: TriviaPhase;
  question: TriviaQuestion | null;
  score: number;
  timeLeftMs: number;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  /** Ids of questions already seen this run, most-recent last — used to avoid repeats. */
  usedIds: number[];
  lastResult: TriviaLastResult | null;
  flashId: number;
}

export type TriviaAction =
  | { type: "START" }
  | { type: "ANSWER"; questionId: number; choiceIndex: number }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
