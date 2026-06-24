import { DEFAULT_AVATAR_CONFIG } from "../avatar/defaults";
import { sanitizeAvatarConfig } from "../avatar/serialize";
import { indexedDbProfileStore, type ProfileStore } from "./db";
import {
  GAME_IDS,
  type GameId,
  type GameStats,
  type PlayerProfile,
  type RatedPatternStats,
  type RatedPuzzleStats,
  type StreakData,
} from "./types";
import {
  RATED_PATTERN_HISTORY_SIZE,
  RATED_PATTERN_INITIAL_RATING,
} from "../pattern/constants";
import { emptyStreak } from "./streak";

const USERNAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

const store: ProfileStore = indexedDbProfileStore;

export function emptyGameStats(): GameStats {
  return { bestScore: 0, gamesPlayed: 0, totalScore: 0 };
}

export const INITIAL_PUZZLE_RATING = 1000;

export function emptyRatedPatternStats(): RatedPatternStats {
  return {
    rating: RATED_PATTERN_INITIAL_RATING,
    highestRating: 0,
    gamesPlayed: 0,
    totalSolved: 0,
    totalAttempted: 0,
    longestStreak: 0,
    ratingHistory: [],
  };
}

export function recordRatedPatternRun(
  profile: PlayerProfile,
  solvedThisRun: number,
  attemptedThisRun: number,
  ratingDelta: number,
): PlayerProfile {
  const prev = profile.ratedPatterns;
  const newRating = Math.max(0, prev.rating + ratingDelta);
  const newHistory = [...prev.ratingHistory, newRating].slice(-RATED_PATTERN_HISTORY_SIZE);
  return {
    ...profile,
    ratedPatterns: {
      rating: newRating,
      highestRating: Math.max(prev.highestRating, newRating),
      gamesPlayed: prev.gamesPlayed + 1,
      totalSolved: prev.totalSolved + solvedThisRun,
      totalAttempted: prev.totalAttempted + attemptedThisRun,
      longestStreak: Math.max(prev.longestStreak, solvedThisRun),
      ratingHistory: newHistory,
    },
  };
}

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

export function createProfile(
  username: string,
  passwordHash: string,
  passwordSalt: string,
  avatarConfig = DEFAULT_AVATAR_CONFIG,
): PlayerProfile {
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
    ratedPatterns: emptyRatedPatternStats(),
    streak: emptyStreak(),
    achievements: [],
    dailyChallenges: [],
    avatar: "🧠",
    avatarConfig,
    level: 1,
    reactionDotsHit: 0,
    triviaQuestionsAnswered: 0,
    triviaCorrectAnswers: 0,
    directionQuestionsAnswered: 0,
    directionCorrectAnswers: 0,
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

/** Records a Reaction Grid result: updates games.reaction stats plus the cumulative dots-hit tally. */
export function recordReactionResult(profile: PlayerProfile, score: number, dotsHit: number): PlayerProfile {
  const afterGame = recordGameResult(profile, "reaction", score);
  return { ...afterGame, reactionDotsHit: profile.reactionDotsHit + dotsHit };
}

/** Records a Brain Blitz Trivia result: updates games.trivia stats plus cumulative question/correct tallies. */
export function recordTriviaResult(
  profile: PlayerProfile,
  score: number,
  correctCount: number,
  totalAnswered: number,
): PlayerProfile {
  const afterGame = recordGameResult(profile, "trivia", score);
  return {
    ...afterGame,
    triviaQuestionsAnswered: profile.triviaQuestionsAnswered + totalAnswered,
    triviaCorrectAnswers: profile.triviaCorrectAnswers + correctCount,
  };
}

/** Overall trivia accuracy percentage across every game ever played. Zero with no questions answered. */
export function triviaAccuracy(profile: PlayerProfile): number {
  if (profile.triviaQuestionsAnswered === 0) return 0;
  return (profile.triviaCorrectAnswers / profile.triviaQuestionsAnswered) * 100;
}

/** Records a Direction Challenge result: updates games.direction stats plus cumulative question/correct tallies. */
export function recordDirectionResult(
  profile: PlayerProfile,
  score: number,
  correctCount: number,
  totalAnswered: number,
): PlayerProfile {
  const afterGame = recordGameResult(profile, "direction", score);
  return {
    ...afterGame,
    directionQuestionsAnswered: profile.directionQuestionsAnswered + totalAnswered,
    directionCorrectAnswers: profile.directionCorrectAnswers + correctCount,
  };
}

/** Overall Direction Challenge accuracy percentage across every game ever played. Zero with no questions answered. */
export function directionAccuracy(profile: PlayerProfile): number {
  if (profile.directionQuestionsAnswered === 0) return 0;
  return (profile.directionCorrectAnswers / profile.directionQuestionsAnswered) * 100;
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

function normalizeRatedPatterns(stats: Partial<RatedPatternStats> | undefined): RatedPatternStats {
  if (!stats) return emptyRatedPatternStats();
  return { ...emptyRatedPatternStats(), ...stats, ratingHistory: stats.ratingHistory ?? [] };
}

function normalizeStreak(s: Partial<StreakData> | undefined): StreakData {
  if (!s) return emptyStreak();
  return { ...emptyStreak(), ...s };
}

export function normalizeProfile(profile: Partial<PlayerProfile>): PlayerProfile {
  // Ensure every game key exists so recordGameResult never crashes on missing keys
  const games = {} as Record<GameId, GameStats>;
  for (const id of GAME_IDS) {
    const g = (profile.games as Record<string, GameStats> | undefined)?.[id];
    games[id] = g ?? emptyGameStats();
  }
  return {
    ...profile,
    passwordHash: profile.passwordHash ?? "",
    passwordSalt: profile.passwordSalt ?? "",
    games,
    combinedBestScore: profile.combinedBestScore ?? 0,
    combinedTotalScore: profile.combinedTotalScore ?? 0,
    challengeRunsCompleted: profile.challengeRunsCompleted ?? 0,
    totalGamesPlayed: profile.totalGamesPlayed ?? 0,
    overallBestScore: profile.overallBestScore ?? 0,
    overallTotalScore: profile.overallTotalScore ?? 0,
    ratedPuzzles: normalizeRatedPuzzles(profile.ratedPuzzles),
    ratedPatterns: normalizeRatedPatterns(profile.ratedPatterns),
    streak: normalizeStreak(profile.streak),
    achievements: profile.achievements ?? [],
    dailyChallenges: profile.dailyChallenges ?? [],
    avatar: profile.avatar ?? "🧠",
    avatarConfig: sanitizeAvatarConfig(profile.avatarConfig),
    level: profile.level ?? 1,
    reactionDotsHit: profile.reactionDotsHit ?? 0,
    triviaQuestionsAnswered: profile.triviaQuestionsAnswered ?? 0,
    triviaCorrectAnswers: profile.triviaCorrectAnswers ?? 0,
    directionQuestionsAnswered: profile.directionQuestionsAnswered ?? 0,
    directionCorrectAnswers: profile.directionCorrectAnswers ?? 0,
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
