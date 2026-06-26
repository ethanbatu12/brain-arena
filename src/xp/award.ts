import type { PlayerProfile } from "../player/types";
import { levelForTotalXp } from "./levels";
import { weekStartFor } from "../tournament/schedule";
import { coinsOwedForLevelUp } from "../coins/award";

function todayUtc(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/**
 * Grants XP and re-derives the player's level from their new total. Never
 * reduces XP. Also pays out the per-level coin reward (5/level up to 50,
 * 10/level from 51-100) for any new levels reached, tracked via
 * coinsGrantedForLevel so a level is never paid out twice.
 */
export function awardXp(profile: PlayerProfile, amount: number, nowMs: number = Date.now()): PlayerProfile {
  if (amount <= 0) return profile;
  const xp = profile.xp + amount;
  const newLevel = levelForTotalXp(xp).level;
  const today = todayUtc(nowMs);
  const weekStart = weekStartFor(nowMs);
  const xpToday = profile.xpEarnedToday?.date === today ? profile.xpEarnedToday.amount + amount : amount;
  const xpThisWeek =
    profile.xpEarnedThisWeek?.weekStart === weekStart ? profile.xpEarnedThisWeek.amount + amount : amount;
  const grantedForLevel = profile.coinsGrantedForLevel ?? 0;
  const levelCoins = coinsOwedForLevelUp(grantedForLevel, newLevel);
  return {
    ...profile,
    xp,
    level: newLevel,
    coins: profile.coins + levelCoins,
    coinsGrantedForLevel: Math.max(grantedForLevel, newLevel),
    xpEarnedToday: { date: today, amount: xpToday },
    xpEarnedThisWeek: { weekStart, amount: xpThisWeek },
  };
}
