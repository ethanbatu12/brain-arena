import type { StreakData } from "./types";

export function emptyStreak(): StreakData {
  return { currentStreak: 0, longestStreak: 0, lastPlayedDate: null };
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns updated streak after playing on `today`.
 * Idempotent: calling twice on the same date returns the same streak.
 */
export function updateStreak(streak: StreakData, today: string): StreakData {
  if (streak.lastPlayedDate === today) return streak;

  const prev = streak.lastPlayedDate;
  let newCurrent: number;
  if (prev === null) {
    newCurrent = 1;
  } else {
    const d = new Date(prev);
    d.setDate(d.getDate() + 1);
    const nextDay = d.toISOString().slice(0, 10);
    newCurrent = nextDay === today ? streak.currentStreak + 1 : 1;
  }

  return {
    currentStreak: newCurrent,
    longestStreak: Math.max(streak.longestStreak, newCurrent),
    lastPlayedDate: today,
  };
}
