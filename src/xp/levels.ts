/** XP needed to go from `level` to `level + 1`. */
const XP_STEP = 10;

export function xpForNextLevel(level: number): number {
  return level * XP_STEP;
}

/** Cumulative XP required to reach `level` (i.e. total XP at the moment that level starts). */
export function totalXpForLevel(level: number): number {
  return (XP_STEP * level * (level - 1)) / 2;
}

export interface LevelInfo {
  level: number;
  /** XP accumulated within the current level (toward the next one). */
  xpIntoLevel: number;
  /** XP needed to go from the current level to the next. */
  xpForNextLevel: number;
  totalXp: number;
}

/** Derives level + progress-within-level from a player's total lifetime XP. */
export function levelForTotalXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, totalXp);
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) level++;
  return {
    level,
    xpIntoLevel: xp - totalXpForLevel(level),
    xpForNextLevel: xpForNextLevel(level),
    totalXp: xp,
  };
}

export interface TitleDef {
  level: number;
  title: string;
}

export const TITLES: TitleDef[] = [
  { level: 1, title: "Rookie" },
  { level: 5, title: "Challenger" },
  { level: 10, title: "Competitor" },
  { level: 20, title: "Strategist" },
  { level: 35, title: "Brain Trainer" },
  { level: 50, title: "Master Mind" },
  { level: 75, title: "Grandmaster" },
  { level: 100, title: "Legend" },
];

/**
 * A color pair (for a gradient/text-fill) per title, escalating in
 * prestige the same way profile borders do — Competitor (lvl 10) reads as
 * bronze, Strategist (20) silver, Brain Trainer (35) gold, Master Mind (50)
 * diamond, Grandmaster (75) a master purple, Legend (100) a flashy gold.
 */
const TITLE_COLORS: Record<string, [string, string]> = {
  Rookie: ["#9ca3af", "#6b7280"],
  Challenger: ["#4ade80", "#16a34a"],
  Competitor: ["#cd7f32", "#8a5524"],
  Strategist: ["#d4d4d8", "#9ca3af"],
  "Brain Trainer": ["#fbbf24", "#b45309"],
  "Master Mind": ["#a5f3fc", "#0891b2"],
  Grandmaster: ["#c4b5fd", "#6d28d9"],
  Legend: ["#fde68a", "#dc2626"],
};

/** The [start, end] gradient colors for a title's display — falls back to the Rookie gray for unknown titles. */
export function titleColors(title: string): [string, string] {
  return TITLE_COLORS[title] ?? TITLE_COLORS.Rookie;
}

/** Every title the player has unlocked at this level, in unlock order. */
export function unlockedTitles(level: number): string[] {
  return TITLES.filter((t) => t.level <= level).map((t) => t.title);
}

/** The highest-tier title unlocked at this level (the default display title). */
export function titleForLevel(level: number): string {
  const unlocked = unlockedTitles(level);
  return unlocked[unlocked.length - 1] ?? "Rookie";
}

/** XP awarded for various platform-wide actions. */
export const XP_AWARDS = {
  GAME_COMPLETE: 40,
  SCORE_OVER_1000: 25,
  NEW_PERSONAL_BEST: 50,
  ACHIEVEMENT_UNLOCKED: 100,
  ALL_GAMES_CHALLENGE: 150,
  DAILY_CHALLENGE: 50,
} as const;
