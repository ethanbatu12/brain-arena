export type GameId = "memory" | "math" | "logic" | "balloon";

export const GAME_IDS: GameId[] = ["memory", "math", "logic", "balloon"];

export interface RatedPuzzleStats {
  rating: number;
  highestRating: number;
  totalCompleted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSolveTimeMs: number;
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
}
