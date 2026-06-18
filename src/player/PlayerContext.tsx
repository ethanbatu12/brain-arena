import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { generateSalt, hashPassword, verifyPassword } from "./crypto";
import type { AchievementRecord, GameId, PlayerProfile } from "./types";
import {
  clearCurrentUsername,
  createProfile,
  loadCurrentUsername,
  loadProfiles,
  recordCombinedResult as recordCombinedResultInStorage,
  recordGameResult,
  recordRatedPatternRun as recordRatedPatternRunInStorage,
  recordRatedPuzzleResult,
  saveCurrentUsername,
  saveProfile,
  validatePassword,
  validateUsername,
} from "./storage";
import { applyAchievements, checkAchievements } from "./achievements";
import { getDailyGameId, recordDailyChallengeResult } from "./dailyChallenge";
import { getToday, updateStreak } from "./streak";
import { pushToGlobalLeaderboard } from "../leaderboard/globalLeaderboard";

/** Apply streak update + achievement check to an already-updated profile. */
function applyPostGameEffects(profile: PlayerProfile): {
  updated: PlayerProfile;
  newAchievements: AchievementRecord[];
} {
  const today = getToday();
  const withStreak: PlayerProfile = { ...profile, streak: updateStreak(profile.streak, today) };
  const newIds = checkAchievements(withStreak);
  const updated = applyAchievements(withStreak, newIds);
  const newAchievements = updated.achievements.filter((a) => newIds.includes(a.id));
  return { updated, newAchievements };
}

interface PlayerContextValue {
  profile: PlayerProfile | null;
  loading: boolean;
  allProfiles: PlayerProfile[];
  pendingAchievements: AchievementRecord[];
  dismissPendingAchievements: () => void;
  createAccount: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signIn: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  recordResult: (gameId: GameId, score: number) => void;
  recordCombinedResult: (score: number) => void;
  recordRatedPuzzle: (correct: boolean, elapsedMs: number, puzzleId?: number) => void;
  recordRatedPatternRun: (solved: number, attempted: number, ratingDelta: number) => void;
  setAvatar: (avatar: string) => void;
  existingUsernames: string[];
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Record<string, PlayerProfile>>({});
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAchievements, setPendingAchievements] = useState<AchievementRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedProfiles, loadedUsername] = await Promise.all([loadProfiles(), loadCurrentUsername()]);
      if (cancelled) return;
      setProfiles(loadedProfiles);
      setCurrentUsername(loadedUsername);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissPendingAchievements = useCallback(() => setPendingAchievements([]), []);

  const createAccount = useCallback(
    async (rawUsername: string, rawPassword: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      const usernameResult = validateUsername(rawUsername);
      if (!usernameResult.ok) return usernameResult;

      const passwordResult = validatePassword(rawPassword);
      if (!passwordResult.ok) return passwordResult;

      const { username } = usernameResult;
      const { password } = passwordResult;

      if (profiles[username]) {
        return { ok: false, error: "Username already taken." };
      }

      const salt = generateSalt();
      const hash = await hashPassword(password, salt);
      const profile = createProfile(username, hash, salt);

      await saveProfile(profile);
      await saveCurrentUsername(username);
      setProfiles((prev) => ({ ...prev, [username]: profile }));
      setCurrentUsername(username);
      return { ok: true };
    },
    [profiles],
  );

  const signIn = useCallback(
    async (rawUsername: string, rawPassword: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      const usernameResult = validateUsername(rawUsername);
      if (!usernameResult.ok) return { ok: false, error: "Invalid username or password." };

      const { username } = usernameResult;
      const profile = profiles[username];
      if (!profile || !(await verifyPassword(rawPassword, profile.passwordSalt, profile.passwordHash))) {
        return { ok: false, error: "Invalid username or password." };
      }

      await saveCurrentUsername(username);
      setCurrentUsername(username);
      return { ok: true };
    },
    [profiles],
  );

  const signOut = useCallback(() => {
    setCurrentUsername(null);
    void clearCurrentUsername();
  }, []);

  const recordResult = useCallback(
    (gameId: GameId, score: number) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        let updated = recordGameResult(current, gameId, score);
        // Auto-record daily challenge if today's game matches
        const today = getToday();
        if (getDailyGameId(today) === gameId) {
          updated = recordDailyChallengeResult(updated, today, gameId, score);
        }
        const { updated: final, newAchievements } = applyPostGameEffects(updated);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(final);
        void pushToGlobalLeaderboard(final);
        return { ...prev, [currentUsername]: final };
      });
    },
    [currentUsername],
  );

  const recordCombinedResult = useCallback(
    (score: number) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const afterResult = recordCombinedResultInStorage(current, score);
        const { updated, newAchievements } = applyPostGameEffects(afterResult);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(updated);
        void pushToGlobalLeaderboard(updated);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const recordRatedPuzzle = useCallback(
    (correct: boolean, elapsedMs: number, puzzleId?: number) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const afterResult = recordRatedPuzzleResult(current, correct, elapsedMs, puzzleId);
        const { updated, newAchievements } = applyPostGameEffects(afterResult);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(updated);
        void pushToGlobalLeaderboard(updated);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const recordRatedPatternRun = useCallback(
    (solved: number, attempted: number, ratingDelta: number) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const afterResult = recordRatedPatternRunInStorage(current, solved, attempted, ratingDelta);
        const { updated, newAchievements } = applyPostGameEffects(afterResult);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(updated);
        void pushToGlobalLeaderboard(updated);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const setAvatar = useCallback(
    (avatar: string) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const updated = { ...current, avatar };
        void saveProfile(updated);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const profile = currentUsername ? profiles[currentUsername] ?? null : null;
  const allProfiles = useMemo(() => Object.values(profiles), [profiles]);
  const existingUsernames = useMemo(() => Object.keys(profiles), [profiles]);

  const value: PlayerContextValue = {
    profile,
    loading,
    allProfiles,
    pendingAchievements,
    dismissPendingAchievements,
    createAccount,
    signIn,
    signOut,
    recordResult,
    recordCombinedResult,
    recordRatedPuzzle,
    recordRatedPatternRun,
    setAvatar,
    existingUsernames,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayerProfile(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayerProfile must be used within a PlayerProvider");
  return ctx;
}
