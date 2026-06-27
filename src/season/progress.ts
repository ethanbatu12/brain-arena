import {
  bonusFinaleRewards,
  buildSeasonRewardTrack,
  seasonLevelForXp,
  xpIntoCurrentTier,
  SEASON_TIER_COUNT,
  SEASON_XP_PER_TIER,
  type SeasonReward,
} from "./rewards";
import { themeForSeason } from "./schedule";

/** Coin cost to skip straight to the next tier without earning the Season XP for it. */
export const SEASON_TIER_SKIP_COST = 100;

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

/** The Season XP needed to jump straight to the start of the next tier — exactly one tier's worth of progress. */
export function xpToSkipOneTier(progress: SeasonProgress): number {
  if (isSeasonMaxed(progress)) return 0;
  return SEASON_XP_PER_TIER - xpIntoCurrentTier(progress.seasonXp);
}

export type SkipTierResult = { ok: true; progress: SeasonProgress } | { ok: false; error: "already-maxed" };

/** Advances exactly one tier of Season XP — the caller is responsible for charging the coin cost. */
export function skipOneTier(progress: SeasonProgress): SkipTierResult {
  if (isSeasonMaxed(progress)) return { ok: false, error: "already-maxed" };
  return { ok: true, progress: awardSeasonXp(progress, xpToSkipOneTier(progress)) };
}
