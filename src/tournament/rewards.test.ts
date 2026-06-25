import { describe, expect, it } from "vitest";
import { EXCLUSIVE_COSMETICS, cosmeticForRank, exclusiveCosmeticsForWeek, xpForRank } from "./rewards";

describe("xpForRank", () => {
  it("matches the spec's XP table", () => {
    expect(xpForRank(1)).toBe(500);
    expect(xpForRank(2)).toBe(350);
    expect(xpForRank(3)).toBe(250);
  });
});

describe("exclusiveCosmeticsForWeek", () => {
  it("always returns 3 distinct cosmetics from the catalog", () => {
    const picks = exclusiveCosmeticsForWeek("2026-06-22");
    expect(picks).toHaveLength(3);
    expect(new Set(picks.map((c) => c.id)).size).toBe(3);
    for (const c of picks) expect(EXCLUSIVE_COSMETICS.map((e) => e.id)).toContain(c.id);
  });

  it("is deterministic for the same week", () => {
    expect(exclusiveCosmeticsForWeek("2026-06-22")).toEqual(exclusiveCosmeticsForWeek("2026-06-22"));
  });

  it("rotates across different weeks", () => {
    const weeks = ["2026-06-22", "2026-06-29", "2026-07-06", "2026-07-13", "2026-07-20"];
    const firstPicks = new Set(weeks.map((w) => exclusiveCosmeticsForWeek(w)[0].id));
    expect(firstPicks.size).toBeGreaterThan(1);
  });
});

describe("cosmeticForRank", () => {
  it("matches the corresponding index from exclusiveCosmeticsForWeek", () => {
    const week = "2026-06-22";
    const all = exclusiveCosmeticsForWeek(week);
    expect(cosmeticForRank(week, 1)).toEqual(all[0]);
    expect(cosmeticForRank(week, 2)).toEqual(all[1]);
    expect(cosmeticForRank(week, 3)).toEqual(all[2]);
  });
});

describe("EXCLUSIVE_COSMETICS catalog", () => {
  it("has unique ids and values", () => {
    const ids = EXCLUSIVE_COSMETICS.map((c) => c.id);
    const values = EXCLUSIVE_COSMETICS.map((c) => c.value);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(values).size).toBe(values.length);
  });

  it("has at least 3 items so a week's top 3 never collide", () => {
    expect(EXCLUSIVE_COSMETICS.length).toBeGreaterThanOrEqual(3);
  });
});
