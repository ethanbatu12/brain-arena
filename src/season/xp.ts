/** Season XP rewards — a completely separate currency from regular Level XP. */
export const SEASON_XP_AWARDS = {
  GAME_COMPLETE: 10,
  NEW_PERSONAL_BEST: 20,
  DAILY_CHALLENGE: 25,
  ALL_DAILY_CHALLENGES_BONUS: 50,
  TOURNAMENT_TOP_10: 100,
  TOURNAMENT_WINNER: 250,
  ACHIEVEMENT_UNLOCKED: 50,
} as const;

/** Season XP for finishing a single game, plus a bonus if it's a new personal best. */
export function seasonXpForGameResult(isNewBest: boolean): number {
  return SEASON_XP_AWARDS.GAME_COMPLETE + (isNewBest ? SEASON_XP_AWARDS.NEW_PERSONAL_BEST : 0);
}

/** Season XP for a weekly tournament finish — 1st place gets the winner bonus instead of (not on top of) the top-10 bonus. */
export function seasonXpForTournamentRank(rank: number): number {
  if (rank === 1) return SEASON_XP_AWARDS.TOURNAMENT_WINNER;
  if (rank <= 10) return SEASON_XP_AWARDS.TOURNAMENT_TOP_10;
  return 0;
}
