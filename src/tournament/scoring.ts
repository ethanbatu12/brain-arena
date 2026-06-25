import type { GameId } from "../player/types";

/**
 * Generous per-game ceilings for a single round's score, used only to reject
 * obviously-impossible/tampered submissions (e.g. a manually-edited request
 * claiming a score in the millions). Set well above any score a legitimate
 * player could realistically reach, based on each game's actual point values
 * (the existing "Unstoppable" achievement, for comparison, fires at 5000).
 */
const SCORE_CEILING: Record<GameId, number> = {
  memory: 20_000,
  math: 20_000,
  logic: 20_000,
  balloon: 20_000,
  pattern: 20_000,
  reaction: 20_000,
  trivia: 20_000,
  direction: 20_000,
};

/** Whether a submitted score for this game is at least plausible — not negative, not absurdly large, a finite integer. */
export function isPlausibleScore(gameId: GameId, score: number): boolean {
  if (!Number.isFinite(score) || !Number.isInteger(score)) return false;
  if (score < 0) return false;
  return score <= SCORE_CEILING[gameId];
}
