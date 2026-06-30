import { describe, expect, it } from "vitest";
import { PET_SHAPES, shapeFor, shapeForSeasonPetId } from "./shapes";
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

describe("shapeForSeasonPetId", () => {
  it("colors a season-exclusive pet from its actual season theme, not a fixed color", () => {
    const neonFox = shapeForSeasonPetId("neon-t5-pet")!;
    const spaceFox = shapeForSeasonPetId("space-t5-pet")!;
    expect(neonFox.color).not.toBe(spaceFox.color);
  });

  it("differs from the regular catalog fox's color", () => {
    const neonFox = shapeForSeasonPetId("neon-t5-pet")!;
    expect(neonFox.color).not.toBe(PET_SHAPES.fox.color);
  });

  it("keeps the right archetype silhouette per tier", () => {
    expect(shapeForSeasonPetId("neon-t5-pet")!.tailShape).toBe(PET_SHAPES.seasonFox.tailShape);
    expect(shapeForSeasonPetId("neon-t40-pet")!.extras).toContain("wings");
    expect(shapeForSeasonPetId("neon-t85-pet")!.extras).toContain("beak");
  });

  it("returns undefined for a non-season-pet id", () => {
    expect(shapeForSeasonPetId("golden-retriever")).toBeUndefined();
  });

  it("shapeFor resolves season pet ids through to the themed shape", () => {
    const viaShapeFor = shapeFor("neon-t5-pet");
    const direct = shapeForSeasonPetId("neon-t5-pet");
    expect(viaShapeFor).toEqual(direct);
  });
});
