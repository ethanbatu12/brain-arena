import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { generateSalt, hashPassword, verifyPassword } from "./crypto";
import type { AchievementRecord, GameId, PlayerProfile } from "./types";
import type { AvatarConfig } from "../avatar/types";
import {
  clearCurrentUsername,
  createProfile,
  loadCurrentUsername,
  loadProfiles,
  recordCombinedResult as recordCombinedResultInStorage,
  recordGameResult,
  recordReactionResult as recordReactionResultInStorage,
  recordRatedPatternRun as recordRatedPatternRunInStorage,
  recordRatedPuzzleResult,
  recordTriviaResult as recordTriviaResultInStorage,
  recordDirectionResult as recordDirectionResultInStorage,
  normalizeProfile,
  saveCurrentUsername,
  saveProfile,
  validatePassword,
  validateUsername,
} from "./storage";
import { applyAchievements, checkAchievements } from "./achievements";
import { getDailyGameId, recordDailyChallengeResult } from "./dailyChallenge";
import { getToday, updateStreak } from "./streak";
import { pushToGlobalLeaderboard } from "../leaderboard/globalLeaderboard";
import { fetchCloudProfile, isUserBanned, isUsernameTaken, pushCloudProfile } from "./cloudSync";
import { awardXp } from "../xp/award";
import { unlockedTitles, XP_AWARDS } from "../xp/levels";
import { applyChallengeEvent, ensureTodaysChallenges, type TripleChallengeEvent } from "./tripleChallenges";
import { claimTournamentRewards } from "../tournament/claim";
import { fetchTournamentHistoryForUsername, submitTournamentScore } from "../tournament/cloudSync";
import { ensureTournamentFinalized } from "../tournament/finalize";
import { currentTournamentWeek } from "../tournament/schedule";
import { isPlausibleScore } from "../tournament/scoring";
import { sanitizeBorder } from "./borders";
import { awardCoins } from "../coins/award";
import { canPurchase } from "../pets/collection";
import { getPetDef } from "../pets/catalog";
import { sanitizePetAccessories } from "../pets/accessories";

