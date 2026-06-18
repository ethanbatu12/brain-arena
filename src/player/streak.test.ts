import { describe, expect, it } from "vitest";
import { emptyStreak, updateStreak } from "./streak";

describe("emptyStreak", () => {
  it("returns zeroed streak with no last-played date", () => {
    const s = emptyStreak();
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.lastPlayedDate).toBeNull();
  });
});

describe("updateStreak", () => {
  it("initialises streak to 1 on the first play", () => {
    const s = updateStreak(emptyStreak(), "2025-01-01");
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(1);
    expect(s.lastPlayedDate).toBe("2025-01-01");
  });

  it("is idempotent — playing twice on the same day keeps the streak unchanged", () => {
    const s1 = updateStreak(emptyStreak(), "2025-01-01");
    const s2 = updateStreak(s1, "2025-01-01");
    expect(s2).toBe(s1); // same reference
  });

  it("extends streak by 1 on consecutive days", () => {
    let s = updateStreak(emptyStreak(), "2025-01-01");
    s = updateStreak(s, "2025-01-02");
    expect(s.currentStreak).toBe(2);
    expect(s.longestStreak).toBe(2);
    s = updateStreak(s, "2025-01-03");
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it("resets current streak to 1 after missing a day, but keeps longestStreak", () => {
    let s = updateStreak(emptyStreak(), "2025-01-01");
    s = updateStreak(s, "2025-01-02");
    s = updateStreak(s, "2025-01-02"); // idempotent
    // Skip a day
    s = updateStreak(s, "2025-01-04");
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(2); // preserved from before the break
    expect(s.lastPlayedDate).toBe("2025-01-04");
  });

  it("updates longestStreak when the new streak surpasses the old record", () => {
    let s = updateStreak(emptyStreak(), "2025-01-01");
    s = updateStreak(s, "2025-01-02");
    s = updateStreak(s, "2025-01-03"); // longest = 3
    // break
    s = updateStreak(s, "2025-01-05"); // reset to 1
    expect(s.longestStreak).toBe(3);
    // now build a longer streak
    s = updateStreak(s, "2025-01-06");
    s = updateStreak(s, "2025-01-07");
    s = updateStreak(s, "2025-01-08"); // current = 4
    expect(s.currentStreak).toBe(4);
    expect(s.longestStreak).toBe(4);
  });

  it("handles month boundaries correctly", () => {
    let s = updateStreak(emptyStreak(), "2025-01-31");
    s = updateStreak(s, "2025-02-01");
    expect(s.currentStreak).toBe(2);
  });

  it("handles year boundaries correctly", () => {
    let s = updateStreak(emptyStreak(), "2024-12-31");
    s = updateStreak(s, "2025-01-01");
    expect(s.currentStreak).toBe(2);
  });
});
