import type { PlayerProfile } from "../player/types";

/** Coins awarded for various platform-wide actions. */
export const COIN_AWARDS = {
  GAME_COMPLETE: 10,
  SCORE_OVER_1000: 10,
  NEW_PERSONAL_BEST: 25,
  DAILY_CHALLENGE: 25,
  ALL_DAILY_CHALLENGES_BONUS: 50,
} as const;

export const TOP3_COINS: [number, number, number] = [300, 200, 100];

export function coinsForRank(rank: 1 | 2 | 3): number {
  return TOP3_COINS[rank - 1];
}

/** Coins for completing a single game, plus any bonuses (high score, new personal best). */
export function coinsForGameResult(score: number, isNewBest: boolean): number {
  let coins = COIN_AWARDS.GAME_COMPLETE;
  if (score >= 1000) coins += COIN_AWARDS.SCORE_OVER_1000;
  if (isNewBest) coins += COIN_AWARDS.NEW_PERSONAL_BEST;
  return coins;
}

/** Grants coins. Never reduces the balance — spending is handled separately by purchase logic. */
export function awardCoins(profile: PlayerProfile, amount: number): PlayerProfile {
  if (amount <= 0) return profile;
  return { ...profile, coins: profile.coins + amount };
}

export const COINS_PER_LEVEL_1_TO_50 = 5;
export const COINS_PER_LEVEL_51_TO_100 = 10;

/**
 * Cumulative coins earned just for reaching `level` — 5 per level for
 * levels 1-50 (250 total), then 10 per level for 51-100 (another 500,
 * 750 total by level 100). Reaching level 1 itself (every player's
 * starting point) is worth 5 — that's the baseline a level-N player is
 * entitled to having earned by leveling alone.
 */
export function coinsForLevel(level: number): number {
  const clamped = Math.max(0, level);
  const tier1 = Math.min(clamped, 50);
  const tier2 = Math.max(0, clamped - 50);
  return tier1 * COINS_PER_LEVEL_1_TO_50 + tier2 * COINS_PER_LEVEL_51_TO_100;
}

/**
 * The coins owed for leveling from `grantedForLevel` up to `newLevel`,
 * given that `grantedForLevel` has already been paid out. Used both for
 * ongoing level-ups and for retroactively catching up players who leveled
 * up before this system existed.
 */
export function coinsOwedForLevelUp(grantedForLevel: number, newLevel: number): number {
  if (newLevel <= grantedForLevel) return 0;
  return coinsForLevel(newLevel) - coinsForLevel(grantedForLevel);
}
