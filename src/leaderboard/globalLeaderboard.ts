import type { PlayerProfile } from "../player/types";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "")
  ?? "https://ftctcjjvjlnpgxqxdqvt.supabase.co";
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Y3Rjamp2amxucGd4cXhkcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTMxMDcsImV4cCI6MjA5NzQyOTEwN30.rDHK8B9DMJQ8jeqRNy3PH7PccXNzGejJeATQYY_jL_U";
const TABLE = "leaderboard_entries";

export function isGlobalLeaderboardEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function supabaseHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY!,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

/** Stable anonymous device identifier stored in localStorage. */
function getDeviceId(): string {
  const KEY = "brain-arena-device-id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export interface GlobalEntry {
  username: string;
  avatar: string;
  combined_best_score: number;
  total_games_played: number;
  longest_streak: number;
  pattern_rating: number;
  chess_rating: number;
  chess_peak_rating: number;
  memory_best: number;
  math_best: number;
  logic_best: number;
  balloon_best: number;
  pattern_best: number;
  challenge_runs: number;
  updated_at: string;
}

function profileToEntry(profile: PlayerProfile): Record<string, unknown> {
  return {
    device_id: getDeviceId(),
    username: profile.username,
    avatar: profile.avatar ?? "🧠",
    combined_best_score: profile.combinedBestScore,
    total_games_played: profile.totalGamesPlayed,
    longest_streak: profile.streak.longestStreak,
    pattern_rating: profile.ratedPatterns.rating,
    chess_rating: profile.ratedPuzzles.rating,
    chess_peak_rating: profile.ratedPuzzles.highestRating,
    memory_best: profile.games.memory.bestScore,
    math_best: profile.games.math.bestScore,
    logic_best: profile.games.logic.bestScore,
    balloon_best: profile.games.balloon.bestScore,
    pattern_best: profile.games.pattern.bestScore,
    challenge_runs: profile.challengeRunsCompleted,
    updated_at: new Date().toISOString(),
  };
}

/** Push the current player's stats to the global leaderboard (upsert by device_id + username). */
export async function pushToGlobalLeaderboard(profile: PlayerProfile): Promise<void> {
  if (!isGlobalLeaderboardEnabled()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(profileToEntry(profile)),
    });
  } catch {
    // best-effort; never throw
  }
}

/** Fetch global leaderboard entries sorted by combined_best_score descending, deduplicated by username. */
export async function fetchGlobalLeaderboard(): Promise<GlobalEntry[]> {
  if (!isGlobalLeaderboardEnabled()) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=combined_best_score.desc&limit=500`,
      { headers: supabaseHeaders() },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as GlobalEntry[];
    // Fetch banned usernames
    let banned = new Set<string>();
    try {
      const banRes = await fetch(`${SUPABASE_URL}/rest/v1/banned_users?select=username`, { headers: supabaseHeaders() });
      if (banRes.ok) {
        const banRows = await banRes.json() as { username: string }[];
        banned = new Set(banRows.map((r) => r.username));
      }
    } catch { /* ignore */ }
    // Deduplicate by username — keep the row with the highest combined_best_score
    const seen = new Map<string, GlobalEntry>();
    for (const row of rows) {
      if (banned.has(row.username)) continue;
      const existing = seen.get(row.username);
      if (!existing || row.combined_best_score > existing.combined_best_score) {
        seen.set(row.username, row);
      }
    }
    return Array.from(seen.values()).sort((a, b) => b.combined_best_score - a.combined_best_score).slice(0, 100);
  } catch {
    return [];
  }
}
