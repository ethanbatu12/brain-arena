import { indexedDbProfileStore, type ProfileStore } from "./db";
import { GAME_IDS, type GameId, type GameStats, type PlayerProfile } from "./types";

const USERNAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

const store: ProfileStore = indexedDbProfileStore;

export function emptyGameStats(): GameStats {
  return { bestScore: 0, gamesPlayed: 0, totalScore: 0 };
}

export function createProfile(username: string, passwordHash: string, passwordSalt: string): PlayerProfile {
  const games = {} as Record<GameId, GameStats>;
  for (const id of GAME_IDS) games[id] = emptyGameStats();

  return {
    username,
    passwordHash,
    passwordSalt,
    games,
    totalGamesPlayed: 0,
    overallBestScore: 0,
    overallTotalScore: 0,
    combinedBestScore: 0,
    combinedTotalScore: 0,
    challengeRunsCompleted: 0,
  };
}

export function validateUsername(raw: string): { ok: true; username: string } | { ok: false; error: string } {
  const username = raw.trim();

  if (username.length < 2) {
    return { ok: false, error: "Username must be at least 2 characters." };
  }
  if (username.length > 20) {
    return { ok: false, error: "Username must be at most 20 characters." };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "Username can only contain letters, numbers, spaces, hyphens, and underscores." };
  }

  return { ok: true, username };
}

export function validatePassword(raw: string): { ok: true; password: string } | { ok: false; error: string } {
  if (raw.length < 4) {
    return { ok: false, error: "Password must be at least 4 characters." };
  }
  if (raw.length > 40) {
    return { ok: false, error: "Password must be at most 40 characters." };
  }

  return { ok: true, password: raw };
}

export function recordGameResult(profile: PlayerProfile, gameId: GameId, score: number): PlayerProfile {
  const prevGame = profile.games[gameId];
  const nextGame: GameStats = {
    bestScore: Math.max(prevGame.bestScore, score),
    gamesPlayed: prevGame.gamesPlayed + 1,
    totalScore: prevGame.totalScore + score,
  };

  return {
    ...profile,
    games: { ...profile.games, [gameId]: nextGame },
    totalGamesPlayed: profile.totalGamesPlayed + 1,
    overallBestScore: Math.max(profile.overallBestScore, score),
    overallTotalScore: profile.overallTotalScore + score,
  };
}

export function recordCombinedResult(profile: PlayerProfile, score: number): PlayerProfile {
  return {
    ...profile,
    combinedBestScore: Math.max(profile.combinedBestScore, score),
    combinedTotalScore: profile.combinedTotalScore + score,
    challengeRunsCompleted: profile.challengeRunsCompleted + 1,
    overallBestScore: Math.max(profile.overallBestScore, score),
    overallTotalScore: profile.overallTotalScore + score,
  };
}

/** Average score per game session. Zero when no games have been played. */
export function averageScore(stats: GameStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return stats.totalScore / stats.gamesPlayed;
}

/** Average score across every game session, of any game, ever played. */
export function overallAverageScore(profile: PlayerProfile): number {
  if (profile.totalGamesPlayed === 0) return 0;
  return profile.overallTotalScore / profile.totalGamesPlayed;
}

/** Average combined total across completed All Games Challenge runs. */
export function combinedAverageScore(profile: PlayerProfile): number {
  if (profile.challengeRunsCompleted === 0) return 0;
  return profile.combinedTotalScore / profile.challengeRunsCompleted;
}

function normalizeProfile(profile: Partial<PlayerProfile>): PlayerProfile {
  return {
    ...profile,
    passwordHash: profile.passwordHash ?? "",
    passwordSalt: profile.passwordSalt ?? "",
    combinedBestScore: profile.combinedBestScore ?? 0,
    combinedTotalScore: profile.combinedTotalScore ?? 0,
    challengeRunsCompleted: profile.challengeRunsCompleted ?? 0,
  } as PlayerProfile;
}

export async function loadProfiles(): Promise<Record<string, PlayerProfile>> {
  try {
    const profiles = await store.getAllProfiles();
    const normalized: Record<string, PlayerProfile> = {};
    for (const [username, profile] of Object.entries(profiles)) {
      normalized[username] = normalizeProfile(profile);
    }
    return normalized;
  } catch {
    return {};
  }
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  await store.putProfile(profile);
}

export async function loadCurrentUsername(): Promise<string | null> {
  try {
    return await store.getCurrentUsername();
  } catch {
    return null;
  }
}

export async function saveCurrentUsername(name: string): Promise<void> {
  await store.setCurrentUsername(name);
}

export async function clearCurrentUsername(): Promise<void> {
  await store.clearCurrentUsername();
}
