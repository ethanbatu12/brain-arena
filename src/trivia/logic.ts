import type { Rng } from "../game/rng";
import {
  BONUS_EVERY_CORRECT,
  BONUS_POINTS,
  CATEGORIES,
  DIFFICULTY_LABELS,
  MAX_BAND,
  MIN_BAND,
  POINTS_PER_CORRECT,
  QUESTIONS_PER_BAND_STEP,
  STARTING_BAND_OFFSET,
} from "./constants";
import { generateChessQuestion } from "./generators/chess";
import { generateGeneralQuestion } from "./generators/general";
import { generateLogicQuestion } from "./generators/logic";
import { generateMathQuestion } from "./generators/math";
import { generateObservationQuestion } from "./generators/observation";
import { generatePatternQuestion } from "./generators/patterns";
import { generateProbabilityQuestion } from "./generators/probability";
import { pick } from "./utils";
import type { TriviaCategory, TriviaDifficulty, TriviaQuestion } from "./types";

/** Maps a 1-6 difficulty band to its named tier. */
export function bandToDifficulty(band: number): TriviaDifficulty {
  const clamped = Math.max(MIN_BAND, Math.min(MAX_BAND, Math.round(band)));
  return DIFFICULTY_LABELS[clamped - 1];
}

/**
 * Difficulty ramps up as more questions are answered, capping at MAX_BAND.
 * The round starts STARTING_BAND_OFFSET bands above the floor, so even the
 * first question skips the very easiest tier.
 */
export function bandForQuestionIndex(questionsAnswered: number): number {
  const band = MIN_BAND + STARTING_BAND_OFFSET + Math.floor(questionsAnswered / QUESTIONS_PER_BAND_STEP);
  return Math.max(MIN_BAND, Math.min(MAX_BAND, band));
}

const GENERATORS: Record<
  TriviaCategory,
  (band: number, difficulty: TriviaDifficulty, rng: Rng, id: number) => TriviaQuestion
> = {
  math: generateMathQuestion,
  logic: generateLogicQuestion,
  patterns: generatePatternQuestion,
  probability: generateProbabilityQuestion,
  observation: generateObservationQuestion,
  chess: generateChessQuestion,
  general: generateGeneralQuestion,
};

/** Generates one trivia question from a randomly chosen category at the given difficulty band. */
export function makeQuestion(band: number, rng: Rng, id: number): TriviaQuestion {
  const category = pick(CATEGORIES, rng);
  const difficulty = bandToDifficulty(band);
  return GENERATORS[category](band, difficulty, rng, id);
}

/** Points earned for a single correct answer, before any bonus. */
export function pointsForCorrect(): number {
  return POINTS_PER_CORRECT;
}

/** Whether this correct-answer count (after incrementing) completes a bonus streak. */
export function isBonusCorrect(correctSoFar: number): boolean {
  return correctSoFar > 0 && correctSoFar % BONUS_EVERY_CORRECT === 0;
}

/** Total points awarded for a correct answer, including bonus if it completes a streak. */
export function scoreForCorrect(correctSoFar: number): number {
  return pointsForCorrect() + (isBonusCorrect(correctSoFar) ? BONUS_POINTS : 0);
}

/** Accuracy percentage, 0 when no questions have been answered. */
export function triviaAccuracy(correctCount: number, totalAnswered: number): number {
  if (totalAnswered === 0) return 0;
  return (correctCount / totalAnswered) * 100;
}
