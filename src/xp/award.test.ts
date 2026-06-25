import { describe, expect, it } from "vitest";
import { createProfile } from "../player/storage";
import { awardXp } from "./award";

const HASH = "hash";
const SALT = "salt";

describe("awardXp", () => {
  it("does nothing for a zero or negative amount", () => {
    const profile = createProfile("Alice", HASH, SALT);
    expect(awardXp(profile, 0)).toBe(profile);
    expect(awardXp(profile, -5)).toBe(profile);
  });

  it("increases xp and recomputes level", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const updated = awardXp(profile, 10);
    expect(updated.xp).toBe(10);
    expect(updated.level).toBe(2);
  });

  it("tracks XP earned today, starting fresh each new day", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const day1 = Date.UTC(2026, 5, 22, 10, 0, 0);
    let updated = awardXp(profile, 40, day1);
    expect(updated.xpEarnedToday).toEqual({ date: "2026-06-22", amount: 40 });

    updated = awardXp(updated, 25, day1 + 3600_000);
    expect(updated.xpEarnedToday).toEqual({ date: "2026-06-22", amount: 65 });

    const day2 = Date.UTC(2026, 5, 23, 1, 0, 0);
    updated = awardXp(updated, 10, day2);
    expect(updated.xpEarnedToday).toEqual({ date: "2026-06-23", amount: 10 });
  });

  it("tracks XP earned this week, starting fresh each new week", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const monday = Date.UTC(2026, 5, 22, 10, 0, 0); // 2026-06-22 is a Monday
    let updated = awardXp(profile, 40, monday);
    expect(updated.xpEarnedThisWeek).toEqual({ weekStart: "2026-06-22", amount: 40 });

    const wednesday = Date.UTC(2026, 5, 24, 10, 0, 0);
    updated = awardXp(updated, 25, wednesday);
    expect(updated.xpEarnedThisWeek).toEqual({ weekStart: "2026-06-22", amount: 65 });

    const nextMonday = Date.UTC(2026, 5, 29, 10, 0, 0);
    updated = awardXp(updated, 10, nextMonday);
    expect(updated.xpEarnedThisWeek).toEqual({ weekStart: "2026-06-29", amount: 10 });
  });
});
