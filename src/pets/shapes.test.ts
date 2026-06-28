import { describe, expect, it } from "vitest";
import { PET_SHAPES, shapeFor } from "./shapes";
import { PET_CATALOG } from "./catalog";

describe("PET_SHAPES", () => {
  it("has a shape entry for every catalog species", () => {
    for (const pet of PET_CATALOG) {
      expect(PET_SHAPES[pet.species]).toBeDefined();
    }
  });

  it("gives different species visibly different colors (not all the same blob)", () => {
    expect(PET_SHAPES.goldenRetriever.color).not.toBe(PET_SHAPES.fox.color);
    expect(PET_SHAPES.babyDragon.color).not.toBe(PET_SHAPES.goldenRetriever.color);
  });

  it("gives flying species wings", () => {
    expect(PET_SHAPES.babyDragon.extras).toContain("wings");
    expect(PET_SHAPES.phoenix.extras).toContain("wings");
    expect(PET_SHAPES.owl.extras).toContain("wings");
  });

  it("has shapes for every season-exclusive pet archetype", () => {
    expect(PET_SHAPES.seasonFox).toBeDefined();
    expect(PET_SHAPES.seasonDragon).toBeDefined();
    expect(PET_SHAPES.seasonPhoenix).toBeDefined();
    expect(PET_SHAPES.seasonLion).toBeDefined();
  });
});

describe("shapeFor", () => {
  it("returns the matching shape for a known species", () => {
    expect(shapeFor("fox").earShape).toBe("pointy");
  });

  it("falls back to a default shape for an unknown key", () => {
    expect(shapeFor("not-a-real-species")).toBeDefined();
  });
});
