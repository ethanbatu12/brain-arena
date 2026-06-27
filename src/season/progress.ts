import { bonusFinaleRewards, buildSeasonRewardTrack, seasonLevelForXp, SEASON_TIER_COUNT, type SeasonReward } from "./rewards";
import { themeForSeason } from "./schedule";

export interface SeasonProgress {
  seasonIndex: number;
  seasonXp: number;
  /** Reward ids already claimed this season — claiming is idempotent. */
  claimedRewardIds: string[];
  /** Stored per the spec; no in-app purchase flow exists yet, so this never becomes true on its own. */
  premiumOwned: boolean;
}

export function emptySeasonProgress(seasonIndex: number): SeasonProgress {
  return { seasonIndex, seasonXp: 0, claimedRewardIds: [], premiumOwned: false };
}

/** Grants Season XP. Never reduces it — entirely separate from regular Level XP. */
export function awardSeasonXp(progress: SeasonProgress, amount: number): SeasonProgress {
  if (amount <= 0) return progress;
  return { ...progress, seasonXp: progress.seasonXp + amount };
}

/** The full reward track (100 tiers + tier-100 bonus rewards) for the season `progress` belongs to. */
export function rewardTrackFor(progress: SeasonProgress): SeasonReward[] {
  const theme = themeForSeason(progress.seasonIndex);
  return [...buildSeasonRewardTrack(theme.id, theme.name), ...bonusFinaleRewards(theme.id, theme.name)];
}

/** Rewards the player has reached (by level) but hasn't claimed yet. */
export function claimableRewards(progress: SeasonProgress): SeasonReward[] {
  const level = seasonLevelForXp(progress.seasonXp);
  const claimed = new Set(progress.claimedRewardIds);
  return rewardTrackFor(progress).filter((r) => r.tier <= level && !claimed.has(r.id));
}

export type ClaimResult =
  | { ok: true; progress: SeasonProgress; reward: SeasonReward }
  | { ok: false; error: "not-reached" | "already-claimed" | "unknown-reward" };

/** Claims a single reward by id. Idempotent — claiming the same id twice is a no-op error, not a double-grant. */
export function claimReward(progress: SeasonProgress, rewardId: string): ClaimResult {
  const reward = rewardTrackFor(progress).find((r) => r.id === rewardId);
  if (!reward) return { ok: false, error: "unknown-reward" };
  if (progress.claimedRewardIds.includes(rewardId)) return { ok: false, error: "already-claimed" };
  const level = seasonLevelForXp(progress.seasonXp);
  if (reward.tier > level) return { ok: false, error: "not-reached" };
  return {
    ok: true,
    progress: { ...progress, claimedRewardIds: [...progress.claimedRewardIds, rewardId] },
    reward,
  };
}

/** 0-100, how much of the season's reward track has been claimed. */
export function seasonCompletionPercent(progress: SeasonProgress): number {
  const total = rewardTrackFor(progress).length;
  if (total === 0) return 0;
  return Math.round((progress.claimedRewardIds.length / total) * 100);
}

export function isSeasonMaxed(progress: SeasonProgress): boolean {
  return seasonLevelForXp(progress.seasonXp) >= SEASON_TIER_COUNT;
}
