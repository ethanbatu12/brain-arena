import { indexedDbProfileStore, type ProfileStore } from "./db";
import { GAME_IDS, type GameId, type GameStats, type PlayerProfile, type RatedPuzzleStats } from "./types";

const USERNAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

const store: ProfileStore = indexedDbProfileStore;

export function emptyGameStats(): GameStats {
  return { bestScore: 0, gamesPlayed: 0, totalScore: 0 };
}

export const INITIAL_PUZZLE_RATING = 1000;

export function emptyRatedPuzzleStats(): RatedPuzzleStats {
  return {
    rating: INITIAL_PUZZLE_RATING,
    highestRating: INITIAL_PUZZLE_RATING,
    totalCompleted: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalSolveTimeMs: 0,
    puzzleStats: {},
  };
}

/**
 * Points gained for solving a puzzle based on elapsed time.
 * ≤1 min: +20, then −5 per extra minute, floored at +10 after 3 minutes.
 */
export function ratingGainForTime(elapsedMs: number): number {
  const minutes = elapsedMs / 60_000;
  if (minutes <= 1) return 20;
  if (minutes <= 2) return 15;
  return 10;
}

export function recordRatedPuzzleResult(
  profile: PlayerProfile,
  correct: boolean,
  elapsedMs: number,
  puzzleId?: number,
): PlayerProfile {
  const prev = profile.ratedPuzzles;
  const gain = correct ? ratingGainForTime(elapsedMs) : -10;
  const newRating = Math.max(0, prev.rating + gain);

  const puzzleStats = { ...prev.puzzleStats };
  if (puzzleId !== undefined) {
    const cell = puzzleStats[puzzleId] ?? { attempts: 0, solves: 0 };
    puzzleStats[puzzleId] = {
      attempts: cell.attempts + 1,
      solves: cell.solves + (correct ? 1 : 0),
    };
  }

  const updated: RatedPuzzleStats = {
    rating: newRating,
    highestRating: Math.max(prev.highestRating, newRating),
    totalCompleted: prev.totalCompleted + 1,
    totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
    totalIncorrect: prev.totalIncorrect + (correct ? 0 : 1),
    totalSolveTimeMs: prev.totalSolveTimeMs + (correct ? elapsedMs : 0),
    puzzleStats,
  };
  return { ...profile, ratedPuzzles: updated };
}

export function puzzleWinPct(stats: RatedPuzzleStats): number {
  if (stats.totalCompleted === 0) return 0;
  return (stats.totalCorrect / stats.totalCompleted) * 100;
}

export function avgSolveTimeMs(stats: RatedPuzzleStats): number {
  if (stats.totalCorrect === 0) return 0;
  return stats.totalSolveTimeMs / stats.totalCorrect;
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
    ratedPuzzles: emptyRatedPuzzleStats(),
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

function normalizeRatedPuzzles(stats: Partial<RatedPuzzleStats> | undefined): RatedPuzzleStats {
  if (!stats) return emptyRatedPuzzleStats();
  return {
    ...emptyRatedPuzzleStats(),
    ...stats,
    puzzleStats: stats.puzzleStats ?? {},
  };
}

function normalizeProfile(profile: Partial<PlayerProfile>): PlayerProfile {
  return {
    ...profile,
    passwordHash: profile.passwordHash ?? "",
    passwordSalt: profile.passwordSalt ?? "",
    combinedBestScore: profile.combinedBestScore ?? 0,
    combinedTotalScore: profile.combinedTotalScore ?? 0,
    challengeRunsCompleted: profile.challengeRunsCompleted ?? 0,
    ratedPuzzles: normalizeRatedPuzzles(profile.ratedPuzzles),
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
