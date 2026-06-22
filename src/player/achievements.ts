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
  // ── More game milestones ──────────────────────────────────────────────────
  {
    id: "games-250",
    label: "250 Games",
    description: "Play 250 games.",
    icon: "🏅",
    check: (p) => p.totalGamesPlayed >= 250,
  },
  {
    id: "games-500",
    label: "500 Games",
    description: "Play 500 games.",
    icon: "👑",
    check: (p) => p.totalGamesPlayed >= 500,
  },
  // ── Higher score milestones ───────────────────────────────────────────────
  {
    id: "high-score-2500",
    label: "Score Legend",
    description: "Earn 2500 points in a single game.",
    icon: "🚀",
    check: (p) => p.overallBestScore >= 2500,
  },
  {
    id: "high-score-5000",
    label: "Unstoppable",
    description: "Earn 5000 points in a single game.",
    icon: "💥",
    check: (p) => p.overallBestScore >= 5000,
  },
  // ── Challenge milestones ──────────────────────────────────────────────────
  {
    id: "challenge-25",
    label: "Challenge Legend",
    description: "Complete 25 All Games Challenges.",
    icon: "🏆",
    check: (p) => p.challengeRunsCompleted >= 25,
  },
  // ── Long streaks ──────────────────────────────────────────────────────────
  {
    id: "streak-100",
    label: "Century Streak",
    description: "Play 100 days in a row.",
    icon: "🌈",
    check: (p) => p.streak.longestStreak >= 100,
  },
  // ── Chess ratings ─────────────────────────────────────────────────────────
  {
    id: "chess-rating-1800",
    label: "Chess Master",
    description: "Reach a chess rating of 1800.",
    icon: "👑",
    check: (p) => p.ratedPuzzles.highestRating >= 1800,
  },
  {
    id: "chess-rating-2000",
    label: "Chess Grandmaster",
    description: "Reach a chess rating of 2000.",
    icon: "🏆",
    check: (p) => p.ratedPuzzles.highestRating >= 2000,
  },
  // ── Pattern ratings ───────────────────────────────────────────────────────
  {
    id: "pattern-rating-1800",
    label: "Pattern Master",
    description: "Reach a pattern rating of 1800.",
    icon: "🧠",
    check: (p) => p.ratedPatterns.highestRating >= 1800,
  },
  // ── Per-game bests ────────────────────────────────────────────────────────
  {
    id: "memory-best-500",
    label: "Memory Pro",
    description: "Score 500 in Memory Matrix.",
    icon: "🟦",
    check: (p) => p.games.memory.bestScore >= 500,
  },
  {
    id: "memory-best-1000",
    label: "Memory Elite",
    description: "Score 1000 in Memory Matrix.",
    icon: "🟣",
    check: (p) => p.games.memory.bestScore >= 1000,
  },
  {
    id: "math-best-500",
    label: "Math Pro",
    description: "Score 500 in Mental Math.",
    icon: "➕",
    check: (p) => p.games.math.bestScore >= 500,
  },
  {
    id: "math-best-1000",
    label: "Math Elite",
    description: "Score 1000 in Mental Math.",
    icon: "🔢",
    check: (p) => p.games.math.bestScore >= 1000,
  },
  {
    id: "logic-best-500",
    label: "Logic Pro",
    description: "Score 500 in Logic Challenge.",
    icon: "🟧",
    check: (p) => p.games.logic.bestScore >= 500,
  },
  {
    id: "logic-best-1000",
    label: "Logic Elite",
    description: "Score 1000 in Logic Challenge.",
    icon: "🧊",
    check: (p) => p.games.logic.bestScore >= 1000,
  },
  {
    id: "balloon-best-500",
    label: "Balloon Pro",
    description: "Score 500 in Balloon Pop.",
    icon: "🎈",
    check: (p) => p.games.balloon.bestScore >= 500,
  },
  // ── Explorer ──────────────────────────────────────────────────────────────
  {
    id: "all-games-played",
    label: "Explorer",
    description: "Play every game at least once.",
    icon: "🌍",
    check: (p) => Object.values(p.games).every((g) => g.gamesPlayed >= 1),
  },
  // ── Daily challenge ───────────────────────────────────────────────────────
  {
    id: "daily-first",
    label: "Daily Player",
    description: "Complete your first daily challenge.",
    icon: "📅",
    check: (p) => (p.dailyChallenges ?? []).some((d) => d.completed),
  },
  {
    id: "daily-7",
    label: "Daily Devotee",
    description: "Complete 7 daily challenges.",
    icon: "🗓️",
    check: (p) => (p.dailyChallenges ?? []).filter((d) => d.completed).length >= 7,
  },
  // ── Reaction Grid ────────────────────────────────────────────────────────
  {
    id: "reaction-first",
    label: "Quick Reflexes",
    description: "Play your first Reaction Grid game.",
    icon: "⚡",
    check: (p) => p.games.reaction.gamesPlayed >= 1,
  },
  {
    id: "reaction-best-500",
    label: "Sharp Shooter",
    description: "Score 500 in Reaction Grid.",
    icon: "🔵",
    check: (p) => p.games.reaction.bestScore >= 500,
  },
  {
    id: "reaction-best-1000",
    label: "Lightning Reflexes",
    description: "Score 1000 in Reaction Grid.",
    icon: "🟦",
    check: (p) => p.games.reaction.bestScore >= 1000,
  },
  {
    id: "reaction-dots-100",
    label: "Dot Dabbler",
    description: "Hit 100 total dots in Reaction Grid.",
    icon: "🎯",
    check: (p) => (p.reactionDotsHit ?? 0) >= 100,
  },
  {
    id: "reaction-dots-500",
    label: "Dot Crusher",
    description: "Hit 500 total dots in Reaction Grid.",
    icon: "💠",
    check: (p) => (p.reactionDotsHit ?? 0) >= 500,
  },
  {
    id: "reaction-dots-1000",
    label: "Dot Annihilator",
    description: "Hit 1000 total dots in Reaction Grid.",
    icon: "✨",
    check: (p) => (p.reactionDotsHit ?? 0) >= 1000,
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
