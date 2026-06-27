import { THEMES } from "./themes";

const DAY_MS = 86_400_000;
export const SEASON_LENGTH_DAYS = 28; // 4 weeks
export const SEASON_LENGTH_MS = SEASON_LENGTH_DAYS * DAY_MS;

/** Epoch ms of season #0's start (an arbitrary fixed UTC anchor every client agrees on). */
export const SEASON_EPOCH_MS = Date.UTC(2026, 0, 5); // Monday, 2026-01-05

/** Which season number is active at `nowMs` — 0-indexed, increasing forever. */
export function seasonIndexFor(nowMs: number): number {
  return Math.floor((nowMs - SEASON_EPOCH_MS) / SEASON_LENGTH_MS);
}

/** Epoch ms when `seasonIndex` begins. */
export function seasonStartMs(seasonIndex: number): number {
  return SEASON_EPOCH_MS + seasonIndex * SEASON_LENGTH_MS;
}

/** Epoch ms when `seasonIndex` ends (exclusive — the next season's start). */
export function seasonEndMs(seasonIndex: number): number {
  return seasonStartMs(seasonIndex + 1);
}

/** The theme assigned to a season — cycles through the theme catalog in order, repeating forever. */
export function themeForSeason(seasonIndex: number): (typeof THEMES)[number] {
  const wrapped = ((seasonIndex % THEMES.length) + THEMES.length) % THEMES.length;
  return THEMES[wrapped];
}

export function daysRemainingInSeason(seasonIndex: number, nowMs: number): number {
  const msLeft = Math.max(0, seasonEndMs(seasonIndex) - nowMs);
  return Math.ceil(msLeft / DAY_MS);
}
