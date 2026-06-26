import { describe, expect, it } from "vitest";
import { PET_CATALOG, getPetDef } from "./catalog";
import { RARITY_LABELS, RARITY_ORDER, PET_EMOJI } from "./rarity";

describe("PET_CATALOG", () => {
  it("has exactly 20 starter pets", () => {
    expect(PET_CATALOG).toHaveLength(20);
  });

  it("has 4 pets per rarity tier", () => {
    for (const rarity of RARITY_ORDER) {
      expect(PET_CATALOG.filter((p) => p.rarity === rarity)).toHaveLength(4);
    }
  });

  it("has unique ids and names", () => {
    const ids = PET_CATALOG.map((p) => p.id);
    const names = PET_CATALOG.map((p) => p.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has a positive, rarity-appropriate price for every pet", () => {
    const maxByRarity: Record<string, number> = { common: 350, uncommon: 700, rare: 1250, epic: 2500, legendary: 6000 };
    const minByRarity: Record<string, number> = { common: 300, uncommon: 600, rare: 1000, epic: 2000, legendary: 4000 };
    for (const pet of PET_CATALOG) {
      expect(pet.price).toBeGreaterThanOrEqual(minByRarity[pet.rarity]);
      expect(pet.price).toBeLessThanOrEqual(maxByRarity[pet.rarity]);
    }
  });

  it("matches the exact spec prices for a few known pets", () => {
    expect(getPetDef("golden-retriever")?.price).toBe(300);
    expect(getPetDef("baby-tiger")?.price).toBe(1250);
    expect(getPetDef("galaxy-dragon")?.price).toBe(6000);
  });

  it("has an emoji defined for every species in the catalog", () => {
    for (const pet of PET_CATALOG) {
      expect(PET_EMOJI[pet.species]).toBeTruthy();
    }
  });

  it("getPetDef returns undefined for an unknown id", () => {
    expect(getPetDef("not-a-real-pet")).toBeUndefined();
  });
});

describe("RARITY_LABELS", () => {
  it("has a label for every rarity tier", () => {
    for (const rarity of RARITY_ORDER) {
      expect(RARITY_LABELS[rarity]).toBeTruthy();
    }
  });
});