/** Apply streak update, daily-challenge tracking, and achievement check to an already-updated profile. */
function applyPostGameEffects(profile: PlayerProfile, events: TripleChallengeEvent[] = []): {
  updated: PlayerProfile;
  newAchievements: AchievementRecord[];
} {
  const today = getToday();
  let working: PlayerProfile = { ...profile, streak: updateStreak(profile.streak, today) };

  const rollover = ensureTodaysChallenges(working.tripleChallenges, working.challengeStreak, today);
  working = { ...working, tripleChallenges: rollover.state, challengeStreak: rollover.streak };

  for (const event of events) {
    const { state, xpGained, coinsGained, newlyCompleted } = applyChallengeEvent(working.tripleChallenges, event);
    working = { ...working, tripleChallenges: state };
    if (newlyCompleted.length > 0) {
      working = {
        ...working,
        challengeStreak: {
          ...working.challengeStreak,
          totalCompleted: working.challengeStreak.totalCompleted + newlyCompleted.length,
        },
      };
    }
    if (xpGained > 0) working = awardXp(working, xpGained);
    if (coinsGained > 0) working = awardCoins(working, coinsGained);
  }

  const newIds = checkAchievements(working);
  let updated = applyAchievements(working, newIds);
  if (newIds.length > 0) updated = awardXp(updated, newIds.length * XP_AWARDS.ACHIEVEMENT_UNLOCKED);
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
  /** Set when a session was force-signed-out because the account is banned. */
  bannedNotice: string | null;
  dismissBannedNotice: () => void;
  recordResult: (gameId: GameId, score: number) => void;
  recordReactionResult: (score: number, dotsHit: number) => void;
  recordTriviaResult: (score: number, correctCount: number, totalAnswered: number) => void;
  recordDirectionResult: (score: number, correctCount: number, totalAnswered: number) => void;
  recordCombinedResult: (score: number) => void;
  recordRatedPuzzle: (correct: boolean, elapsedMs: number, puzzleId?: number) => void;
  recordRatedPatternRun: (solved: number, attempted: number, ratingDelta: number) => void;
  setAvatar: (avatar: string) => void;
  setAvatarConfig: (avatarConfig: AvatarConfig) => void;
  setSelectedTitle: (title: string) => void;
  setProfileBorder: (borderId: string) => void;
  buyPet: (petId: string) => { ok: true } | { ok: false; error: "already-owned" | "not-enough-coins" | "unknown-pet" };
  equipPet: (petId: string | null) => void;
  setPetAccessories: (accessoryIds: string[]) => void;
  existingUsernames: string[];
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Record<string, PlayerProfile>>({});
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAchievements, setPendingAchievements] = useState<AchievementRecord[]>([]);
  const [bannedNotice, setBannedNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedProfiles, loadedUsername] = await Promise.all([loadProfiles(), loadCurrentUsername()]);
      if (cancelled) return;
      setProfiles(loadedProfiles);
      // A previously signed-in user could have been banned since their last
      // visit — re-check on every app load, not just at sign-in time.
      if (loadedUsername && (await isUserBanned(loadedUsername))) {
        if (cancelled) return;
        await clearCurrentUsername();
        setCurrentUsername(null);
        setBannedNotice("This account has been banned.");
        setLoading(false);
        return;
      }
      if (cancelled) return;
      setCurrentUsername(loadedUsername);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissPendingAchievements = useCallback(() => setPendingAchievements([]), []);
  const dismissBannedNotice = useCallback(() => setBannedNotice(null), []);

  const createAccount = useCallback(
    async (rawUsername: string, rawPassword: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      const usernameResult = validateUsername(rawUsername);
      if (!usernameResult.ok) return usernameResult;

      const passwordResult = validatePassword(rawPassword);
      if (!passwordResult.ok) return passwordResult;

      const { username } = usernameResult;
      const { password } = passwordResult;

      if (profiles[username] || await isUsernameTaken(username)) {
        return { ok: false, error: "Username already taken." };
      }

      const salt = generateSalt();
      const hash = await hashPassword(password, salt);
      const profile = createProfile(username, hash, salt);

      await saveProfile(profile);
      await saveCurrentUsername(username);
      void pushCloudProfile(username, hash, salt, profile as unknown as Record<string, unknown>);
      void pushToGlobalLeaderboard(profile);
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

      if (await isUserBanned(username)) {
        return { ok: false, error: "This account has been banned." };
      }

      let profile = profiles[username];

      // Not found locally — try fetching from the cloud
      if (!profile) {
        const cloud = await fetchCloudProfile(username);
        if (!cloud) return { ok: false, error: "Invalid username or password." };
        if (!(await verifyPassword(rawPassword, cloud.password_salt, cloud.password_hash))) {
          return { ok: false, error: "Invalid username or password." };
        }
        // Restore the profile from cloud data
        profile = normalizeProfile({ ...createProfile(username, cloud.password_hash, cloud.password_salt), ...(cloud.profile_data as object) });
        await saveProfile(profile);
        void pushToGlobalLeaderboard(profile);
        setProfiles((prev) => ({ ...prev, [username]: profile! }));
        await saveCurrentUsername(username);
        setCurrentUsername(username);
        return { ok: true };
      }

      if (!(await verifyPassword(rawPassword, profile.passwordSalt, profile.passwordHash))) {
        return { ok: false, error: "Invalid username or password." };
      }

      // Push to cloud so this account is accessible from other devices, and
      // ensure they show up on the global leaderboard even if they haven't
      // played a game yet.
      void pushCloudProfile(profile.username, profile.passwordHash, profile.passwordSalt, profile as unknown as Record<string, unknown>);
      void pushToGlobalLeaderboard(profile);
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

  /** Submits this score to the weekly tournament if `gameId` is this week's featured game. */
  const maybeSubmitTournamentScore = useCallback(
    (username: string, level: number, gameId: GameId, score: number) => {
      const week = currentTournamentWeek();
      if (week.gameId !== gameId || !isPlausibleScore(gameId, score)) return;
      void submitTournamentScore(week.weekStart, username, gameId, score, level);
    },
    [],
  );

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
        const { updated: final, newAchievements } = applyPostGameEffects(updated, [{ type: "game", gameId, score }]);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(final);
        void pushToGlobalLeaderboard(final);
        void pushCloudProfile(final.username, final.passwordHash, final.passwordSalt, final as unknown as Record<string, unknown>);
        maybeSubmitTournamentScore(final.username, final.level, gameId, score);
        return { ...prev, [currentUsername]: final };
      });
    },
    [currentUsername, maybeSubmitTournamentScore],
  );

  const recordReactionResult = useCallback(
    (score: number, dotsHit: number) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const updated = recordReactionResultInStorage(current, score, dotsHit);
        const { updated: final, newAchievements } = applyPostGameEffects(updated, [{ type: "game", gameId: "reaction", score }]);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(final);
        void pushToGlobalLeaderboard(final);
        void pushCloudProfile(final.username, final.passwordHash, final.passwordSalt, final as unknown as Record<string, unknown>);
        maybeSubmitTournamentScore(final.username, final.level, "reaction", score);
        return { ...prev, [currentUsername]: final };
      });
    },
    [currentUsername, maybeSubmitTournamentScore],
  );

  const recordTriviaResult = useCallback(
    (score: number, correctCount: number, totalAnswered: number) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const updated = recordTriviaResultInStorage(current, score, correctCount, totalAnswered);
        const { updated: final, newAchievements } = applyPostGameEffects(updated, [{ type: "game", gameId: "trivia", score }]);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(final);
        void pushToGlobalLeaderboard(final);
        void pushCloudProfile(final.username, final.passwordHash, final.passwordSalt, final as unknown as Record<string, unknown>);
        maybeSubmitTournamentScore(final.username, final.level, "trivia", score);
        return { ...prev, [currentUsername]: final };
      });
    },
    [currentUsername, maybeSubmitTournamentScore],
  );

  const recordDirectionResult = useCallback(
    (score: number, correctCount: number, totalAnswered: number) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const updated = recordDirectionResultInStorage(current, score, correctCount, totalAnswered);
        const events: TripleChallengeEvent[] = [{ type: "game", gameId: "direction", score }];
        if (correctCount > 0) events.push({ type: "direction-correct", count: correctCount });
        const { updated: final, newAchievements } = applyPostGameEffects(updated, events);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(final);
        void pushToGlobalLeaderboard(final);
        void pushCloudProfile(final.username, final.passwordHash, final.passwordSalt, final as unknown as Record<string, unknown>);
        maybeSubmitTournamentScore(final.username, final.level, "direction", score);
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
        const { updated, newAchievements } = applyPostGameEffects(afterResult, [{ type: "all-games-challenge" }]);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(updated);
        void pushToGlobalLeaderboard(updated);
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
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
        const { updated, newAchievements } = applyPostGameEffects(afterResult, correct ? [{ type: "puzzle-solved" }] : []);
        if (newAchievements.length > 0) setPendingAchievements((p) => [...p, ...newAchievements]);
        void saveProfile(updated);
        void pushToGlobalLeaderboard(updated);
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
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
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
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
        void pushToGlobalLeaderboard(updated);
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const setAvatarConfig = useCallback(
    (avatarConfig: AvatarConfig) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const updated = { ...current, avatarConfig };
        void saveProfile(updated);
        void pushToGlobalLeaderboard(updated);
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const setSelectedTitle = useCallback(
    (title: string) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current || !unlockedTitles(current.level).includes(title)) return prev;
        const updated = { ...current, selectedTitle: title };
        void saveProfile(updated);
        void pushToGlobalLeaderboard(updated);
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const setProfileBorder = useCallback(
    (borderId: string) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const sanitized = sanitizeBorder(borderId, current.level);
        if (sanitized === "none" && borderId !== "none") return prev;
        const updated = { ...current, profileBorder: sanitized };
        void saveProfile(updated);
        void pushToGlobalLeaderboard(updated);
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const profile = currentUsername ? profiles[currentUsername] ?? null : null;

  const buyPet = useCallback(
    (petId: string) => {
      if (!profile) return { ok: false as const, error: "unknown-pet" as const };
      const result = canPurchase(petId, profile.coins, profile.ownedPets);
      if (!result.ok) return result;
      const pet = getPetDef(petId);
      if (!pet) return { ok: false as const, error: "unknown-pet" as const };
      const updated: PlayerProfile = {
        ...profile,
        coins: profile.coins - pet.price,
        ownedPets: [...profile.ownedPets, petId],
      };
      void saveProfile(updated);
      void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
      setProfiles((prev) => ({ ...prev, [updated.username]: updated }));
      return { ok: true as const };
    },
    [profile],
  );

  const equipPet = useCallback(
    (petId: string | null) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        if (petId !== null && !current.ownedPets.includes(petId)) return prev;
        const updated = { ...current, equippedPet: petId };
        void saveProfile(updated);
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );

  const setPetAccessories = useCallback(
    (accessoryIds: string[]) => {
      setProfiles((prev) => {
        if (!currentUsername) return prev;
        const current = prev[currentUsername];
        if (!current) return prev;
        const updated = { ...current, petAccessories: sanitizePetAccessories(accessoryIds, current.level) };
        void saveProfile(updated);
        void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
        return { ...prev, [currentUsername]: updated };
      });
    },
    [currentUsername],
  );
  const allProfiles = useMemo(() => Object.values(profiles), [profiles]);
  const existingUsernames = useMemo(() => Object.keys(profiles), [profiles]);

  // Ensure today's 3 daily challenges exist as soon as a profile becomes active,
  // not just after the player finishes a game.
  useEffect(() => {
    if (!profile) return;
    const today = getToday();
    if (profile.tripleChallenges.date === today) return;
    const rollover = ensureTodaysChallenges(profile.tripleChallenges, profile.challengeStreak, today);
    const updated = { ...profile, tripleChallenges: rollover.state, challengeStreak: rollover.streak };
    void saveProfile(updated);
    setProfiles((prev) => ({ ...prev, [updated.username]: updated }));
  }, [profile]);

  // Opportunistically close out last week's tournament and claim any unclaimed
  // top-3 rewards as soon as a profile becomes active.
  useEffect(() => {
    if (!profile) return;
    const username = profile.username;
    let cancelled = false;
    (async () => {
      await ensureTournamentFinalized();
      const history = await fetchTournamentHistoryForUsername(username);
      if (cancelled || history.length === 0) return;
      const { profile: latest } = (() => {
        const current = profiles[username];
        return current ? { profile: current } : { profile: null };
      })();
      const base = latest ?? profile;
      const { profile: updated, newlyClaimed } = claimTournamentRewards(base, history);
      if (cancelled || newlyClaimed.length === 0) return;
      void saveProfile(updated);
      void pushCloudProfile(updated.username, updated.passwordHash, updated.passwordSalt, updated as unknown as Record<string, unknown>);
      setProfiles((prev) => ({ ...prev, [username]: updated }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.username]);

  const value: PlayerContextValue = {
    profile,
    loading,
    allProfiles,
    pendingAchievements,
    dismissPendingAchievements,
    bannedNotice,
    dismissBannedNotice,
    createAccount,
    signIn,
    signOut,
    recordResult,
    recordReactionResult,
    recordTriviaResult,
    recordDirectionResult,
    recordCombinedResult,
    recordRatedPuzzle,
    recordRatedPatternRun,
    setAvatar,
    setAvatarConfig,
    setSelectedTitle,
    setProfileBorder,
    buyPet,
    equipPet,
    setPetAccessories,
    existingUsernames,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayerProfile(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayerProfile must be used within a PlayerProvider");
  return ctx;
}
