import { emptySeasonProgress, seasonCompletionPercent, type SeasonProgress } from "./progress";
import { seasonLevelForXp } from "./rewards";
import { seasonIndexFor, themeForSeason } from "./schedule";

export interface SeasonHistoryEntry {
  seasonIndex: number;
  themeId: string;
  themeName: string;
  finalLevel: number;
  claimedRewardIds: string[];
  completionPercent: number;
  /**
   * No per-season leaderboard/ranking infrastructure exists yet (the
   * leaderboard is global/all-time, not season-scoped) — always null until
   * that's built.
   */
  finalLeaderboardPlacement: number | null;
}

function archiveSeason(progress: SeasonProgress): SeasonHistoryEntry {
  const theme = themeForSeason(progress.seasonIndex);
  return {
    seasonIndex: progress.seasonIndex,
    themeId: theme.id,
    themeName: theme.name,
    finalLevel: seasonLevelForXp(progress.seasonXp),
    claimedRewardIds: progress.claimedRewardIds,
    completionPercent: seasonCompletionPercent(progress),
    finalLeaderboardPlacement: null,
  };
}

/**
 * Ensures the player's season progress matches the currently-active season.
 * If a new season has started since they were last active, the old
 * progress is archived into history and a fresh SeasonProgress begins.
 * Idempotent — calling this repeatedly within the same season is a no-op.
 */
export function ensureCurrentSeason(
  progress: SeasonProgress,
  history: SeasonHistoryEntry[],
  nowMs: number,
): { progress: SeasonProgress; history: SeasonHistoryEntry[] } {
  const currentIndex = seasonIndexFor(nowMs);
  if (progress.seasonIndex === currentIndex) return { progress, history };

  // Only archive real prior seasons the player actually participated in
  // (skip archiving a never-touched/empty starting record, e.g. on a brand
  // new account whose initial seasonIndex predates the current one by
  // default but has zero XP and nothing claimed).
  const hadActivity = progress.seasonXp > 0 || progress.claimedRewardIds.length > 0;
  const nextHistory = hadActivity ? [...history, archiveSeason(progress)] : history;

  return { progress: emptySeasonProgress(currentIndex), history: nextHistory };
}
