import { beforeEach, describe, expect, it } from "vitest";
import { GAME_IDS } from "./types";
import {
  averageScore,
  clearCurrentUsername,
  combinedAverageScore,
  createProfile,
  emptyRatedPatternStats,
  loadCurrentUsername,
  loadProfiles,
  overallAverageScore,
  recordCombinedResult,
  recordGameResult,
  recordRatedPatternRun,
  saveCurrentUsername,
  saveProfile,
  validatePassword,
  validateUsername,
} from "./storage";
import { RATED_PATTERN_INITIAL_RATING } from "../pattern/constants";
import { clearAllForTests, indexedDbProfileStore } from "./db";

const HASH = "deadbeef";
const SALT = "cafebabe";

beforeEach(async () => {
  await clearAllForTests();
});

describe("validateUsername", () => {
  it("accepts a normal name and trims surrounding whitespace", () => {
    expect(validateUsername("  Alice  ")).toEqual({ ok: true, username: "Alice" });
  });

  it("accepts letters, numbers, spaces, hyphens, and underscores", () => {
    expect(validateUsername("Player_One-2")).toEqual({ ok: true, username: "Player_One-2" });
  });

  it("rejects an empty (or whitespace-only) name", () => {
    const result = validateUsername("   ");
    expect(result.ok).toBe(false);
  });

  it("rejects names shorter than 2 characters", () => {
    const result = validateUsername("a");
    expect(result.ok).toBe(false);
  });

  it("rejects names longer than 20 characters", () => {
    const result = validateUsername("a".repeat(21));
    expect(result.ok).toBe(false);
  });

  it("rejects names with disallowed characters", () => {
    const result = validateUsername("bad@name!");
    expect(result.ok).toBe(false);
  });
});

describe("validatePassword", () => {
  it("accepts a password between 4 and 40 characters", () => {
    expect(validatePassword("secret1")).toEqual({ ok: true, password: "secret1" });
  });

  it("rejects passwords shorter than 4 characters", () => {
    expect(validatePassword("abc").ok).toBe(false);
  });

  it("rejects passwords longer than 40 characters", () => {
    expect(validatePassword("a".repeat(41)).ok).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(validatePassword("").ok).toBe(false);
  });
});

describe("createProfile", () => {
  it("initializes every game with zeroed stats and zeroed overall/combined stats", () => {
    const profile = createProfile("Alice", HASH, SALT);
    expect(profile.username).toBe("Alice");
    expect(profile.passwordHash).toBe(HASH);
    expect(profile.passwordSalt).toBe(SALT);
    expect(profile.totalGamesPlayed).toBe(0);
    expect(profile.overallBestScore).toBe(0);
    expect(profile.overallTotalScore).toBe(0);
    expect(profile.combinedBestScore).toBe(0);
    expect(profile.combinedTotalScore).toBe(0);
    expect(profile.challengeRunsCompleted).toBe(0);
    for (const id of GAME_IDS) {
      expect(profile.games[id]).toEqual({ bestScore: 0, gamesPlayed: 0, totalScore: 0 });
    }
  });
});

