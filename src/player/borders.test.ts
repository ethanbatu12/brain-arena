import { describe, expect, it } from "vitest";
import { BORDERS, equippableBorders, getBorderDef, ownedSeasonBorders, sanitizeBorder, unlockedBorders } from "./borders";

const SEASON_BORDER_ID = "neon-t30-border";

describe("border catalog", () => {
  it("has unique ids", () => {
    const ids = BORDERS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches the spec's unlock levels", () => {
    const byId = Object.fromEntries(BORDERS.map((b) => [b.id, b.unlockLevel]));
    expect(byId.bronze).toBe(10);
    expect(byId.silver).toBe(20);
    expect(byId.gold).toBe(35);
    expect(byId.diamond).toBe(50);
    expect(byId.master).toBe(75);
    expect(byId.legend).toBe(100);
  });
});

describe("isBorderUnlocked / unlockedBorders", () => {
  it("everyone has 'none' unlocked from the start", () => {
    expect(unlockedBorders(1).map((b) => b.id)).toEqual(["none"]);
  });

  it("unlocks progressively as level rises", () => {
    expect(unlockedBorders(35).map((b) => b.id)).toEqual(["none", "bronze", "silver", "gold"]);
  });

  it("unlocks every border at level 100", () => {
    expect(unlockedBorders(100)).toHaveLength(BORDERS.length);
  });
});

describe("sanitizeBorder", () => {
  it("falls back to none for an unrecognized id", () => {
    expect(sanitizeBorder("not-a-border", 100)).toBe("none");
  });

  it("falls back to none if the player is below the required level", () => {
    expect(sanitizeBorder("gold", 10)).toBe("none");
  });

  it("keeps a valid, currently-unlocked border", () => {
    expect(sanitizeBorder("silver", 20)).toBe("silver");
  });

  it("falls back to none for non-string input", () => {
    expect(sanitizeBorder(undefined, 100)).toBe("none");
    expect(sanitizeBorder(42, 100)).toBe("none");
  });
});

describe("getBorderDef", () => {
  it("looks up a known border", () => {
    expect(getBorderDef("gold").label).toBe("Gold Border");
  });

  it("falls back to 'none' for unknown ids", () => {
    expect(getBorderDef("bogus").id).toBe("none");
  });

  it("resolves a claimed Season Pass border when owned", () => {
    const def = getBorderDef(SEASON_BORDER_ID, [SEASON_BORDER_ID]);
    expect(def.id).toBe(SEASON_BORDER_ID);
    expect(def.label).toBe("Neon Border");
  });

  it("falls back to 'none' for a season border id that isn't actually owned", () => {
    expect(getBorderDef(SEASON_BORDER_ID, []).id).toBe("none");
  });
});

describe("ownedSeasonBorders / equippableBorders", () => {
  it("turns claimed border-type Season Pass rewards into equippable borders", () => {
    const owned = ownedSeasonBorders([SEASON_BORDER_ID, "neon-t5-pet", "neon-t10-animatedNameColor"]);
    expect(owned.map((b) => b.id).sort()).toEqual([SEASON_BORDER_ID, "neon-t10-animatedNameColor"].sort());
  });

  it("ignores non-border claimed cosmetics", () => {
    expect(ownedSeasonBorders(["neon-t5-pet", "neon-t20-clothing"])).toEqual([]);
  });

  it("equippableBorders combines level-unlocked and season-claimed borders", () => {
    const result = equippableBorders(1, [SEASON_BORDER_ID]);
    expect(result.map((b) => b.id)).toEqual(["none", SEASON_BORDER_ID]);
  });
});

describe("sanitizeBorder with Season Pass borders", () => {
  it("keeps a claimed season border id", () => {
    expect(sanitizeBorder(SEASON_BORDER_ID, 1, [SEASON_BORDER_ID])).toBe(SEASON_BORDER_ID);
  });

  it("falls back to none if the season border isn't actually owned", () => {
    expect(sanitizeBorder(SEASON_BORDER_ID, 100, [])).toBe("none");
  });
});
