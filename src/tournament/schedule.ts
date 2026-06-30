import { mulberry32 } from "../game/rng";
import type { GameId } from "../player/types";
import { TOURNAMENT_GAME_POOL, type TournamentWeek } from "./types";

const DAY_MS = 86_400_000;

/** Parses a "YYYY-MM-DD" string as a UTC-midnight epoch ms timestamp. */
function dateToUtcMs(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMsToDateStr(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The Monday (UTC) of the week containing `nowMs`, as a "YYYY-MM-DD" string. */
export function weekStartFor(nowMs: number): string {
  const d = new Date(nowMs);
  const dow = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const daysSinceMonday = (dow + 6) % 7;
  const mondayMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - daysSinceMonday * DAY_MS;
  return utcMsToDateStr(mondayMs);
}

/** The Sunday (UTC) that ends the week starting on `weekStart`. */
export function weekEndFor(weekStart: string): string {
  return utcMsToDateStr(dateToUtcMs(weekStart) + 6 * DAY_MS);
}

/** Epoch ms of the exact moment a tournament starting on `weekStart` ends (Sunday 23:59:59.999 UTC). */
export function weekEndTimestamp(weekStart: string): number {
  return dateToUtcMs(weekStart) + 7 * DAY_MS - 1;
}

/** Epoch ms of the start of the week after `weekStart`. */
export function nextWeekStartTimestamp(weekStart: string): number {
  return dateToUtcMs(weekStart) + 7 * DAY_MS;
}

/** The Monday (UTC) of the week immediately before `weekStart`. */
export function previousWeekStart(weekStart: string): string {
  return utcMsToDateStr(dateToUtcMs(weekStart) - 7 * DAY_MS);
}

/** The Monday (UTC) of the week immediately after `weekStart`. */
export function nextWeekStart(weekStart: string): string {
  return utcMsToDateStr(nextWeekStartTimestamp(weekStart));
}

/** The Monday (UTC) `n` weeks before `weekStart`. */
export function weeksBefore(weekStart: string, n: number): string {
  return utcMsToDateStr(dateToUtcMs(weekStart) - n * 7 * DAY_MS);
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h || 1;
}

/** Deterministically picks this week's featured game — every client agrees without a backend. */
export function featuredGameForWeek(weekStart: string): GameId {
  const rng = mulberry32(seedFromString(`tournament:${weekStart}`));
  return TOURNAMENT_GAME_POOL[Math.floor(rng() * TOURNAMENT_GAME_POOL.length)];
}

/** The currently-active tournament week, given the current time. */
export function currentTournamentWeek(nowMs: number = Date.now()): TournamentWeek {
  const weekStart = weekStartFor(nowMs);
  return { weekStart, weekEnd: weekEndFor(weekStart), gameId: featuredGameForWeek(weekStart) };
}

export function msUntilTournamentEnd(weekStart: string, nowMs: number = Date.now()): number {
  return Math.max(0, weekEndTimestamp(weekStart) - nowMs);
}

export function msUntilNextTournament(weekStart: string, nowMs: number = Date.now()): number {
  return Math.max(0, nextWeekStartTimestamp(weekStart) - nowMs);
}

/** Formats a millisecond duration as "Xd Yh Zm" (or "Yh Zm" / "Zm Ws" once under a day/hour). */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
