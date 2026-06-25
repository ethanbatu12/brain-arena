import type { GameId } from "../player/types";
import type { TournamentEntryRow, TournamentHistoryEntry } from "./types";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "")
  ?? "https://ftctcjjvjlnpgxqxdqvt.supabase.co";
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Y3Rjamp2amxucGd4cXhkcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTMxMDcsImV4cCI6MjA5NzQyOTEwN30.rDHK8B9DMJQ8jeqRNy3PH7PccXNzGejJeATQYY_jL_U";

const SCORES_TABLE = "tournament_scores";
const HISTORY_TABLE = "tournament_history";

export function isTournamentSyncEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

interface ScoreRow {
  week_start: string;
  username: string;
  game_id: string;
  score: number;
  level: number;
}

interface HistoryRow {
  week_start: string;
  week_end: string;
  game_id: string;
  first_username: string | null;
  first_score: number | null;
  second_username: string | null;
  second_score: number | null;
  third_username: string | null;
  third_score: number | null;
  finalized_at: string;
}

function historyRowToEntry(row: HistoryRow): TournamentHistoryEntry {
  return {
    weekStart: row.week_start,
    weekEnd: row.week_end,
    gameId: row.game_id as GameId,
    first: row.first_username ? { username: row.first_username, score: row.first_score ?? 0 } : null,
    second: row.second_username ? { username: row.second_username, score: row.second_score ?? 0 } : null,
    third: row.third_username ? { username: row.third_username, score: row.third_score ?? 0 } : null,
    finalizedAt: row.finalized_at,
  };
}

/** Submits (upserts) this player's score for the given tournament week, keeping only their best. */
export async function submitTournamentScore(
  weekStart: string,
  username: string,
  gameId: GameId,
  score: number,
  level: number,
): Promise<void> {
  if (!isTournamentSyncEnabled()) return;
  try {
    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/${SCORES_TABLE}?week_start=eq.${weekStart}&username=eq.${encodeURIComponent(username)}&select=score`,
      { headers: headers() },
    );
    if (existing.ok) {
      const rows = (await existing.json()) as { score: number }[];
      if (rows[0] && rows[0].score >= score) return; // only the player's highest score counts
    }
    const body = JSON.stringify({ week_start: weekStart, username, game_id: gameId, score, level });
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${SCORES_TABLE}`, {
      method: "POST",
      headers: { ...headers(), Prefer: "resolution=merge-duplicates" },
      body,
    });
    if (!res.ok) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/${SCORES_TABLE}?week_start=eq.${weekStart}&username=eq.${encodeURIComponent(username)}`,
        { method: "PATCH", headers: headers(), body },
      );
    }
  } catch {
    // best-effort
  }
}

/** Fetches the live leaderboard for a tournament week, highest score first. */
export async function fetchTournamentLeaderboard(weekStart: string): Promise<TournamentEntryRow[]> {
  if (!isTournamentSyncEnabled()) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${SCORES_TABLE}?week_start=eq.${weekStart}&select=username,score,level&order=score.desc&limit=200`,
      { headers: headers() },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as ScoreRow[];
    return rows.map((r) => ({ username: r.username, score: r.score, level: r.level }));
  } catch {
    return [];
  }
}

/** Fetches the most recently finalized tournament week, if any. */
export async function fetchLatestTournamentHistory(): Promise<TournamentHistoryEntry | null> {
  if (!isTournamentSyncEnabled()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${HISTORY_TABLE}?select=*&order=week_start.desc&limit=1`,
      { headers: headers() },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as HistoryRow[];
    return rows[0] ? historyRowToEntry(rows[0]) : null;
  } catch {
    return null;
  }
}

/** Fetches every finalized tournament a username placed top-3 in (used for claiming rewards). */
export async function fetchTournamentHistoryForUsername(username: string): Promise<TournamentHistoryEntry[]> {
  if (!isTournamentSyncEnabled()) return [];
  try {
    const enc = encodeURIComponent(username);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${HISTORY_TABLE}?select=*&or=(first_username.eq.${enc},second_username.eq.${enc},third_username.eq.${enc})&order=week_start.asc`,
      { headers: headers() },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as HistoryRow[];
    return rows.map(historyRowToEntry);
  } catch {
    return [];
  }
}

/** Fetches the full tournament history (most recent first), for the History page. */
export async function fetchAllTournamentHistory(): Promise<TournamentHistoryEntry[]> {
  if (!isTournamentSyncEnabled()) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${HISTORY_TABLE}?select=*&order=week_start.desc&limit=100`,
      { headers: headers() },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as HistoryRow[];
    return rows.map(historyRowToEntry);
  } catch {
    return [];
  }
}

/**
 * Writes the finalized top-3 for a tournament week, if not already present.
 * Idempotent via the week_start primary key (merge-duplicates upsert) — safe
 * to call from any client that happens to notice a week has just ended.
 */
export async function finalizeTournamentWeek(entry: TournamentHistoryEntry): Promise<void> {
  if (!isTournamentSyncEnabled()) return;
  const body = JSON.stringify({
    week_start: entry.weekStart,
    week_end: entry.weekEnd,
    game_id: entry.gameId,
    first_username: entry.first?.username ?? null,
    first_score: entry.first?.score ?? null,
    second_username: entry.second?.username ?? null,
    second_score: entry.second?.score ?? null,
    third_username: entry.third?.username ?? null,
    third_score: entry.third?.score ?? null,
    finalized_at: entry.finalizedAt,
  });
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${HISTORY_TABLE}`, {
      method: "POST",
      headers: { ...headers(), Prefer: "resolution=ignore-duplicates" },
      body,
    });
  } catch {
    // best-effort
  }
}
