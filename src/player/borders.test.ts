import { describe, expect, it } from "vitest";
import { BORDERS, getBorderDef, sanitizeBorder, unlockedBorders } from "./borders";

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
});
