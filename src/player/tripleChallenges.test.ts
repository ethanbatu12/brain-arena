import { describe, expect, it } from "vitest";
import {
  applyChallengeEvent,
  emptyChallengeStreak,
  emptyTripleChallengeState,
  ensureTodaysChallenges,
  generateDailyChallenges,
  TRIPLE_CHALLENGE_TEMPLATES,
  type TripleChallengeState,
} from "./tripleChallenges";

declare const process: { env: Record<string, string | undefined> };

describe("generateDailyChallenges", () => {
  it("always generates exactly 3 challenges", () => {
    expect(generateDailyChallenges("2026-06-24")).toHaveLength(3);
  });

  it("never generates duplicate challenges on the same day", () => {
    for (const date of ["2026-01-01", "2026-03-15", "2026-12-31", "2027-07-04"]) {
      const ids = generateDailyChallenges(date).map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("only draws from the known template pool", () => {
    const validIds = new Set(TRIPLE_CHALLENGE_TEMPLATES.map((t) => t.id));
    for (const c of generateDailyChallenges("2026-09-09")) {
      expect(validIds.has(c.id)).toBe(true);
    }
  });

  it("is deterministic for a given date", () => {
    expect(generateDailyChallenges("2026-06-24")).toEqual(generateDailyChallenges("2026-06-24"));
  });

  it("produces different sets across different dates (not always the same 3)", () => {
    const sets = new Set(
      ["2026-01-01", "2026-02-02", "2026-03-03", "2026-04-04", "2026-05-05", "2026-06-06"].map((d) =>
        JSON.stringify(generateDailyChallenges(d).map((c) => c.id)),
      ),
    );
    expect(sets.size).toBeGreaterThan(1);
  });

  it("starts every challenge at zero progress, incomplete, with the daily reward", () => {
    for (const c of generateDailyChallenges("2026-06-24")) {
      expect(c.progress).toBe(0);
      expect(c.completed).toBe(false);
      expect(c.xpAwarded).toBe(false);
      expect(c.xpReward).toBe(50);
    }
  });
});

describe("ensureTodaysChallenges", () => {
  it("generates a fresh set for a brand-new player", () => {
    const { state } = ensureTodaysChallenges(emptyTripleChallengeState(), emptyChallengeStreak(), "2026-06-24");
    expect(state.date).toBe("2026-06-24");
    expect(state.challenges).toHaveLength(3);
  });

  it("returns the same set unchanged if already generated for today", () => {
    const first = ensureTodaysChallenges(emptyTripleChallengeState(), emptyChallengeStreak(), "2026-06-24");
    const second = ensureTodaysChallenges(first.state, first.streak, "2026-06-24");
    expect(second.state).toEqual(first.state);
  });

  it("starts a streak of 1 when yesterday's set was fully completed", () => {
    let { state } = ensureTodaysChallenges(emptyTripleChallengeState(), emptyChallengeStreak(), "2026-06-23");
    state = { ...state, challenges: state.challenges.map((c) => ({ ...c, completed: true })) };
    const { streak } = ensureTodaysChallenges(state, emptyChallengeStreak(), "2026-06-24");
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
    expect(streak.lastCompletedDate).toBe("2026-06-23");
  });

  it("extends the streak across consecutive fully-completed days", () => {
    let streak = emptyChallengeStreak();
    let day1 = ensureTodaysChallenges(emptyTripleChallengeState(), streak, "2026-06-22").state;
    day1 = { ...day1, challenges: day1.challenges.map((c) => ({ ...c, completed: true })) };
    ({ streak } = ensureTodaysChallenges(day1, streak, "2026-06-23"));
    let day2 = ensureTodaysChallenges(day1, streak, "2026-06-23").state;
    day2 = { ...day2, challenges: day2.challenges.map((c) => ({ ...c, completed: true })) };
    const result = ensureTodaysChallenges(day2, streak, "2026-06-24");
    expect(result.streak.currentStreak).toBe(2);
  });

  it("extends the streak correctly regardless of the host machine's local timezone", () => {
    // Regression test for the same UTC/local-date mixing bug as streak.ts —
    // nextDay() must treat "2026-06-22" -> "2026-06-23" as consecutive no
    // matter what timezone the server/browser is running in.
    const originalTz = process.env.TZ;
    try {
      for (const tz of ["America/Los_Angeles", "America/New_York", "UTC", "Asia/Tokyo"]) {
        process.env.TZ = tz;
        let streak = emptyChallengeStreak();
        let day1 = ensureTodaysChallenges(emptyTripleChallengeState(), streak, "2026-06-22").state;
        day1 = { ...day1, challenges: day1.challenges.map((c) => ({ ...c, completed: true })) };
        ({ streak } = ensureTodaysChallenges(day1, streak, "2026-06-23"));
        expect(streak.currentStreak, `timezone ${tz}`).toBe(1);
      }
    } finally {
      process.env.TZ = originalTz;
    }
  });

  it("resets the streak to 0 if yesterday's set was not fully completed", () => {
    const { state } = ensureTodaysChallenges(emptyTripleChallengeState(), emptyChallengeStreak(), "2026-06-23");
    const streakBefore = { ...emptyChallengeStreak(), currentStreak: 4, longestStreak: 4 };
    const { streak } = ensureTodaysChallenges(state, streakBefore, "2026-06-24");
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(4);
  });
});

describe("applyChallengeEvent", () => {
  it("increases progress toward a matching score-based challenge", () => {
    const state = {
      date: "2026-06-24",
      challenges: [
        { id: "score-math" as const, description: "Score 800+ in Mental Math", target: 800, progress: 0, completed: false, xpAwarded: false, xpReward: 50 },
      ],
    };
    const result = applyChallengeEvent(state, { type: "game", gameId: "math", score: 500 });
    expect(result.state.challenges[0].progress).toBe(500);
    expect(result.state.challenges[0].completed).toBe(false);
    expect(result.xpGained).toBe(0);
  });

  it("completes a challenge and awards xp exactly once when the target is reached", () => {
    const state = {
      date: "2026-06-24",
      challenges: [
        { id: "score-math" as const, description: "Score 800+ in Mental Math", target: 800, progress: 0, completed: false, xpAwarded: false, xpReward: 50 },
      ],
    };
    const first = applyChallengeEvent(state, { type: "game", gameId: "math", score: 900 });
    expect(first.state.challenges[0].completed).toBe(true);
    expect(first.xpGained).toBe(50);

    const second = applyChallengeEvent(first.state, { type: "game", gameId: "math", score: 950 });
    expect(second.xpGained).toBe(0);
  });

  it("increments a play-count challenge by 1 per matching game", () => {
    const state: TripleChallengeState = {
      date: "2026-06-24",
      challenges: [
        { id: "reaction-play-3", description: "Complete 3 games of Reaction Grid", target: 3, progress: 0, completed: false, xpAwarded: false, xpReward: 50 },
      ],
    };
    let s = state;
    for (let i = 0; i < 3; i++) {
      ({ state: s } = applyChallengeEvent(s, { type: "game", gameId: "reaction", score: 10 }));
    }
    expect(s.challenges[0].progress).toBe(3);
    expect(s.challenges[0].completed).toBe(true);
  });

  it("ignores events that don't match any challenge", () => {
    const state = {
      date: "2026-06-24",
      challenges: [
        { id: "score-math" as const, description: "Score 800+ in Mental Math", target: 800, progress: 0, completed: false, xpAwarded: false, xpReward: 50 },
      ],
    };
    const result = applyChallengeEvent(state, { type: "game", gameId: "logic", score: 900 });
    expect(result.state).toEqual(state);
    expect(result.xpGained).toBe(0);
  });

  it("tracks puzzle-solved, all-games-challenge, and direction-correct events", () => {
    const state: TripleChallengeState = {
      date: "2026-06-24",
      challenges: [
        { id: "puzzle-5", description: "Complete 5 Chess Puzzles", target: 5, progress: 4, completed: false, xpAwarded: false, xpReward: 50 },
        { id: "all-games-run", description: "Complete an All Games Challenge run", target: 1, progress: 0, completed: false, xpAwarded: false, xpReward: 50 },
        { id: "direction-correct-20", description: "Answer 20 questions correctly in Direction Challenge", target: 20, progress: 19, completed: false, xpAwarded: false, xpReward: 50 },
      ],
    };
    let s = state;
    ({ state: s } = applyChallengeEvent(s, { type: "puzzle-solved" }));
    ({ state: s } = applyChallengeEvent(s, { type: "all-games-challenge" }));
    ({ state: s } = applyChallengeEvent(s, { type: "direction-correct", count: 1 }));
    expect(s.challenges.every((c) => c.completed)).toBe(true);
  });
});
