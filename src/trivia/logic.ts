import { BONUS_EVERY_CORRECT, BONUS_POINTS, POINTS_PER_CORRECT } from "./constants";

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
