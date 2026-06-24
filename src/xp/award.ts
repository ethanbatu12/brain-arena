import type { PlayerProfile } from "../player/types";
import { levelForTotalXp } from "./levels";

/** Grants XP and re-derives the player's level from their new total. Never reduces XP. */
export function awardXp(profile: PlayerProfile, amount: number): PlayerProfile {
  if (amount <= 0) return profile;
  const xp = profile.xp + amount;
  return { ...profile, xp, level: levelForTotalXp(xp).level };
}
