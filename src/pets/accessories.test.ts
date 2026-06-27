import { describe, expect, it } from "vitest";
import {
  MAX_PET_ACCESSORY_SLOTS,
  PET_ACCESSORIES,
  getPetAccessoryDef,
  sanitizePetAccessories,
  unlockedPetAccessories,
} from "./accessories";

describe("unlockedPetAccessories", () => {
  it("returns nothing below the first unlock level", () => {
    expect(unlockedPetAccessories(1)).toEqual([]);
  });

  it("returns everything at level 100", () => {
    expect(unlockedPetAccessories(100)).toHaveLength(PET_ACCESSORIES.length);
  });

  it("only includes accessories unlocked at or below the given level", () => {
    const unlocked = unlockedPetAccessories(25);
    expect(unlocked.every((a) => a.unlockLevel <= 25)).toBe(true);
    expect(unlocked.some((a) => a.id === "sunglasses")).toBe(true);
    expect(unlocked.some((a) => a.id === "cape")).toBe(false);
  });
});

describe("sanitizePetAccessories", () => {
  it("returns an empty array for non-array input", () => {
    expect(sanitizePetAccessories(undefined, 100)).toEqual([]);
    expect(sanitizePetAccessories(null, 100)).toEqual([]);
  });

  it("drops accessories not yet unlocked at the player's level", () => {
    expect(sanitizePetAccessories(["bowTie", "goldenCrown"], 5)).toEqual(["bowTie"]);
  });

  it("dedupes repeated ids", () => {
    expect(sanitizePetAccessories(["bowTie", "bowTie"], 100)).toEqual(["bowTie"]);
  });

  it("drops unknown ids", () => {
    expect(sanitizePetAccessories(["not-a-real-accessory"], 100)).toEqual([]);
  });

  it("caps at MAX_PET_ACCESSORY_SLOTS", () => {
    const allIds = PET_ACCESSORIES.map((a) => a.id);
    expect(sanitizePetAccessories(allIds, 100)).toHaveLength(MAX_PET_ACCESSORY_SLOTS);
  });
});

describe("getPetAccessoryDef", () => {
  it("returns undefined for an unknown id", () => {
    expect(getPetAccessoryDef("nope")).toBeUndefined();
  });

  it("returns the matching def for a known id", () => {
    expect(getPetAccessoryDef("halo")?.emoji).toBe("😇");
  });
});
