import { describe, expect, it } from "vitest";
import {
  SEASON_TIER_COUNT,
  SEASON_XP_PER_TIER,
  bonusFinaleRewards,
  buildSeasonRewardTrack,
  emojiForSeasonPetId,
  seasonLevelForXp,
  xpIntoCurrentTier,
} from "./rewards";

describe("buildSeasonRewardTrack", () => {
  const track = buildSeasonRewardTrack("space", "Space Season");

  it("has exactly 100 tiers, one entry each, in order", () => {
    expect(track).toHaveLength(SEASON_TIER_COUNT);
    track.forEach((r, i) => expect(r.tier).toBe(i + 1));
  });

  it("every tier rewards something (no empty tiers)", () => {
    for (const reward of track) {
      expect(reward.label.length).toBeGreaterThan(0);
    }
  });

  it("matches the spec's milestone tiers", () => {
    const byTier = (n: number) => track.find((r) => r.tier === n)!;
    expect(byTier(1).kind).toBe("coins");
    expect(byTier(3).kind).toBe("banner");
    expect(byTier(5).kind).toBe("pet");
    expect(byTier(10).kind).toBe("animatedNameColor");
    expect(byTier(20).kind).toBe("clothing");
    expect(byTier(30).kind).toBe("border");
    expect(byTier(40).kind).toBe("pet");
    expect(byTier(50).kind).toBe("avatarEffect");
    expect(byTier(75).kind).toBe("accessory");
    expect(byTier(85).kind).toBe("pet");
    expect(byTier(100).kind).toBe("clothing");
  });

  it("themes its border and name-color rewards instead of hardcoding one color for every season", () => {
    const neonTrack = buildSeasonRewardTrack("neon", "Neon Season");
    expect(neonTrack.find((r) => r.tier === 10)!.label).toBe("Animated Neon Name Color");
    expect(neonTrack.find((r) => r.tier === 30)!.label).toBe("Neon Border");

    const winterTrack = buildSeasonRewardTrack("winter", "Winter Season");
    expect(winterTrack.find((r) => r.tier === 10)!.label).toBe("Animated Winter Name Color");
    expect(winterTrack.find((r) => r.tier === 10)!.label).not.toContain("Blue");
  });

  it("has 3 exclusive pet rewards in the main track, each only obtainable through the pass", () => {
    const petRewards = track.filter((r) => r.kind === "pet");
    expect(petRewards).toHaveLength(3);
    expect(petRewards.map((r) => r.tier)).toEqual([5, 40, 85]);
  });

  it("gives every pet reward its own real species emoji, not a generic placeholder", () => {
    const fox = track.find((r) => r.tier === 5)!;
    const dragon = track.find((r) => r.tier === 40)!;
    const phoenix = track.find((r) => r.tier === 85)!;
    expect(fox.emoji).toBe("🦊");
    expect(dragon.emoji).toBe("🐉");
    expect(phoenix.emoji).toBe("🔥");
    // distinct from each other and from a generic paw/sparkle
    expect(new Set([fox.emoji, dragon.emoji, phoenix.emoji]).size).toBe(3);
  });

  it("namespaces every exclusive reward id by theme, so two seasons never collide", () => {
    const spaceTrack = buildSeasonRewardTrack("space", "Space Season");
    const sportsTrack = buildSeasonRewardTrack("sports", "Sports Season");
    const spaceIds = new Set(spaceTrack.map((r) => r.id));
    const sportsIds = new Set(sportsTrack.map((r) => r.id));
    for (const id of spaceIds) expect(sportsIds.has(id)).toBe(false);
  });

  it("has unique ids within a single track", () => {
    const ids = track.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("bonusFinaleRewards", () => {
  it("grants the title, animated border, and an exclusive pet for tier 100", () => {
    const bonus = bonusFinaleRewards("space", "Space Season");
    expect(bonus.some((r) => r.kind === "title")).toBe(true);
    expect(bonus.some((r) => r.kind === "animatedBorder")).toBe(true);
    expect(bonus.some((r) => r.kind === "pet")).toBe(true);
    expect(bonus.every((r) => r.tier === SEASON_TIER_COUNT)).toBe(true);
  });
});

describe("seasonLevelForXp", () => {
  it("starts at level 1 with zero XP", () => {
    expect(seasonLevelForXp(0)).toBe(1);
  });

  it("advances exactly one tier per SEASON_XP_PER_TIER", () => {
    expect(seasonLevelForXp(SEASON_XP_PER_TIER)).toBe(2);
    expect(seasonLevelForXp(SEASON_XP_PER_TIER * 2)).toBe(3);
  });

  it("caps at the max tier even with excess XP", () => {
    expect(seasonLevelForXp(SEASON_XP_PER_TIER * 500)).toBe(SEASON_TIER_COUNT);
  });
});

describe("xpIntoCurrentTier", () => {
  it("resets to 0 right at a tier boundary", () => {
    expect(xpIntoCurrentTier(SEASON_XP_PER_TIER)).toBe(0);
  });

  it("tracks partial progress within a tier", () => {
    expect(xpIntoCurrentTier(SEASON_XP_PER_TIER + 50)).toBe(50);
  });
});

describe("emojiForSeasonPetId", () => {
  it("resolves each exclusive pet's real emoji regardless of theme", () => {
    expect(emojiForSeasonPetId("space-t5-pet")).toBe("🦊");
    expect(emojiForSeasonPetId("winter-t40-pet")).toBe("🐉");
    expect(emojiForSeasonPetId("neon-t85-pet")).toBe("🔥");
    expect(emojiForSeasonPetId("sports-t100-pet")).toBe("🦁");
  });

  it("returns undefined for a non-season-pet id", () => {
    expect(emojiForSeasonPetId("golden-retriever")).toBeUndefined();
  });
});
