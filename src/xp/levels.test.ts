import { describe, expect, it } from "vitest";
import { levelForTotalXp, titleColors, titleForLevel, totalXpForLevel, unlockedTitles, xpForNextLevel } from "./levels";

describe("xpForNextLevel", () => {
  it("matches the level * 10 formula", () => {
    expect(xpForNextLevel(1)).toBe(10);
    expect(xpForNextLevel(2)).toBe(20);
    expect(xpForNextLevel(3)).toBe(30);
    expect(xpForNextLevel(10)).toBe(100);
    expect(xpForNextLevel(25)).toBe(250);
    expect(xpForNextLevel(50)).toBe(500);
  });
});

describe("totalXpForLevel", () => {
  it("matches the spec's approximate total XP milestones", () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(10)).toBe(450);
    expect(totalXpForLevel(25)).toBe(3000);
    expect(totalXpForLevel(50)).toBe(12250);
    expect(totalXpForLevel(75)).toBe(27750);
    expect(totalXpForLevel(100)).toBe(49500);
  });
});

describe("levelForTotalXp", () => {
  it("starts every player at level 1 with 0 xp", () => {
    expect(levelForTotalXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 10, totalXp: 0 });
  });

  it("stays at level 1 until 10 xp is reached", () => {
    expect(levelForTotalXp(9).level).toBe(1);
    expect(levelForTotalXp(9).xpIntoLevel).toBe(9);
  });

  it("advances to level 2 at exactly 10 xp", () => {
    const info = levelForTotalXp(10);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.xpForNextLevel).toBe(20);
  });

  it("computes level and progress correctly partway through a level", () => {
    // totalXpForLevel(10) = 450, level 10 needs 100 to reach 11
    const info = levelForTotalXp(480);
    expect(info.level).toBe(10);
    expect(info.xpIntoLevel).toBe(30);
    expect(info.xpForNextLevel).toBe(100);
  });

  it("reaches level 100 at exactly the milestone total", () => {
    expect(levelForTotalXp(49500).level).toBe(100);
  });

  it("never returns a level below 1, even for negative input", () => {
    expect(levelForTotalXp(-50).level).toBe(1);
    expect(levelForTotalXp(-50).xpIntoLevel).toBe(0);
  });
});

describe("titles", () => {
  it("starts every player with the Rookie title", () => {
    expect(titleForLevel(1)).toBe("Rookie");
    expect(unlockedTitles(1)).toEqual(["Rookie"]);
  });

  it("unlocks new titles at their thresholds", () => {
    expect(titleForLevel(5)).toBe("Challenger");
    expect(titleForLevel(10)).toBe("Competitor");
    expect(titleForLevel(20)).toBe("Strategist");
    expect(titleForLevel(35)).toBe("Brain Trainer");
    expect(titleForLevel(50)).toBe("Master Mind");
    expect(titleForLevel(75)).toBe("Grandmaster");
    expect(titleForLevel(100)).toBe("Legend");
  });

  it("keeps the highest unlocked title between thresholds", () => {
    expect(titleForLevel(7)).toBe("Challenger");
    expect(titleForLevel(34)).toBe("Strategist");
  });

  it("accumulates every unlocked title in order, not just the latest", () => {
    expect(unlockedTitles(20)).toEqual(["Rookie", "Challenger", "Competitor", "Strategist"]);
  });
});

describe("titleColors", () => {
  it("gives every title its own distinct color pair", () => {
    const pairs = ["Rookie", "Challenger", "Competitor", "Strategist", "Brain Trainer", "Master Mind", "Grandmaster", "Legend"]
      .map((t) => titleColors(t).join(","));
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("falls back to the Rookie color for an unrecognized title", () => {
    expect(titleColors("Not A Real Title")).toEqual(titleColors("Rookie"));
  });
});
