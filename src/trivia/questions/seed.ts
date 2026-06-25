import type { TriviaDifficulty } from "../types";

/** A question before it's been assigned an id/category by the question bank. */
export interface QuestionSeed {
  difficulty: TriviaDifficulty;
  type: "multiple-choice" | "image";
  prompt: string;
  image?: string;
  correct: string;
  wrong: [string, string, string];
}

/** Shorthand for a standard 4-choice multiple-choice question. */
export function mc(
  difficulty: TriviaDifficulty,
  prompt: string,
  correct: string,
  wrong: [string, string, string],
): QuestionSeed {
  return { difficulty, type: "multiple-choice", prompt, correct, wrong };
}

/** Shorthand for an image-type question (e.g. "which flag is this?"). */
export function img(
  difficulty: TriviaDifficulty,
  image: string,
  prompt: string,
  correct: string,
  wrong: [string, string, string],
): QuestionSeed {
  return { difficulty, type: "image", prompt, image, correct, wrong };
}
