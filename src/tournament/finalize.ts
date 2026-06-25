import { fetchLatestTournamentHistory, fetchTournamentLeaderboard, finalizeTournamentWeek } from "./cloudSync";
import { currentTournamentWeek, featuredGameForWeek, previousWeekStart, weekEndFor } from "./schedule";
import type { TournamentHistoryEntry } from "./types";

/**
 * If the tournament week before the current one has ended but never been
 * written to history, computes its top 3 from the live scores and writes
 * it. Safe to call from any client at any time — idempotent via the
 * week_start primary key, so whichever client happens to notice first just
 * does the work once.
 */
export async function ensureTournamentFinalized(nowMs: number = Date.now()): Promise<void> {
  const completedWeekStart = previousWeekStart(currentTournamentWeek(nowMs).weekStart);

  const latest = await fetchLatestTournamentHistory();
  if (latest && latest.weekStart >= completedWeekStart) return; // already finalized (or newer)

  const rows = await fetchTournamentLeaderboard(completedWeekStart);
  if (rows.length === 0) return; // nobody played that week — nothing to finalize

  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const entry: TournamentHistoryEntry = {
    weekStart: completedWeekStart,
    weekEnd: weekEndFor(completedWeekStart),
    gameId: featuredGameForWeek(completedWeekStart),
    first: sorted[0] ? { username: sorted[0].username, score: sorted[0].score } : null,
    second: sorted[1] ? { username: sorted[1].username, score: sorted[1].score } : null,
    third: sorted[2] ? { username: sorted[2].username, score: sorted[2].score } : null,
    finalizedAt: new Date(nowMs).toISOString(),
  };
  await finalizeTournamentWeek(entry);
}
