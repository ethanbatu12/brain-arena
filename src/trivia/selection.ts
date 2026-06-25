import type { Rng } from "../game/rng";
import { ALL_QUESTIONS } from "./questionBank";
import type { TriviaDifficulty, TriviaQuestion } from "./types";

const DIFFICULTIES: TriviaDifficulty[] = ["easy", "medium", "hard", "expert"];

/**
 * Weighted odds of each difficulty at a given "ramp stage" (0 = very start
 * of a run, higher = further in). Early stages lean Easy/Medium; later
 * stages shift weight toward Hard/Expert, per the spec's "gradually
 * increase" requirement — without ever fully excluding the easier tiers.
 */
function weightsForStage(stage: number): [number, number, number, number] {
  if (stage <= 1) return [55, 35, 8, 2];
  if (stage <= 3) return [35, 40, 20, 5];
  if (stage <= 6) return [15, 35, 35, 15];
  return [5, 20, 40, 35];
}

/** Which ramp stage a question index (0-based, questions answered so far) falls into. */
export function stageForQuestionIndex(index: number): number {
  return Math.floor(index / 3);
}

function pickDifficulty(stage: number, rng: Rng): TriviaDifficulty {
  const weights = weightsForStage(stage);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return DIFFICULTIES[i];
  }
  return DIFFICULTIES[DIFFICULTIES.length - 1];
}

function pickFrom<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/**
 * Picks the next question for a run. Prefers a question the player hasn't
 * seen in `usedIds` yet; if every question at the rolled difficulty has
 * already been used, falls back to the least-recently-used ones across all
 * difficulties rather than ever being stuck with no question.
 */
export function pickNextQuestion(
  usedIds: ReadonlySet<number>,
  questionIndex: number,
  rng: Rng,
  pool: readonly TriviaQuestion[] = ALL_QUESTIONS,
): TriviaQuestion {
  const stage = stageForQuestionIndex(questionIndex);
  const difficulty = pickDifficulty(stage, rng);

  const atDifficulty = pool.filter((q) => q.difficulty === difficulty);
  const unseenAtDifficulty = atDifficulty.filter((q) => !usedIds.has(q.id));
  if (unseenAtDifficulty.length > 0) return pickFrom(unseenAtDifficulty, rng);

  const unseenAnywhere = pool.filter((q) => !usedIds.has(q.id));
  if (unseenAnywhere.length > 0) return pickFrom(unseenAnywhere, rng);

  // Every question has been seen this run (only possible once the whole
  // bank is exhausted) — recycle from the chosen difficulty rather than
  // softlocking.
  if (atDifficulty.length > 0) return pickFrom(atDifficulty, rng);
  return pickFrom(pool, rng);
}