describe("recordGameResult", () => {
  it("records the first result for a game and updates overall stats", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const updated = recordGameResult(profile, "balloon", 75);

    expect(updated.games.balloon).toEqual({ bestScore: 75, gamesPlayed: 1, totalScore: 75 });
    expect(updated.totalGamesPlayed).toBe(1);
    expect(updated.overallBestScore).toBe(75);
    expect(updated.overallTotalScore).toBe(75);
  });

  it("does not lower bestScore/overallBestScore on a worse result, but still tallies totals", () => {
    let profile = createProfile("Alice", HASH, SALT);
    profile = recordGameResult(profile, "balloon", 75);
    profile = recordGameResult(profile, "balloon", 25);

    expect(profile.games.balloon).toEqual({ bestScore: 75, gamesPlayed: 2, totalScore: 100 });
    expect(profile.totalGamesPlayed).toBe(2);
    expect(profile.overallBestScore).toBe(75);
    expect(profile.overallTotalScore).toBe(100);
  });

  it("raises bestScore/overallBestScore on a better result", () => {
    let profile = createProfile("Alice", HASH, SALT);
    profile = recordGameResult(profile, "balloon", 75);
    profile = recordGameResult(profile, "balloon", 200);

    expect(profile.games.balloon.bestScore).toBe(200);
    expect(profile.overallBestScore).toBe(200);
  });

  it("keeps each game's bestScore independent while overallBestScore tracks the max", () => {
    let profile = createProfile("Alice", HASH, SALT);
    profile = recordGameResult(profile, "balloon", 75);
    profile = recordGameResult(profile, "logic", 300);
    profile = recordGameResult(profile, "math", 120);

    expect(profile.games.balloon.bestScore).toBe(75);
    expect(profile.games.logic.bestScore).toBe(300);
    expect(profile.games.math.bestScore).toBe(120);
    expect(profile.games.memory.bestScore).toBe(0);
    expect(profile.overallBestScore).toBe(300);
    expect(profile.overallTotalScore).toBe(75 + 300 + 120);
    expect(profile.totalGamesPlayed).toBe(3);
  });

  it("does not mutate the original profile", () => {
    const profile = createProfile("Alice", HASH, SALT);
    recordGameResult(profile, "balloon", 75);
    expect(profile.games.balloon.gamesPlayed).toBe(0);
  });
});

describe("recordCombinedResult", () => {
  it("records the first combined score as the combined and overall best, and tallies challenge totals", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const updated = recordCombinedResult(profile, 180);

    expect(updated.combinedBestScore).toBe(180);
    expect(updated.overallBestScore).toBe(180);
    expect(updated.overallTotalScore).toBe(180);
    expect(updated.combinedTotalScore).toBe(180);
    expect(updated.challengeRunsCompleted).toBe(1);
  });

  it("does not lower combinedBestScore/overallBestScore on a worse result, but still tallies totals", () => {
    let profile = createProfile("Alice", HASH, SALT);
    profile = recordCombinedResult(profile, 180);
    profile = recordCombinedResult(profile, 90);

    expect(profile.combinedBestScore).toBe(180);
    expect(profile.overallBestScore).toBe(180);
    expect(profile.overallTotalScore).toBe(270);
    expect(profile.combinedTotalScore).toBe(270);
    expect(profile.challengeRunsCompleted).toBe(2);
  });

  it("raises combinedBestScore/overallBestScore on a better result", () => {
    let profile = createProfile("Alice", HASH, SALT);
    profile = recordCombinedResult(profile, 180);
    profile = recordCombinedResult(profile, 240);

    expect(profile.combinedBestScore).toBe(240);
    expect(profile.overallBestScore).toBe(240);
  });

  it("does not change totalGamesPlayed or per-game stats", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const updated = recordCombinedResult(profile, 180);

    expect(updated.totalGamesPlayed).toBe(0);
    expect(updated.games).toEqual(profile.games);
  });
});

describe("averageScore", () => {
  it("is zero when no games have been played", () => {
    expect(averageScore({ bestScore: 0, gamesPlayed: 0, totalScore: 0 })).toBe(0);
  });

  it("divides total score by games played", () => {
    expect(averageScore({ bestScore: 100, gamesPlayed: 4, totalScore: 200 })).toBe(50);
  });
});

describe("overallAverageScore", () => {
  it("is zero for a fresh profile", () => {
    expect(overallAverageScore(createProfile("Alice", HASH, SALT))).toBe(0);
  });

  it("divides overall total score by total games played", () => {
    let profile = createProfile("Alice", HASH, SALT);
    profile = recordGameResult(profile, "balloon", 50);
    profile = recordGameResult(profile, "math", 150);

    expect(overallAverageScore(profile)).toBe(100);
  });
});

describe("combinedAverageScore", () => {
  it("is zero with no completed challenge runs", () => {
    expect(combinedAverageScore(createProfile("Alice", HASH, SALT))).toBe(0);
  });

  it("divides combined total score by challenge runs completed", () => {
    let profile = createProfile("Alice", HASH, SALT);
    profile = recordCombinedResult(profile, 180);
    profile = recordCombinedResult(profile, 220);

    expect(combinedAverageScore(profile)).toBe(200);
  });
});

