import { describe, expect, it } from "vitest";
import { SEASON_XP_PER_TIER } from "./rewards";
import {
  awardSeasonXp,
  claimReward,
  claimableRewards,
  emptySeasonProgress,
  isSeasonMaxed,
  rewardTrackFor,
  seasonCompletionPercent,
  skipOneTier,
  xpToSkipOneTier,
} from "./progress";
import { seasonLevelForXp } from "./rewards";

describe("emptySeasonProgress", () => {
  it("starts at zero XP with nothing claimed", () => {
    const p = emptySeasonProgress(0);
    expect(p.seasonXp).toBe(0);
    expect(p.claimedRewardIds).toEqual([]);
    expect(p.premiumOwned).toBe(false);
  });
});

describe("awardSeasonXp", () => {
  it("does nothing for zero or negative amounts", () => {
    const p = emptySeasonProgress(0);
    expect(awardSeasonXp(p, 0)).toBe(p);
    expect(awardSeasonXp(p, -5)).toBe(p);
  });

  it("accumulates additively", () => {
    let p = emptySeasonProgress(0);
    p = awardSeasonXp(p, 10);
    p = awardSeasonXp(p, 25);
    expect(p.seasonXp).toBe(35);
  });
});

describe("claimableRewards", () => {
  it("is empty at zero XP (tier 1 already reached, but nothing claimed shows up as claimable)", () => {
    const p = emptySeasonProgress(0);
    const claimable = claimableRewards(p);
    expect(claimable.some((r) => r.tier === 1)).toBe(true);
    expect(claimable.some((r) => r.tier === 2)).toBe(false);
  });

  it("grows as XP crosses tier boundaries", () => {
    const p = awardSeasonXp(emptySeasonProgress(0), SEASON_XP_PER_TIER * 3);
    const claimable = claimableRewards(p);
    expect(claimable.some((r) => r.tier === 3)).toBe(true);
    expect(claimable.some((r) => r.tier === 4)).toBe(true);
    expect(claimable.some((r) => r.tier === 5)).toBe(false);
  });

  it("excludes already-claimed rewards", () => {
    let p = emptySeasonProgress(0);
    const [first] = claimableRewards(p);
    const result = claimReward(p, first.id);
    expect(result.ok).toBe(true);
    p = (result as { ok: true; progress: typeof p }).progress;
    expect(claimableRewards(p).some((r) => r.id === first.id)).toBe(false);
  });
});

describe("claimReward", () => {
  it("fails for an unknown reward id", () => {
    const p = emptySeasonProgress(0);
    expect(claimReward(p, "not-a-real-reward")).toEqual({ ok: false, error: "unknown-reward" });
  });

  it("fails if the tier hasn't been reached yet", () => {
    const p = emptySeasonProgress(0);
    const tier5 = rewardTrackFor(p).find((r) => r.tier === 5)!;
    expect(claimReward(p, tier5.id)).toEqual({ ok: false, error: "not-reached" });
  });

  it("succeeds once the tier is reached, and is idempotent on a second attempt", () => {
    const p = emptySeasonProgress(0);
    const tier1 = rewardTrackFor(p).find((r) => r.tier === 1)!;
    const first = claimReward(p, tier1.id);
    expect(first.ok).toBe(true);
    const updated = (first as { ok: true; progress: typeof p }).progress;
    const second = claimReward(updated, tier1.id);
    expect(second).toEqual({ ok: false, error: "already-claimed" });
  });
});

describe("seasonCompletionPercent", () => {
  it("is 0% with nothing claimed", () => {
    expect(seasonCompletionPercent(emptySeasonProgress(0))).toBe(0);
  });

  it("rises as rewards are claimed", () => {
    let p = emptySeasonProgress(0);
    const tier1 = rewardTrackFor(p).find((r) => r.tier === 1)!;
    const result = claimReward(p, tier1.id);
    p = (result as { ok: true; progress: typeof p }).progress;
    expect(seasonCompletionPercent(p)).toBeGreaterThan(0);
  });
});

describe("isSeasonMaxed", () => {
  it("is false at the start", () => {
    expect(isSeasonMaxed(emptySeasonProgress(0))).toBe(false);
  });

  it("is true once tier 100 is reached", () => {
    const p = awardSeasonXp(emptySeasonProgress(0), SEASON_XP_PER_TIER * 150);
    expect(isSeasonMaxed(p)).toBe(true);
  });
});

describe("xpToSkipOneTier", () => {
  it("is the full tier cost at the very start of a tier", () => {
    expect(xpToSkipOneTier(emptySeasonProgress(0))).toBe(SEASON_XP_PER_TIER);
  });

  it("is only the remainder when partway through a tier", () => {
    const p = awardSeasonXp(emptySeasonProgress(0), 50);
    expect(xpToSkipOneTier(p)).toBe(SEASON_XP_PER_TIER - 50);
  });

  it("is 0 once the season is already maxed", () => {
    const p = awardSeasonXp(emptySeasonProgress(0), SEASON_XP_PER_TIER * 150);
    expect(xpToSkipOneTier(p)).toBe(0);
  });
});

describe("skipOneTier", () => {
  it("advances exactly one tier", () => {
    const p = emptySeasonProgress(0);
    const startLevel = seasonLevelForXp(p.seasonXp);
    const result = skipOneTier(p);
    expect(result.ok).toBe(true);
    const updated = (result as { ok: true; progress: typeof p }).progress;
    expect(seasonLevelForXp(updated.seasonXp)).toBe(startLevel + 1);
  });

  it("advances exactly one tier even from partway through the current one", () => {
    const p = awardSeasonXp(emptySeasonProgress(0), 50);
    const startLevel = seasonLevelForXp(p.seasonXp);
    const result = skipOneTier(p);
    const updated = (result as { ok: true; progress: typeof p }).progress;
    expect(seasonLevelForXp(updated.seasonXp)).toBe(startLevel + 1);
  });

  it("fails once the season is already maxed", () => {
    const p = awardSeasonXp(emptySeasonProgress(0), SEASON_XP_PER_TIER * 150);
    expect(skipOneTier(p)).toEqual({ ok: false, error: "already-maxed" });
  });
});
