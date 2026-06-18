import { describe, expect, it } from "vitest";
import { getDailyGameId, getTodaysDailyRecord, recordDailyChallengeResult } from "./dailyChallenge";
import { createProfile } from "./storage";
import { GAME_IDS } from "./types";

function blankProfile() {
  return createProfile("Tester", "hash", "salt");
}

describe("getDailyGameId", () => {
  it("returns a valid GameId for any date", () => {
    const id = getDailyGameId("2025-06-18");
    expect(GAME_IDS).toContain(id);
  });

  it("is deterministic — same date always returns the same game", () => {
    expect(getDailyGameId("2025-06-18")).toBe(getDailyGameId("2025-06-18"));
  });

  it("returns different games for different dates (across 5 consecutive days)", () => {
    const ids = [
      getDailyGameId("2025-01-01"),
      getDailyGameId("2025-01-02"),
      getDailyGameId("2025-01-03"),
      getDailyGameId("2025-01-04"),
      getDailyGameId("2025-01-05"),
    ];
    // There are 5 distinct game ids; 5 dates should produce all 5 unique ids
    // (due to consecutive modular arithmetic with 5 games).
    expect(new Set(ids).size).toBe(5);
  });

  it("covers all game ids given enough dates", () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 20; i++) {
      seen.add(getDailyGameId(`2025-01-${String(i).padStart(2, "0")}`));
    }
    for (const id of GAME_IDS) {
      expect(seen).toContain(id);
    }
  });
});

describe("getTodaysDailyRecord", () => {
  it("returns null when no daily challenges have been recorded", () => {
    const profile = blankProfile();
    expect(getTodaysDailyRecord(profile, "2025-06-18")).toBeNull();
  });

  it("returns the record for today when it exists", () => {
    let profile = blankProfile();
    profile = recordDailyChallengeResult(profile, "2025-06-18", "memory", 300);
    const record = getTodaysDailyRecord(profile, "2025-06-18");
    expect(record).not.toBeNull();
    expect(record?.gameId).toBe("memory");
    expect(record?.score).toBe(300);
    expect(record?.completed).toBe(true);
  });

  it("returns null for a different date even if another date has a record", () => {
    let profile = blankProfile();
    profile = recordDailyChallengeResult(profile, "2025-06-17", "math", 200);
    expect(getTodaysDailyRecord(profile, "2025-06-18")).toBeNull();
  });
});

describe("recordDailyChallengeResult", () => {
  it("adds a new daily challenge record", () => {
    const profile = blankProfile();
    const updated = recordDailyChallengeResult(profile, "2025-06-18", "memory", 500);
    expect(updated.dailyChallenges).toHaveLength(1);
    expect(updated.dailyChallenges[0]).toMatchObject({
      date: "2025-06-18",
      gameId: "memory",
      score: 500,
      completed: true,
    });
  });

  it("keeps the higher score on a second attempt the same day", () => {
    let profile = blankProfile();
    profile = recordDailyChallengeResult(profile, "2025-06-18", "memory", 300);
    profile = recordDailyChallengeResult(profile, "2025-06-18", "memory", 500);
    expect(profile.dailyChallenges).toHaveLength(1);
    expect(profile.dailyChallenges[0].score).toBe(500);
  });

  it("keeps a lower score unchanged when a worse score is recorded", () => {
    let profile = blankProfile();
    profile = recordDailyChallengeResult(profile, "2025-06-18", "memory", 500);
    profile = recordDailyChallengeResult(profile, "2025-06-18", "memory", 200);
    expect(profile.dailyChallenges[0].score).toBe(500);
  });

  it("stores records from multiple dates independently", () => {
    let profile = blankProfile();
    profile = recordDailyChallengeResult(profile, "2025-06-17", "math", 200);
    profile = recordDailyChallengeResult(profile, "2025-06-18", "memory", 500);
    expect(profile.dailyChallenges).toHaveLength(2);
  });

  it("does not mutate the original profile", () => {
    const profile = blankProfile();
    recordDailyChallengeResult(profile, "2025-06-18", "memory", 300);
    expect(profile.dailyChallenges).toHaveLength(0);
  });
});
