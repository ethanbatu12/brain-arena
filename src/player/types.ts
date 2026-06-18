export type GameId = "memory" | "math" | "logic" | "balloon" | "pattern";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null; // "YYYY-MM-DD"
}

export type AchievementId =
  | "first-game"
  | "games-10"
  | "games-50"
  | "games-100"
  | "high-score-500"
  | "high-score-1000"
  | "challenge-first"
  | "challenge-5"
  | "streak-3"
  | "streak-7"
  | "streak-30"
  | "chess-rating-1200"
  | "chess-rating-1500"
  | "pattern-rating-1200"
  | "pattern-rating-1500";

export interface AchievementRecord {
  id: AchievementId;
  unlockedAt: string; // ISO timestamp
}

export interface DailyChallengeRecord {
  date: string;    // "YYYY-MM-DD"
  gameId: GameId;
  score: number;
  completed: boolean;
}

export interface RatedPatternStats {
  rating: number;
  highestRating: number;
  /** Number of completed rated runs (each run ends on first wrong answer). */
  gamesPlayed: number;
  /** Total patterns answered correctly across all runs. */
  totalSolved: number;
  /** Total patterns attempted across all runs. */
  totalAttempted: number;
  /** Longest single run (patterns solved before the first wrong answer). */
  longestStreak: number;
  /** Last N final ratings, for history display. */
  ratingHistory: number[];
}

export const GAME_IDS: GameId[] = ["memory", "math", "logic", "balloon", "pattern"];

/** Per-puzzle attempt tally for one user, keyed by puzzle id. */
export interface PuzzleResultStat {
  attempts: number;
  solves: number;
}

export interface RatedPuzzleStats {
  rating: number;
  highestRating: number;
  totalCompleted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSolveTimeMs: number;
  /** Success/failure stats per puzzle id, so progress can be tracked per puzzle per user. */
  puzzleStats: Record<number, PuzzleResultStat>;
}

export interface GameStats {
  bestScore: number;
  gamesPlayed: number;
  /** Sum of every score ever earned in this game. */
  totalScore: number;
}

export interface PlayerProfile {
  username: string;
  /** PBKDF2-SHA256 hash of the account password (see crypto.ts). */
  passwordHash: string;
  /** Per-user random salt used when hashing the password. */
  passwordSalt: string;
  games: Record<GameId, GameStats>;
  totalGamesPlayed: number;
  /** Highest single-round score across any game. */
  overallBestScore: number;
  /** Sum of every score ever earned, across any game. */
  overallTotalScore: number;
  /** Best combined total across all four games in the All Games Challenge. */
  combinedBestScore: number;
  /** Sum of every All Games Challenge combined total ever earned. */
  combinedTotalScore: number;
  /** Number of completed All Games Challenge runs. */
  challengeRunsCompleted: number;
  ratedPuzzles: RatedPuzzleStats;
  ratedPatterns: RatedPatternStats;
  streak: StreakData;
  achievements: AchievementRecord[];
  dailyChallenges: DailyChallengeRecord[];
  /** Emoji avatar selected by the user. */
  avatar: string;
}
