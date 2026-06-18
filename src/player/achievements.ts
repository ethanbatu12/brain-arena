import type { AchievementId, AchievementRecord, PlayerProfile } from "./types";

interface AchievementDef {
  id: AchievementId;
  label: string;
  description: string;
  icon: string;
  check: (profile: PlayerProfile) => boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first-game",
    label: "First Game",
    description: "Play your first game.",
    icon: "🎮",
    check: (p) => p.totalGamesPlayed >= 1,
  },
  {
    id: "games-10",
    label: "10 Games",
    description: "Play 10 games.",
    icon: "🔢",
    check: (p) => p.totalGamesPlayed >= 10,
  },
  {
    id: "games-50",
    label: "50 Games",
    description: "Play 50 games.",
    icon: "🎯",
    check: (p) => p.totalGamesPlayed >= 50,
  },
  {
    id: "games-100",
    label: "Century",
    description: "Play 100 games.",
    icon: "💯",
    check: (p) => p.totalGamesPlayed >= 100,
  },
  {
    id: "high-score-500",
    label: "High Scorer",
    description: "Earn 500 points in a single game.",
    icon: "⭐",
    check: (p) => p.overallBestScore >= 500,
  },
  {
    id: "high-score-1000",
    label: "Score Master",
    description: "Earn 1000 points in a single game.",
    icon: "🌟",
    check: (p) => p.overallBestScore >= 1000,
  },
  {
    id: "challenge-first",
    label: "Challenger",
    description: "Complete your first All Games Challenge.",
    icon: "🏆",
    check: (p) => p.challengeRunsCompleted >= 1,
  },
  {
    id: "challenge-5",
    label: "Challenge Veteran",
    description: "Complete 5 All Games Challenges.",
    icon: "🎖️",
    check: (p) => p.challengeRunsCompleted >= 5,
  },
  {
    id: "streak-3",
    label: "3-Day Streak",
    description: "Play 3 days in a row.",
    icon: "🔥",
    check: (p) => p.streak.longestStreak >= 3,
  },
  {
    id: "streak-7",
    label: "Week Warrior",
    description: "Play 7 days in a row.",
    icon: "⚡",
    check: (p) => p.streak.longestStreak >= 7,
  },
  {
    id: "streak-30",
    label: "Monthly Master",
    description: "Play 30 days in a row.",
    icon: "💎",
    check: (p) => p.streak.longestStreak >= 30,
  },
  {
    id: "chess-rating-1200",
    label: "Chess Beginner",
    description: "Reach a chess rating of 1200.",
    icon: "♟️",
    check: (p) => p.ratedPuzzles.highestRating >= 1200,
  },
  {
    id: "chess-rating-1500",
    label: "Chess Expert",
    description: "Reach a chess rating of 1500.",
    icon: "♔",
    check: (p) => p.ratedPuzzles.highestRating >= 1500,
  },
  {
    id: "pattern-rating-1200",
    label: "Pattern Beginner",
    description: "Reach a pattern rating of 1200.",
    icon: "🧩",
    check: (p) => p.ratedPatterns.highestRating >= 1200,
  },
  {
    id: "pattern-rating-1500",
    label: "Pattern Expert",
    description: "Reach a pattern rating of 1500.",
    icon: "🔮",
    check: (p) => p.ratedPatterns.highestRating >= 1500,
  },
];

/** Returns ids of achievements newly unlocked by this profile state. */
export function checkAchievements(profile: PlayerProfile): AchievementId[] {
  const alreadyUnlocked = new Set(profile.achievements.map((a) => a.id));
  return ACHIEVEMENT_DEFS.filter(
    (def) => !alreadyUnlocked.has(def.id) && def.check(profile),
  ).map((def) => def.id);
}

/** Returns profile with newly-unlocked achievements appended. */
export function applyAchievements(profile: PlayerProfile, newIds: AchievementId[]): PlayerProfile {
  if (newIds.length === 0) return profile;
  const now = new Date().toISOString();
  const newRecords: AchievementRecord[] = newIds.map((id) => ({ id, unlockedAt: now }));
  return { ...profile, achievements: [...profile.achievements, ...newRecords] };
}

/** Looks up display info for an achievement by id. */
export function getAchievementDef(id: AchievementId): AchievementDef | undefined {
  return ACHIEVEMENT_DEFS.find((d) => d.id === id);
}
