import { describe, expect, it } from "vitest";
import { createProfile } from "../player/storage";
import { claimTournamentRewards, isBadgeActive } from "./claim";
import { cosmeticForRank } from "./rewards";
import type { TournamentHistoryEntry } from "./types";

const HASH = "hash";
const SALT = "salt";

function historyEntry(overrides: Partial<TournamentHistoryEntry> = {}): TournamentHistoryEntry {
  return {
    weekStart: "2026-06-22",
    weekEnd: "2026-06-28",
    gameId: "memory",
    first: { username: "Alice", score: 900 },
    second: { username: "Bob", score: 800 },
    third: { username: "Carol", score: 700 },
    finalizedAt: "2026-06-29T00:00:00.000Z",
    ...overrides,
  };
}

describe("claimTournamentRewards", () => {
  it("awards 1st-place XP, the rank-1 cosmetic, and a champion badge", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const entry = historyEntry();
    const { profile: updated, newlyClaimed } = claimTournamentRewards(profile, [entry]);

    expect(updated.xp).toBe(500);
    expect(updated.exclusiveCosmetics).toContain(cosmeticForRank(entry.weekStart, 1).value);
    expect(updated.tournamentStats.weeklyWins).toBe(1);
    expect(updated.tournamentStats.top3Finishes).toBe(1);
    expect(updated.tournamentStats.bestRank).toBe(1);
    expect(updated.tournamentStats.totalTournamentXp).toBe(500);
    expect(updated.weeklyBadge?.type).toBe("champion");
    expect(updated.claimedTournamentWeeks).toContain(entry.weekStart);
    expect(newlyClaimed).toEqual([{ weekStart: entry.weekStart, rank: 1 }]);
  });

  it("awards 2nd and 3rd place correctly with a finalist badge", () => {
    const bob = createProfile("Bob", HASH, SALT);
    const entry = historyEntry();
    const { profile: updatedBob } = claimTournamentRewards(bob, [entry]);
    expect(updatedBob.xp).toBe(350);
    expect(updatedBob.weeklyBadge?.type).toBe("finalist");
    expect(updatedBob.tournamentStats.bestRank).toBe(2);

    const carol = createProfile("Carol", HASH, SALT);
    const { profile: updatedCarol } = claimTournamentRewards(carol, [entry]);
    expect(updatedCarol.xp).toBe(250);
    expect(updatedCarol.tournamentStats.bestRank).toBe(3);
  });

  it("does nothing for a player who didn't place top 3", () => {
    const dave = createProfile("Dave", HASH, SALT);
    const { profile: updated, newlyClaimed } = claimTournamentRewards(dave, [historyEntry()]);
    expect(updated.xp).toBe(0);
    expect(updated).toEqual(dave);
    expect(newlyClaimed).toEqual([]);
  });

  it("never double-awards a week that's already been claimed", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const entry = historyEntry();
    const first = claimTournamentRewards(profile, [entry]).profile;
    const second = claimTournamentRewards(first, [entry]);
    expect(second.profile).toEqual(first);
    expect(second.newlyClaimed).toEqual([]);
  });

  it("tracks bestRank as the best (lowest number) across multiple wins", () => {
    let profile = createProfile("Alice", HASH, SALT);
    ({ profile } = claimTournamentRewards(profile, [
      historyEntry({ weekStart: "2026-06-22", first: null, second: { username: "Alice", score: 1 }, third: null }),
    ]));
    expect(profile.tournamentStats.bestRank).toBe(2);
    ({ profile } = claimTournamentRewards(profile, [
      historyEntry({ weekStart: "2026-06-29", first: { username: "Alice", score: 1 }, second: null, third: null }),
    ]));
    expect(profile.tournamentStats.bestRank).toBe(1);
  });

  it("processes multiple unclaimed weeks in one call", () => {
    const profile = createProfile("Alice", HASH, SALT);
    const week1 = historyEntry({ weekStart: "2026-06-22" });
    const week2 = historyEntry({ weekStart: "2026-06-29", gameId: "math" });
    const { profile: updated, newlyClaimed } = claimTournamentRewards(profile, [week1, week2]);
    expect(updated.tournamentStats.weeklyWins).toBe(2);
    expect(newlyClaimed).toHaveLength(2);
  });
});

describe("isBadgeActive", () => {
  it("is active before expiry and inactive after", () => {
    const badge = { expiresAt: "2026-07-01T00:00:00.000Z" };
    expect(isBadgeActive(badge, Date.parse("2026-06-30T00:00:00.000Z"))).toBe(true);
    expect(isBadgeActive(badge, Date.parse("2026-07-02T00:00:00.000Z"))).toBe(false);
  });

  it("is false for null", () => {
    expect(isBadgeActive(null)).toBe(false);
  });
});
