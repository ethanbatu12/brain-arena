/**
 * Supabase-backed account sync so players can sign in from any device.
 * Uses the same credentials as globalLeaderboard.ts.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "")
  ?? "https://ftctcjjvjlnpgxqxdqvt.supabase.co";
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Y3Rjamp2amxucGd4cXhkcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTMxMDcsImV4cCI6MjA5NzQyOTEwN30.rDHK8B9DMJQ8jeqRNy3PH7PccXNzGejJeATQYY_jL_U";

const TABLE = "user_profiles";

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

export interface CloudProfile {
  username: string;
  password_hash: string;
  password_salt: string;
  profile_data: Record<string, unknown>;
}

/** Fetch a profile by username from Supabase. Returns null if not found. */
export async function fetchCloudProfile(username: string): Promise<CloudProfile | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?username=eq.${encodeURIComponent(username)}&select=*&limit=1`,
      { headers: headers() },
    );
    if (!res.ok) return null;
    const rows = await res.json() as CloudProfile[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Save (upsert) a profile to Supabase. */
export async function pushCloudProfile(
  username: string,
  passwordHash: string,
  passwordSalt: string,
  profileData: Record<string, unknown>,
): Promise<void> {
  if (!passwordHash || !passwordSalt) return;
  const body = JSON.stringify({
    username,
    password_hash: passwordHash,
    password_salt: passwordSalt,
    profile_data: profileData,
    updated_at: new Date().toISOString(),
  });
  try {
    // Try insert first
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...headers(), Prefer: "resolution=merge-duplicates" },
      body,
    });
    // If insert failed (e.g. conflict not resolved), force update by username
    if (!insertRes.ok) {
      await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?username=eq.${encodeURIComponent(username)}`, {
        method: "PATCH",
        headers: headers(),
        body,
      });
    }
  } catch {
    // best-effort
  }
}

/** Check if a username is already taken in Supabase. */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const profile = await fetchCloudProfile(username);
  return profile !== null;
}

/**
 * Check if a username is banned. Fails closed: if the ban check itself
 * can't be confirmed (network error, RLS misconfiguration, etc.) this
 * returns true so a broken check can never silently let a banned user in.
 */
export async function isUserBanned(username: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/banned_users?username=eq.${encodeURIComponent(username)}&select=username&limit=1`,
      { headers: headers() },
    );
    if (!res.ok) return true;
    const rows = await res.json() as unknown[];
    return rows.length > 0;
  } catch {
    return true;
  }
}

/** Get total number of registered players. */
export async function getTotalPlayers(): Promise<number> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=username`,
      { headers: { ...headers(), Prefer: "count=exact" } },
    );
    const count = res.headers.get("content-range");
    if (count) {
      const total = count.split("/")[1];
      if (total && total !== "*") return parseInt(total, 10);
    }
    const rows = await res.json() as unknown[];
    return rows.length;
  } catch {
    return 0;
  }
}
