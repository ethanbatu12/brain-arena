import { ENTERTAINMENT_SEEDS } from "./questions/entertainment";
import { GENERAL_SEEDS } from "./questions/general";
import { GEOGRAPHY_SEEDS } from "./questions/geography";
import { HISTORY_SEEDS } from "./questions/history";
import { LOGIC_SEEDS } from "./questions/logic";
import { MATH_SEEDS } from "./questions/math";
import { NATURE_SEEDS } from "./questions/nature";
import type { QuestionSeed } from "./questions/seed";
import { SCIENCE_SEEDS } from "./questions/science";
import { SPACE_SEEDS } from "./questions/space";
import { SPORTS_SEEDS } from "./questions/sports";
import { TECHNOLOGY_SEEDS } from "./questions/technology";
import { buildChoices } from "./utils";
import { mulberry32 } from "../game/rng";
import type { TriviaCategory, TriviaQuestion } from "./types";

/**
 * Every category's seed list, in one place. Adding thousands more questions
 * later is just appending to these arrays (or adding a new category file
 * and registering it here) — nothing else in the game needs to change.
 */
const SEEDS_BY_CATEGORY: Record<TriviaCategory, QuestionSeed[]> = {
  sports: SPORTS_SEEDS,
  geography: GEOGRAPHY_SEEDS,
  science: SCIENCE_SEEDS,
  history: HISTORY_SEEDS,
  technology: TECHNOLOGY_SEEDS,
  entertainment: ENTERTAINMENT_SEEDS,
  nature: NATURE_SEEDS,
  space: SPACE_SEEDS,
  math: MATH_SEEDS,
  logic: LOGIC_SEEDS,
  general: GENERAL_SEEDS,
};

/** Deterministic shuffle so choice order doesn't always put the correct answer in the same slot. */
const shuffleRng = mulberry32(20260101);

function buildBank(): TriviaQuestion[] {
  const all: TriviaQuestion[] = [];
  let id = 1;
  for (const category of Object.keys(SEEDS_BY_CATEGORY) as TriviaCategory[]) {
    for (const seed of SEEDS_BY_CATEGORY[category]) {
      const { choices, correctIndex } = buildChoices(shuffleRng, seed.correct, seed.wrong);
      all.push({
        id: id++,
        category,
        difficulty: seed.difficulty,
        type: seed.type,
        prompt: seed.prompt,
        image: seed.image,
        choices,
        correctIndex,
      });
    }
  }
  return all;
}

/** The full static question bank, built once at module load. */
export const ALL_QUESTIONS: TriviaQuestion[] = buildBank();

export function questionsByDifficulty(difficulty: TriviaQuestion["difficulty"]): TriviaQuestion[] {
  return ALL_QUESTIONS.filter((q) => q.difficulty === difficulty);
}
