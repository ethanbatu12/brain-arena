import type { StreakData } from "./types";

export function emptyStreak(): StreakData {
  return { currentStreak: 0, longestStreak: 0, lastPlayedDate: null };
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Adds one day to a "YYYY-MM-DD" date string, staying entirely in UTC.
 * `new Date(dateStr)` parses a date-only string as UTC midnight, but
 * `.setDate()`/`.getDate()` operate in the local timezone — mixing the two
 * silently shifts the result by a day for any timezone behind/ahead of UTC.
 * Using Date.UTC for both the parse and the increment avoids that entirely.
 */
function addOneDayUtc(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
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
    newCurrent = addOneDayUtc(prev) === today ? streak.currentStreak + 1 : 1;
  }

  return {
    currentStreak: newCurrent,
    longestStreak: Math.max(streak.longestStreak, newCurrent),
    lastPlayedDate: today,
  };
}