describe("profiles persistence", () => {
  it("returns an empty object when nothing is stored", async () => {
    expect(await loadProfiles()).toEqual({});
  });

  it("round-trips profiles through the database", async () => {
    const profile = createProfile("Alice", HASH, SALT);
    await saveProfile(profile);
    expect(await loadProfiles()).toEqual({ Alice: profile });
  });

  it("normalizes profiles stored before the newer fields existed", async () => {
    const legacy = createProfile("Alice", HASH, SALT) as unknown as Record<string, unknown>;
    delete legacy.passwordSalt;
    delete legacy.combinedBestScore;
    delete legacy.combinedTotalScore;
    delete legacy.challengeRunsCompleted;
    await indexedDbProfileStore.putProfile(legacy as never);

    const loaded = await loadProfiles();
    expect(loaded.Alice.passwordSalt).toBe("");
    expect(loaded.Alice.combinedBestScore).toBe(0);
    expect(loaded.Alice.combinedTotalScore).toBe(0);
    expect(loaded.Alice.challengeRunsCompleted).toBe(0);
  });
});

describe("recordRatedPatternRun", () => {
  it("initializes ratedPatterns with default rating", () => {
    const profile = createProfile("Alice", HASH, SALT);
    expect(profile.ratedPatterns).toEqual(emptyRatedPatternStats());
    expect(profile.ratedPatterns.rating).toBe(RATED_PATTERN_INITIAL_RATING);
  });

  it("gains rating on correct run", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const updated = recordRatedPatternRun(profile, 5, 5, 50); // 5 correct × +10
    expect(updated.ratedPatterns.rating).toBe(RATED_PATTERN_INITIAL_RATING + 50);
    expect(updated.ratedPatterns.highestRating).toBe(RATED_PATTERN_INITIAL_RATING + 50);
    expect(updated.ratedPatterns.totalSolved).toBe(5);
    expect(updated.ratedPatterns.totalAttempted).toBe(5);
    expect(updated.ratedPatterns.gamesPlayed).toBe(1);
    expect(updated.ratedPatterns.longestStreak).toBe(5);
  });

  it("loses rating on wrong answer run", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const updated = recordRatedPatternRun(profile, 0, 1, -25);
    expect(updated.ratedPatterns.rating).toBe(RATED_PATTERN_INITIAL_RATING - 25);
    expect(updated.ratedPatterns.highestRating).toBe(RATED_PATTERN_INITIAL_RATING - 25);
  });

  it("does not let rating drop below 0", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const updated = recordRatedPatternRun(profile, 0, 1, -9999);
    expect(updated.ratedPatterns.rating).toBe(0);
  });

  it("tracks longest streak across multiple runs", () => {
    let profile = createProfile("Alice", HASH, SALT);
    profile = recordRatedPatternRun(profile, 3, 4, 20);
    profile = recordRatedPatternRun(profile, 7, 8, 80);
    expect(profile.ratedPatterns.longestStreak).toBe(7);
  });

  it("normalizes profiles missing ratedPatterns field", async () => {
    const legacy = createProfile("Alice", HASH, SALT) as unknown as Record<string, unknown>;
    delete legacy.ratedPatterns;
    await indexedDbProfileStore.putProfile(legacy as never);
    const loaded = await loadProfiles();
    expect(loaded.Alice.ratedPatterns).toEqual(emptyRatedPatternStats());
  });
});

describe("current username persistence", () => {
  it("returns null when nothing is stored", async () => {
    expect(await loadCurrentUsername()).toBeNull();
  });

  it("round-trips the current username through the database", async () => {
    await saveCurrentUsername("Alice");
    expect(await loadCurrentUsername()).toBe("Alice");
  });

  it("clears the current username", async () => {
    await saveCurrentUsername("Alice");
    await clearCurrentUsername();
    expect(await loadCurrentUsername()).toBeNull();
  });
});
