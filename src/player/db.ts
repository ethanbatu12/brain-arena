import { openDB, type IDBPDatabase } from "idb";
import type { PlayerProfile } from "./types";

const DB_NAME = "brain-arena";
const DB_VERSION = 1;
const PROFILES_STORE = "profiles";
const SESSION_STORE = "session";
const SESSION_KEY = "current";

/**
 * Storage seam: a future online/leaderboard-sync backend can implement this
 * same interface without any changes to storage.ts or PlayerContext.
 */
export interface ProfileStore {
  getAllProfiles(): Promise<Record<string, PlayerProfile>>;
  getProfile(username: string): Promise<PlayerProfile | undefined>;
  putProfile(profile: PlayerProfile): Promise<void>;
  getCurrentUsername(): Promise<string | null>;
  setCurrentUsername(username: string): Promise<void>;
  clearCurrentUsername(): Promise<void>;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROFILES_STORE)) {
          db.createObjectStore(PROFILES_STORE, { keyPath: "username" });
        }
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          db.createObjectStore(SESSION_STORE);
        }
      },
    });
  }
  return dbPromise;
}

/** Test-only helper: clears all stored profiles and session data. */
export async function clearAllForTests(): Promise<void> {
  const db = await getDb();
  await db.clear(PROFILES_STORE);
  await db.clear(SESSION_STORE);
}

export const indexedDbProfileStore: ProfileStore = {
  async getAllProfiles() {
    const db = await getDb();
    const all = await db.getAll(PROFILES_STORE);
    const profiles: Record<string, PlayerProfile> = {};
    for (const profile of all as PlayerProfile[]) {
      profiles[profile.username] = profile;
    }
    return profiles;
  },

  async getProfile(username) {
    const db = await getDb();
    return db.get(PROFILES_STORE, username);
  },

  async putProfile(profile) {
    const db = await getDb();
    await db.put(PROFILES_STORE, profile);
  },

  async getCurrentUsername() {
    const db = await getDb();
    const value = await db.get(SESSION_STORE, SESSION_KEY);
    return value ?? null;
  },

  async setCurrentUsername(username) {
    const db = await getDb();
    await db.put(SESSION_STORE, username, SESSION_KEY);
  },

  async clearCurrentUsername() {
    const db = await getDb();
    await db.delete(SESSION_STORE, SESSION_KEY);
  },
};
