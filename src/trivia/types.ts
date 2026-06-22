export type TriviaCategory =
  | "math"
  | "logic"
  | "patterns"
  | "probability"
  | "observation"
  | "chess"
  | "general";

export type TriviaDifficulty = "beginner" | "easy" | "medium" | "hard" | "expert" | "master";

export interface TriviaQuestion {
  id: number;
  category: TriviaCategory;
  difficulty: TriviaDifficulty;
  prompt: string;
  /** Exactly 4 answer choices. */
  choices: string[];
  correctIndex: number;
  /** Observation questions only: a small grid briefly shown before the prompt. */
  observationGrid?: string[][];
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
  nextId: number;
  lastResult: TriviaLastResult | null;
  flashId: number;
}

export type TriviaAction =
  | { type: "START" }
  | { type: "ANSWER"; questionId: number; choiceIndex: number }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
