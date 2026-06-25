import type { GameId } from "../player/types";

/** Games eligible to be a week's featured tournament game. */
export const TOURNAMENT_GAME_POOL: GameId[] = [
  "memory",
  "math",
  "logic",
  "balloon",
  "pattern",
  "reaction",
  "trivia",
  "direction",
];

export interface TournamentWeek {
  /** "YYYY-MM-DD" — the Monday this tournament's week starts, UTC. */
  weekStart: string;
  /** "YYYY-MM-DD" — the Sunday this tournament's week ends, UTC. */
  weekEnd: string;
  gameId: GameId;
}

export interface TournamentEntryRow {
  username: string;
  score: number;
  level: number;
}

export interface TournamentHistoryEntry {
  weekStart: string;
  weekEnd: string;
  gameId: GameId;
  first: { username: string; score: number } | null;
  second: { username: string; score: number } | null;
  third: { username: string; score: number } | null;
  finalizedAt: string;
}

export type WeeklyBadgeType = "champion" | "finalist";

export interface WeeklyBadge {
  type: WeeklyBadgeType;
  weekStart: string;
  /** ISO timestamp — badge stops showing after this. */
  expiresAt: string;
}

export interface TournamentStats {
  weeklyWins: number;
  top3Finishes: number;
  /** Best (lowest) rank ever achieved; null if never placed top 3. */
  bestRank: number | null;
  totalTournamentXp: number;
}

export function emptyTournamentStats(): TournamentStats {
  return { weeklyWins: 0, top3Finishes: 0, bestRank: null, totalTournamentXp: 0 };
}
