import type { AvatarConfig } from "../avatar/types";
import type { BorderId } from "./borders";
import type { ChallengeStreakData, TripleChallengeState } from "./tripleChallenges";
import type { TournamentStats, WeeklyBadge } from "../tournament/types";

export type GameId = "memory" | "math" | "logic" | "balloon" | "pattern" | "reaction" | "trivia" | "direction";

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
  | "games-250"
  | "games-500"
  | "high-score-500"
  | "high-score-1000"
  | "high-score-2500"
  | "high-score-5000"
  | "challenge-first"
  | "challenge-5"
  | "challenge-25"
  | "streak-3"
  | "streak-7"
  | "streak-30"
  | "streak-100"
  | "chess-rating-1200"
  | "chess-rating-1500"
  | "chess-rating-1800"
  | "chess-rating-2000"
  | "pattern-rating-1200"
  | "pattern-rating-1500"
  | "pattern-rating-1800"
  | "memory-best-500"
  | "memory-best-1000"
  | "math-best-500"
  | "math-best-1000"
  | "logic-best-500"
  | "logic-best-1000"
  | "balloon-best-500"
  | "all-games-played"
  | "daily-first"
  | "daily-7"
  | "reaction-first"
  | "reaction-best-500"
  | "reaction-best-1000"
  | "reaction-dots-100"
  | "reaction-dots-500"
  | "reaction-dots-1000"
  | "trivia-first"
  | "trivia-best-500"
  | "trivia-best-1000"
  | "trivia-expert"
  | "trivia-questions-100"
  | "trivia-questions-500"
  | "trivia-questions-1000"
  | "trivia-accuracy-90"
  | "challenge-streak-3"
  | "challenge-streak-7"
  | "challenge-streak-30"
  | "challenge-streak-100";

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

export const GAME_IDS: GameId[] = ["memory", "math", "logic", "balloon", "pattern", "reaction", "trivia", "direction"];

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
  /** Emoji avatar selected by the user — legacy fallback for accounts created before the SVG avatar system. */
  avatar: string;
  /** Fully customizable SVG avatar — the player's primary visual identity. */
  avatarConfig: AvatarConfig;
  /** Player level, derived from xp; used by the avatar/border/title unlock frameworks. */
  level: number;
  /** Total lifetime XP earned across the platform. */
  xp: number;
  /** XP earned on the current UTC day; resets to a fresh amount once the date rolls over. */
  xpEarnedToday: { date: string; amount: number };
  /** XP earned during the current tournament week (Monday-Sunday UTC); resets each new week. */
  xpEarnedThisWeek: { weekStart: string; amount: number };
  /** The title currently displayed on the profile (must be one the player has unlocked). */
  selectedTitle: string;
  /** The profile border currently displayed (must be one the player has unlocked). */
  profileBorder: BorderId;
  /** Today's set of 3 daily challenges and progress toward each. */
  tripleChallenges: TripleChallengeState;
  /** Streak of consecutive days completing all 3 daily challenges. */
  challengeStreak: ChallengeStreakData;
  /** Cumulative blue dots successfully tapped across every Reaction Grid game. */
  reactionDotsHit: number;
  /** Cumulative trivia questions answered (correct + incorrect) across every Brain Blitz game. */
  triviaQuestionsAnswered: number;
  /** Cumulative correct trivia answers across every Brain Blitz game. */
  triviaCorrectAnswers: number;
  /** Cumulative Direction Challenge questions answered (correct + incorrect). */
  directionQuestionsAnswered: number;
  /** Cumulative correct Direction Challenge answers. */
  directionCorrectAnswers: number;
  /** Avatar option values (clothing/accessory) earned exclusively via Weekly Tournament top-3 finishes. */
  exclusiveCosmetics: string[];
  /** Lifetime Weekly Tournament record. */
  tournamentStats: TournamentStats;
  /** Temporary Champion/Finalist badge from the most recent top-3 finish, shown for one week. */
  weeklyBadge: WeeklyBadge | null;
  /** Tournament week-start dates whose rewards have already been granted, so claiming is idempotent. */
  claimedTournamentWeeks: string[];
  /** In-game currency, currently spendable only on pets. */
  coins: number;
  /** The highest level the per-level coin reward has already been paid out for — prevents double-granting. */
  coinsGrantedForLevel: number;
  /** Pet catalog ids the player has purchased. */
  ownedPets: string[];
  /** The pet currently shown following the avatar, or null for none. */
  equippedPet: string | null;
}
