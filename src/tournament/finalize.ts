import { fetchLatestTournamentHistory, fetchTournamentLeaderboard, finalizeTournamentWeek } from "./cloudSync";
import { currentTournamentWeek, featuredGameForWeek, nextWeekStart, weekEndFor, weeksBefore } from "./schedule";
import type { TournamentHistoryEntry } from "./types";

/** How far back to backfill when nothing has ever been finalized yet — avoids an unbounded scan for a brand-new deployment. */
const MAX_BACKFILL_WEEKS = 26;

async function finalizeWeek(weekStart: string, nowMs: number): Promise<void> {
  const rows = await fetchTournamentLeaderboard(weekStart);
  if (rows.length === 0) return; // nobody played that week — nothing to finalize

  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const entry: TournamentHistoryEntry = {
    weekStart,
    weekEnd: weekEndFor(weekStart),
    gameId: featuredGameForWeek(weekStart),
    first: sorted[0] ? { username: sorted[0].username, score: sorted[0].score } : null,
    second: sorted[1] ? { username: sorted[1].username, score: sorted[1].score } : null,
    third: sorted[2] ? { username: sorted[2].username, score: sorted[2].score } : null,
    finalizedAt: new Date(nowMs).toISOString(),
  };
  await finalizeTournamentWeek(entry);
}

/**
 * Finalizes every completed tournament week that's ended but never been
 * written to history — not just the most recent one. Without this, a week
 * where no client happened to open the app before the *next* week also
 * ended would be silently skipped forever (the old version only ever
 * looked one week back from "now"), permanently losing that week's
 * winners' rewards. Safe to call from any client at any time — idempotent
 * via the week_start primary key, so whichever client notices first just
 * does the work once.
 */
export async function ensureTournamentFinalized(nowMs: number = Date.now()): Promise<void> {
  const currentWeekStart = currentTournamentWeek(nowMs).weekStart;
  const latest = await fetchLatestTournamentHistory();

  let weekStart = latest ? nextWeekStart(latest.weekStart) : weeksBefore(currentWeekStart, MAX_BACKFILL_WEEKS);

  while (weekStart < currentWeekStart) {
    await finalizeWeek(weekStart, nowMs);
    weekStart = nextWeekStart(weekStart);
  }
}
