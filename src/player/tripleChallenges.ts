import { mulberry32 } from "../game/rng";
import { XP_AWARDS } from "../xp/levels";
import type { GameId } from "./types";

export type TripleChallengeTemplateId =
  | "score-memory"
  | "score-trivia"
  | "score-pattern"
  | "score-math"
  | "score-balloon"
  | "score-logic"
  | "reaction-play-3"
  | "puzzle-5"
  | "all-games-run"
  | "direction-correct-20";

export interface TripleChallengeTemplate {
  id: TripleChallengeTemplateId;
  description: string;
  target: number;
}

/** The full pool of challenge templates a day's 3 are drawn from. */
export const TRIPLE_CHALLENGE_TEMPLATES: TripleChallengeTemplate[] = [
  { id: "score-memory", description: "Score 1000+ in Memory Matrix", target: 1000 },
  { id: "score-trivia", description: "Score 1200+ in Brain Blitz Trivia", target: 1200 },
  { id: "score-pattern", description: "Score 1000+ in Fill in the Pattern", target: 1000 },
  { id: "score-math", description: "Score 800+ in Mental Math", target: 800 },
  { id: "score-balloon", description: "Score 1000+ in Balloon Order", target: 1000 },
  { id: "score-logic", description: "Score 800+ in Logic Challenge", target: 800 },
  { id: "reaction-play-3", description: "Complete 3 games of Reaction Grid", target: 3 },
  { id: "puzzle-5", description: "Complete 5 Chess Puzzles", target: 5 },
  { id: "all-games-run", description: "Complete an All Games Challenge run", target: 1 },
  { id: "direction-correct-20", description: "Answer 20 questions correctly in Direction Challenge", target: 20 },
];

export interface TripleChallengeItem {
  id: TripleChallengeTemplateId;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  xpAwarded: boolean;
  xpReward: number;
}

export interface TripleChallengeState {
  date: string;
  challenges: TripleChallengeItem[];
}

export interface ChallengeStreakData {
  currentStreak: number;
  longestStreak: number;
  /** The last date on which all 3 challenges were completed. */
  lastCompletedDate: string | null;
  /** Lifetime count of individual challenges completed (not days). */
  totalCompleted: number;
}

export function emptyTripleChallengeState(): TripleChallengeState {
  return { date: "", challenges: [] };
}

export function emptyChallengeStreak(): ChallengeStreakData {
  return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null, totalCompleted: 0 };
}

function seedFromDate(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0;
  return h || 1;
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Deterministically generates 3 unique challenges for the given date. */
export function generateDailyChallenges(date: string): TripleChallengeItem[] {
  const rng = mulberry32(seedFromDate(date));
  const picked = shuffled(TRIPLE_CHALLENGE_TEMPLATES, rng).slice(0, 3);
  return picked.map((t) => ({
    id: t.id,
    description: t.description,
    target: t.target,
    progress: 0,
    completed: false,
    xpAwarded: false,
    xpReward: XP_AWARDS.DAILY_CHALLENGE,
  }));
}

function nextDay(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Ensures the player has a fresh, valid set of challenges for `today`.
 * If the stored set is already for today, returns it unchanged. Otherwise
 * generates a new set and updates the completion streak based on whether
 * yesterday's set (if any) was fully completed.
 */
export function ensureTodaysChallenges(
  state: TripleChallengeState,
  streak: ChallengeStreakData,
  today: string,
): { state: TripleChallengeState; streak: ChallengeStreakData } {
  if (state.date === today) return { state, streak };

  let nextStreak = streak;
  if (state.date) {
    const allCompleted = state.challenges.length > 0 && state.challenges.every((c) => c.completed);
    if (allCompleted) {
      const continuesStreak = streak.lastCompletedDate !== null && nextDay(streak.lastCompletedDate) === state.date;
      const current = continuesStreak ? streak.currentStreak + 1 : 1;
      nextStreak = {
        ...streak,
        currentStreak: current,
        longestStreak: Math.max(streak.longestStreak, current),
        lastCompletedDate: state.date,
      };
    } else {
      nextStreak = { ...streak, currentStreak: 0 };
    }
  }

  return {
    state: { date: today, challenges: generateDailyChallenges(today) },
    streak: nextStreak,
  };
}

export type TripleChallengeEvent =
  | { type: "game"; gameId: GameId; score: number }
  | { type: "puzzle-solved" }
  | { type: "all-games-challenge" }
  | { type: "direction-correct"; count: number };

const GAME_SCORE_TEMPLATE: Partial<Record<GameId, TripleChallengeTemplateId>> = {
  memory: "score-memory",
  trivia: "score-trivia",
  pattern: "score-pattern",
  math: "score-math",
  balloon: "score-balloon",
  logic: "score-logic",
};

function progressDelta(item: TripleChallengeItem, event: TripleChallengeEvent): number | null {
  if (item.completed) return null;
  switch (event.type) {
    case "game": {
      if (item.id === "reaction-play-3" && event.gameId === "reaction") return item.progress + 1;
      const scoreTemplate = GAME_SCORE_TEMPLATE[event.gameId];
      if (scoreTemplate === item.id) return Math.max(item.progress, event.score);
      return null;
    }
    case "puzzle-solved":
      return item.id === "puzzle-5" ? item.progress + 1 : null;
    case "all-games-challenge":
      return item.id === "all-games-run" ? item.progress + 1 : null;
    case "direction-correct":
      return item.id === "direction-correct-20" ? item.progress + event.count : null;
    default:
      return null;
  }
}

/**
 * Applies a gameplay event to today's challenge set, updating progress and
 * marking challenges complete once their target is reached. Returns the
 * updated state plus the total XP newly earned from challenges that just
 * completed (each only ever awards its XP once).
 */
export function applyChallengeEvent(
  state: TripleChallengeState,
  event: TripleChallengeEvent,
): { state: TripleChallengeState; xpGained: number; newlyCompleted: TripleChallengeItem[] } {
  let xpGained = 0;
  const newlyCompleted: TripleChallengeItem[] = [];
  const challenges = state.challenges.map((item) => {
    const delta = progressDelta(item, event);
    if (delta === null) return item;
    const progress = Math.min(delta, item.target);
    const completed = progress >= item.target;
    const xpAwarded = item.xpAwarded || completed;
    if (completed && !item.completed) {
      xpGained += item.xpReward;
      const updated = { ...item, progress, completed, xpAwarded };
      newlyCompleted.push(updated);
      return updated;
    }
    return { ...item, progress, completed, xpAwarded };
  });
  return { state: { ...state, challenges }, xpGained, newlyCompleted };
}
