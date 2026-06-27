import { describe, expect, it } from "vitest";
import {
  PET_RENAME_COST,
  applyRename,
  containsProfanity,
  defaultPetName,
  emptyPetNameRecord,
  petDisplayName,
  renameCost,
  validatePetName,
} from "./naming";

describe("defaultPetName", () => {
  it("matches the pet's catalog display name", () => {
    expect(defaultPetName("golden-retriever")).toBe("Golden Retriever");
    expect(defaultPetName("baby-dragon")).toBe("Baby Dragon");
    expect(defaultPetName("robot-companion")).toBe("Robot Companion");
  });

  it("falls back to a generic name for an unknown pet id", () => {
    expect(defaultPetName("not-a-real-pet")).toBe("Pet");
  });
});

describe("emptyPetNameRecord", () => {
  it("starts unrenamed with the default name", () => {
    expect(emptyPetNameRecord("black-cat")).toEqual({
      name: "Black Cat",
      renameCount: 0,
      freeRenameUsed: false,
    });
  });
});

describe("validatePetName", () => {
  it("accepts a normal name", () => {
    expect(validatePetName("Max")).toEqual({ ok: true, name: "Max" });
  });

  it("trims leading and trailing whitespace", () => {
    expect(validatePetName("  Luna  ")).toEqual({ ok: true, name: "Luna" });
  });

  it("allows letters, numbers, spaces, apostrophes, and hyphens", () => {
    expect(validatePetName("Mr. Fix")).toEqual({ ok: false, error: "invalid-characters" }); // period not allowed
    expect(validatePetName("Whiskers-2 OBrien")).toEqual({ ok: true, name: "Whiskers-2 OBrien" });
    expect(validatePetName("O'Malley")).toEqual({ ok: true, name: "O'Malley" });
  });

  it("rejects a blank name (including all-whitespace)", () => {
    expect(validatePetName("")).toEqual({ ok: false, error: "too-short" });
    expect(validatePetName("   ")).toEqual({ ok: false, error: "too-short" });
  });

  it("rejects names over 20 characters", () => {
    expect(validatePetName("a".repeat(21))).toEqual({ ok: false, error: "too-long" });
  });

  it("accepts a name at exactly 20 characters", () => {
    expect(validatePetName("a".repeat(20))).toEqual({ ok: true, name: "a".repeat(20) });
  });

  it("rejects disallowed characters", () => {
    expect(validatePetName("Spark!")).toEqual({ ok: false, error: "invalid-characters" });
    expect(validatePetName("Nova@Home")).toEqual({ ok: false, error: "invalid-characters" });
  });

  it("rejects profanity as a whole word", () => {
    expect(validatePetName("shit")).toEqual({ ok: false, error: "inappropriate" });
    expect(validatePetName("Big Bastard")).toEqual({ ok: false, error: "inappropriate" });
  });

  it("does not false-positive on innocent names containing a banned substring", () => {
    // "ass" is not on the list, but this guards the whole-word matching approach generally
    expect(validatePetName("Classic")).toEqual({ ok: true, name: "Classic" });
  });
});

describe("containsProfanity", () => {
  it("matches case-insensitively", () => {
    expect(containsProfanity("FUCK")).toBe(true);
    expect(containsProfanity("FuckFace")).toBe(false); // not a whole-word match by itself, but...
  });

  it("matches whole words only", () => {
    expect(containsProfanity("shit")).toBe(true);
    expect(containsProfanity("shitake")).toBe(false);
  });

  it("returns false for clean names", () => {
    expect(containsProfanity("Buddy")).toBe(false);
    expect(containsProfanity("Oreo")).toBe(false);
  });
});

describe("renameCost", () => {
  it("is free when there's no record yet (first rename)", () => {
    expect(renameCost(undefined)).toBe(0);
  });

  it("is free when the free rename hasn't been used yet", () => {
    expect(renameCost({ name: "Max", renameCount: 0, freeRenameUsed: false })).toBe(0);
  });

  it("costs PET_RENAME_COST once the free rename is used", () => {
    expect(renameCost({ name: "Max", renameCount: 1, freeRenameUsed: true })).toBe(PET_RENAME_COST);
  });
});

describe("applyRename", () => {
  it("sets the new name, increments rename count, and marks the free rename used", () => {
    const result = applyRename(undefined, "Max");
    expect(result).toEqual({ name: "Max", renameCount: 1, freeRenameUsed: true });
  });

  it("keeps incrementing the count on subsequent renames", () => {
    const first = applyRename(undefined, "Max");
    const second = applyRename(first, "Luna");
    expect(second).toEqual({ name: "Luna", renameCount: 2, freeRenameUsed: true });
  });
});

describe("petDisplayName", () => {
  it("falls back to the catalog default when there's no custom name yet", () => {
    expect(petDisplayName({}, "golden-retriever")).toBe("Golden Retriever");
  });

  it("uses the custom name once one is set", () => {
    const petNames = { "golden-retriever": { name: "Max", renameCount: 1, freeRenameUsed: true } };
    expect(petDisplayName(petNames, "golden-retriever")).toBe("Max");
  });
});
