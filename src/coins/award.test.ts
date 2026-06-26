import { describe, expect, it } from "vitest";
import { createProfile } from "../player/storage";
import { awardCoins, coinsForGameResult, coinsForLevel, coinsForRank, coinsOwedForLevelUp } from "./award";

const HASH = "hash";
const SALT = "salt";

describe("coinsForGameResult", () => {
  it("awards the base amount for an ordinary completion", () => {
    expect(coinsForGameResult(500, false)).toBe(10);
  });

  it("adds a bonus for scoring 1000+", () => {
    expect(coinsForGameResult(1000, false)).toBe(20);
  });

  it("adds a bonus for a new personal best", () => {
    expect(coinsForGameResult(500, true)).toBe(35);
  });

  it("stacks both bonuses", () => {
    expect(coinsForGameResult(1500, true)).toBe(45);
  });
});

describe("coinsForRank", () => {
  it("matches the spec's coin table", () => {
    expect(coinsForRank(1)).toBe(300);
    expect(coinsForRank(2)).toBe(200);
    expect(coinsForRank(3)).toBe(100);
  });
});

describe("awardCoins", () => {
  it("does nothing for a zero or negative amount", () => {
    const profile = createProfile("Alice", HASH, SALT);
    expect(awardCoins(profile, 0)).toBe(profile);
    expect(awardCoins(profile, -5)).toBe(profile);
  });

  it("adds to the existing balance", () => {
    // a fresh profile already starts with coinsForLevel(1) = 5 from leveling
    const profile = createProfile("Alice", HASH, SALT);
    const start = profile.coins;
    const updated = awardCoins(profile, 50);
    expect(updated.coins).toBe(start + 50);
    expect(awardCoins(updated, 25).coins).toBe(start + 75);
  });
});

describe("coinsForLevel", () => {
  it("matches the spec's examples exactly", () => {
    expect(coinsForLevel(1)).toBe(5);
    expect(coinsForLevel(10)).toBe(50);
    expect(coinsForLevel(20)).toBe(100);
  });

  it("totals 250 across the first 50 levels", () => {
    expect(coinsForLevel(50)).toBe(250);
  });

  it("totals another 500 across the last 50 levels, 750 by level 100", () => {
    expect(coinsForLevel(51)).toBe(260); // 250 + one level at the new 10/level rate
    expect(coinsForLevel(100)).toBe(750);
  });

  it("never goes negative for level 0 or below", () => {
    expect(coinsForLevel(0)).toBe(0);
    expect(coinsForLevel(-5)).toBe(0);
  });
});

describe("coinsOwedForLevelUp", () => {
  it("is zero when there's no actual level gain", () => {
    expect(coinsOwedForLevelUp(20, 20)).toBe(0);
    expect(coinsOwedForLevelUp(20, 19)).toBe(0);
  });

  it("retroactively grants the full amount for a never-before-paid level", () => {
    // matches the spec: a level-20 player who's never been paid should get 100
    expect(coinsOwedForLevelUp(0, 20)).toBe(100);
    expect(coinsOwedForLevelUp(0, 10)).toBe(50);
  });

  it("only pays the difference once some levels have already been granted", () => {
    expect(coinsOwedForLevelUp(20, 25)).toBe(25);
    expect(coinsOwedForLevelUp(49, 51)).toBe(5 + 10);
  });
});
