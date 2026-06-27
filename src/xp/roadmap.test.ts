import { describe, expect, it } from "vitest";
import { totalXpForLevel } from "./levels";
import { buildLevelRoadmap } from "./roadmap";

describe("buildLevelRoadmap", () => {
  const roadmap = buildLevelRoadmap(totalXpForLevel);

  it("covers exactly levels 1 through 100, in order", () => {
    expect(roadmap).toHaveLength(100);
    expect(roadmap[0].level).toBe(1);
    expect(roadmap[99].level).toBe(100);
    roadmap.forEach((entry, i) => expect(entry.level).toBe(i + 1));
  });

  it("matches the XP milestones from the spec", () => {
    expect(roadmap[9].xpRequired).toBe(450); // level 10
    expect(roadmap[49].xpRequired).toBe(12250); // level 50
    expect(roadmap[99].xpRequired).toBe(49500); // level 100
  });

  it("includes the known existing unlocks at the right levels", () => {
    const byLevel = (n: number) => roadmap.find((r) => r.level === n)!;
    expect(byLevel(5).unlocks.some((u) => u.includes("Mohawk"))).toBe(true);
    expect(byLevel(10).unlocks.some((u) => u.includes("Bronze"))).toBe(true);
    expect(byLevel(50).unlocks.some((u) => u.includes("Diamond") && u.includes("Skin"))).toBe(true);
    expect(byLevel(100).unlocks.some((u) => u.includes("Legend"))).toBe(true);
  });

  it("includes pet accessory unlocks at the right levels", () => {
    const byLevel = (n: number) => roadmap.find((r) => r.level === n)!;
    expect(byLevel(5).unlocks.some((u) => u.includes("Pet accessory: Bow Tie"))).toBe(true);
    expect(byLevel(100).unlocks.some((u) => u.includes("Pet accessory: Golden Crown"))).toBe(true);
  });

  it("never lists an exclusive (tournament-only) item as a level unlock", () => {
    for (const entry of roadmap) {
      expect(entry.unlocks.some((u) => u.includes("Champion") && u.includes("Varsity"))).toBe(false);
    }
  });

  it("leaves most levels with no unlocks (they're spread out, not every level)", () => {
    const withUnlocks = roadmap.filter((r) => r.unlocks.length > 0).length;
    expect(withUnlocks).toBeLessThan(100);
    expect(withUnlocks).toBeGreaterThan(0);
  });
});
