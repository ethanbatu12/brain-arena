import type { PlayerProfile } from "../player/types";
import { levelForTotalXp } from "./levels";
import { weekStartFor } from "../tournament/schedule";

function todayUtc(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/** Grants XP and re-derives the player's level from their new total. Never reduces XP. */
export function awardXp(profile: PlayerProfile, amount: number, nowMs: number = Date.now()): PlayerProfile {
  if (amount <= 0) return profile;
  const xp = profile.xp + amount;
  const today = todayUtc(nowMs);
  const weekStart = weekStartFor(nowMs);
  const xpToday = profile.xpEarnedToday?.date === today ? profile.xpEarnedToday.amount + amount : amount;
  const xpThisWeek =
    profile.xpEarnedThisWeek?.weekStart === weekStart ? profile.xpEarnedThisWeek.amount + amount : amount;
  return {
    ...profile,
    xp,
    level: levelForTotalXp(xp).level,
    xpEarnedToday: { date: today, amount: xpToday },
    xpEarnedThisWeek: { weekStart, amount: xpThisWeek },
  };
}
