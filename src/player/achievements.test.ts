import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_DEFS, applyAchievements, checkAchievements, getAchievementDef } from "./achievements";
import { createProfile } from "./storage";

function blankProfile() {
  return createProfile("Tester", "hash", "salt");
}

describe("ACHIEVEMENT_DEFS", () => {
  it("has 15 achievement definitions", () => {
    expect(ACHIEVEMENT_DEFS).toHaveLength(15);
  });

  it("every definition has a unique id, icon, label, and description", () => {
    const ids = ACHIEVEMENT_DEFS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of ACHIEVEMENT_DEFS) {
      expect(d.icon.length).toBeGreaterThan(0);
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.description.length).toBeGreaterThan(0);
    }
  });
});

describe("checkAchievements", () => {
  it("returns no achievements for a brand-new profile", () => {
    const profile = blankProfile();
    expect(checkAchievements(profile)).toHaveLength(0);
  });

  it("returns 'first-game' after one game is played", () => {
    const profile = { ...blankProfile(), totalGamesPlayed: 1 };
    const ids = checkAchievements(profile);
    expect(ids).toContain("first-game");
  });

  it("returns multiple achievements when multiple thresholds are crossed at once", () => {
    const profile = { ...blankProfile(), totalGamesPlayed: 100 };
    const ids = checkAchievements(profile);
    expect(ids).toContain("first-game");
    expect(ids).toContain("games-10");
    expect(ids).toContain("games-50");
    expect(ids).toContain("games-100");
  });

  it("does not re-unlock an already-unlocked achievement", () => {
    const profile = {
      ...blankProfile(),
      totalGamesPlayed: 1,
      achievements: [{ id: "first-game" as const, unlockedAt: "2025-01-01T00:00:00.000Z" }],
    };
    const ids = checkAchievements(profile);
    expect(ids).not.toContain("first-game");
  });

  it("unlocks high-score achievements based on overallBestScore", () => {
    const profile = { ...blankProfile(), overallBestScore: 1000 };
    const ids = checkAchievements(profile);
    expect(ids).toContain("high-score-500");
    expect(ids).toContain("high-score-1000");
  });

  it("unlocks challenge achievements based on challengeRunsCompleted", () => {
    const profile = { ...blankProfile(), challengeRunsCompleted: 5 };
    const ids = checkAchievements(profile);
    expect(ids).toContain("challenge-first");
    expect(ids).toContain("challenge-5");
  });

  it("unlocks streak achievements based on longestStreak", () => {
    const profile = {
      ...blankProfile(),
      streak: { currentStreak: 7, longestStreak: 7, lastPlayedDate: "2025-01-07" },
    };
    const ids = checkAchievements(profile);
    expect(ids).toContain("streak-3");
    expect(ids).toContain("streak-7");
    expect(ids).not.toContain("streak-30");
  });

  it("unlocks chess-rating achievements based on highestRating", () => {
    const profile = {
      ...blankProfile(),
      ratedPuzzles: { ...blankProfile().ratedPuzzles, highestRating: 1500 },
    };
    const ids = checkAchievements(profile);
    expect(ids).toContain("chess-rating-1200");
    expect(ids).toContain("chess-rating-1500");
  });

  it("unlocks pattern-rating achievements based on highestRating", () => {
    const profile = {
      ...blankProfile(),
      ratedPatterns: { ...blankProfile().ratedPatterns, highestRating: 1200 },
    };
    const ids = checkAchievements(profile);
    expect(ids).toContain("pattern-rating-1200");
    expect(ids).not.toContain("pattern-rating-1500");
  });
});

describe("applyAchievements", () => {
  it("returns the same profile reference when no new achievements are provided", () => {
    const profile = blankProfile();
    expect(applyAchievements(profile, [])).toBe(profile);
  });

  it("appends new achievement records with a timestamp", () => {
    const profile = blankProfile();
    const updated = applyAchievements(profile, ["first-game"]);
    expect(updated.achievements).toHaveLength(1);
    expect(updated.achievements[0].id).toBe("first-game");
    expect(updated.achievements[0].unlockedAt).toBeTruthy();
  });

  it("does not mutate the original profile", () => {
    const profile = blankProfile();
    applyAchievements(profile, ["first-game"]);
    expect(profile.achievements).toHaveLength(0);
  });
});

describe("getAchievementDef", () => {
  it("returns the definition for a known id", () => {
    const def = getAchievementDef("first-game");
    expect(def).toBeDefined();
    expect(def?.label).toBe("First Game");
  });

  it("returns undefined for an unknown id", () => {
    // @ts-expect-error testing unknown id
    expect(getAchievementDef("nonexistent")).toBeUndefined();
  });
});
