import { GAME_IDS, type DailyChallengeRecord, type GameId, type PlayerProfile } from "./types";

export function getDailyGameId(dateStr: string): GameId {
  // Simple deterministic mapping: parse the date digits and mod by game count
  const seed = parseInt(dateStr.replace(/-/g, ""), 10);
  return GAME_IDS[seed % GAME_IDS.length];
}

export function getTodaysDailyRecord(profile: PlayerProfile, today: string): DailyChallengeRecord | null {
  return profile.dailyChallenges.find((r) => r.date === today) ?? null;
}

export function recordDailyChallengeResult(
  profile: PlayerProfile,
  date: string,
  gameId: GameId,
  score: number,
): PlayerProfile {
  const existing = profile.dailyChallenges.find((r) => r.date === date);
  const newRecord: DailyChallengeRecord = {
    date,
    gameId,
    score: existing ? Math.max(existing.score, score) : score,
    completed: true,
  };
  const rest = profile.dailyChallenges.filter((r) => r.date !== date);
  return { ...profile, dailyChallenges: [...rest, newRecord] };
}
