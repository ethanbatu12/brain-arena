import { awardXp } from "../xp/award";
import type { PlayerProfile } from "../player/types";
import { cosmeticForRank, xpForRank } from "./rewards";
import { emptyTournamentStats, type TournamentHistoryEntry } from "./types";
import { awardCoins, coinsForRank } from "../coins/award";
import { awardSeasonXp } from "../season/progress";
import { seasonXpForTournamentRank } from "../season/xp";

/** Which rank (if any) this username placed at in a finalized tournament. */
function rankFor(entry: TournamentHistoryEntry, username: string): 1 | 2 | 3 | null {
  if (entry.first?.username === username) return 1;
  if (entry.second?.username === username) return 2;
  if (entry.third?.username === username) return 3;
  return null;
}

/**
 * Applies any unclaimed top-3 tournament rewards to a profile: XP, the
 * exclusive cosmetic for that rank/week, tournament stats, and a temporary
 * Champion/Finalist badge. Idempotent — a week already in
 * claimedTournamentWeeks is skipped, so calling this repeatedly (e.g. on
 * every app load) never double-awards.
 */
export function claimTournamentRewards(
  profile: PlayerProfile,
  history: TournamentHistoryEntry[],
): { profile: PlayerProfile; newlyClaimed: { weekStart: string; rank: 1 | 2 | 3 }[] } {
  let working = profile;
  const claimed = new Set(working.claimedTournamentWeeks);
  const newlyClaimed: { weekStart: string; rank: 1 | 2 | 3 }[] = [];

  for (const entry of history) {
    if (claimed.has(entry.weekStart)) continue;
    const rank = rankFor(entry, working.username);
    if (rank === null) continue;

    const xp = xpForRank(rank);
    const cosmetic = cosmeticForRank(entry.weekStart, rank);
    const stats = working.tournamentStats ?? emptyTournamentStats();

    working = awardXp(working, xp);
    working = awardCoins(working, coinsForRank(rank));
    working = { ...working, seasonProgress: awardSeasonXp(working.seasonProgress, seasonXpForTournamentRank(rank)) };
    working = {
      ...working,
      exclusiveCosmetics: working.exclusiveCosmetics.includes(cosmetic.value)
        ? working.exclusiveCosmetics
        : [...working.exclusiveCosmetics, cosmetic.value],
      tournamentStats: {
        weeklyWins: stats.weeklyWins + (rank === 1 ? 1 : 0),
        top3Finishes: stats.top3Finishes + 1,
        bestRank: stats.bestRank === null ? rank : Math.min(stats.bestRank, rank),
        totalTournamentXp: stats.totalTournamentXp + xp,
      },
      weeklyBadge: {
        type: rank === 1 ? "champion" : "finalist",
        weekStart: entry.weekStart,
        expiresAt: new Date(new Date(entry.finalizedAt).getTime() + 7 * 86_400_000).toISOString(),
      },
      claimedTournamentWeeks: [...working.claimedTournamentWeeks, entry.weekStart],
    };
    claimed.add(entry.weekStart);
    newlyClaimed.push({ weekStart: entry.weekStart, rank });
  }

  return { profile: working, newlyClaimed };
}

/** Whether a weekly badge is still within its display window. */
export function isBadgeActive(badge: { expiresAt: string } | null, nowMs: number = Date.now()): boolean {
  if (!badge) return false;
  return new Date(badge.expiresAt).getTime() > nowMs;
}
