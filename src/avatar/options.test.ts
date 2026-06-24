import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR_CONFIG } from "./defaults";
import {
  ACCESSORIES,
  BACKGROUNDS,
  CLOTHING_COLORS,
  CLOTHING_STYLES,
  EYEBROW_STYLES,
  EYE_COLORS,
  EYE_SHAPES,
  FACE_SHAPES,
  HAIR_COLORS,
  HAIR_LENGTHS,
  HAIR_STYLES,
  MOUTH_STYLES,
  NOSE_STYLES,
  SKIN_TONES,
} from "./options";

const ALL_CATALOGS = {
  FACE_SHAPES,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_LENGTHS,
  HAIR_COLORS,
  EYE_SHAPES,
  EYE_COLORS,
  EYEBROW_STYLES,
  NOSE_STYLES,
  MOUTH_STYLES,
  CLOTHING_STYLES,
  CLOTHING_COLORS,
  ACCESSORIES,
  BACKGROUNDS,
};

describe("avatar option catalogs", () => {
  it("every catalog is non-empty", () => {
    for (const [name, catalog] of Object.entries(ALL_CATALOGS)) {
      expect(catalog.length, `${name} should not be empty`).toBeGreaterThan(0);
    }
  });

  it("every catalog has unique values", () => {
    for (const [name, catalog] of Object.entries(ALL_CATALOGS)) {
      const values = catalog.map((o) => o.value);
      expect(new Set(values).size, `${name} should have unique values`).toBe(values.length);
    }
  });

  it("every option has a non-empty label and a valid unlockLevel", () => {
    for (const catalog of Object.values(ALL_CATALOGS)) {
      for (const option of catalog) {
        expect(option.label.length).toBeGreaterThan(0);
        expect(option.unlockLevel).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("most options are unlocked at level 1, per the spec ('keep most items available')", () => {
    for (const [name, catalog] of Object.entries(ALL_CATALOGS)) {
      const unlockedAtStart = catalog.filter((o) => o.unlockLevel === 1).length;
      expect(unlockedAtStart / catalog.length, `${name} should mostly be unlocked at level 1`).toBeGreaterThanOrEqual(0.5);
    }
  });

  it("every DEFAULT_AVATAR_CONFIG field is a real, level-1 option in its catalog", () => {
    expect(FACE_SHAPES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.faceShape)?.unlockLevel).toBe(1);
    expect(SKIN_TONES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.skinTone)?.unlockLevel).toBe(1);
    expect(HAIR_STYLES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.hairStyle)?.unlockLevel).toBe(1);
    expect(HAIR_LENGTHS.find((o) => o.value === DEFAULT_AVATAR_CONFIG.hairLength)?.unlockLevel).toBe(1);
    expect(HAIR_COLORS.find((o) => o.value === DEFAULT_AVATAR_CONFIG.hairColor)?.unlockLevel).toBe(1);
    expect(EYE_SHAPES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.eyeShape)?.unlockLevel).toBe(1);
    expect(EYE_COLORS.find((o) => o.value === DEFAULT_AVATAR_CONFIG.eyeColor)?.unlockLevel).toBe(1);
    expect(EYEBROW_STYLES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.eyebrowStyle)?.unlockLevel).toBe(1);
    expect(NOSE_STYLES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.noseStyle)?.unlockLevel).toBe(1);
    expect(MOUTH_STYLES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.mouthStyle)?.unlockLevel).toBe(1);
    expect(CLOTHING_STYLES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.clothingStyle)?.unlockLevel).toBe(1);
    expect(CLOTHING_COLORS.find((o) => o.value === DEFAULT_AVATAR_CONFIG.clothingColor)?.unlockLevel).toBe(1);
    expect(ACCESSORIES.find((o) => o.value === DEFAULT_AVATAR_CONFIG.accessory)?.unlockLevel).toBe(1);
    expect(BACKGROUNDS.find((o) => o.value === DEFAULT_AVATAR_CONFIG.background)?.unlockLevel).toBe(1);
  });
});
