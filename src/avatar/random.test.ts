import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
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
import { randomizeAvatar } from "./random";
import { sanitizeAvatarConfig } from "./serialize";

describe("randomizeAvatar", () => {
  it("always produces a config that is already fully valid (a no-op under sanitize)", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const config = randomizeAvatar(1, rng);
      expect(sanitizeAvatarConfig(config)).toEqual(config);
    }
  });

  it("never selects an option locked above the given player level", () => {
    const rng = mulberry32(7);
    const lockedHairColors = new Set(HAIR_COLORS.filter((o) => o.unlockLevel > 1).map((o) => o.value));
    const lockedAccessories = new Set(ACCESSORIES.filter((o) => o.unlockLevel > 1).map((o) => o.value));
    for (let i = 0; i < 200; i++) {
      const config = randomizeAvatar(1, rng);
      expect(lockedHairColors.has(config.hairColor)).toBe(false);
      expect(lockedAccessories.has(config.accessory)).toBe(false);
    }
  });

  it("can select higher-level options once the player is high enough level", () => {
    const rng = mulberry32(3);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      seen.add(randomizeAvatar(99, rng).accessory);
    }
    expect(seen.has("beanie")).toBe(true);
  });

  it("produces varied results across calls rather than always the same avatar", () => {
    const rng = mulberry32(11);
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(JSON.stringify(randomizeAvatar(1, rng)));
    }
    expect(seen.size).toBeGreaterThan(10);
  });

  it("every produced field is a known option value for its category", () => {
    const rng = mulberry32(42);
    const validSets = {
      faceShape: new Set(FACE_SHAPES.map((o) => o.value)),
      skinTone: new Set(SKIN_TONES.map((o) => o.value)),
      hairStyle: new Set(HAIR_STYLES.map((o) => o.value)),
      hairLength: new Set(HAIR_LENGTHS.map((o) => o.value)),
      hairColor: new Set(HAIR_COLORS.map((o) => o.value)),
      eyeShape: new Set(EYE_SHAPES.map((o) => o.value)),
      eyeColor: new Set(EYE_COLORS.map((o) => o.value)),
      eyebrowStyle: new Set(EYEBROW_STYLES.map((o) => o.value)),
      noseStyle: new Set(NOSE_STYLES.map((o) => o.value)),
      mouthStyle: new Set(MOUTH_STYLES.map((o) => o.value)),
      clothingStyle: new Set(CLOTHING_STYLES.map((o) => o.value)),
      clothingColor: new Set(CLOTHING_COLORS.map((o) => o.value)),
      accessory: new Set(ACCESSORIES.map((o) => o.value)),
      background: new Set(BACKGROUNDS.map((o) => o.value)),
    };
    for (let i = 0; i < 50; i++) {
      const config = randomizeAvatar(99, rng);
      for (const [key, set] of Object.entries(validSets) as [string, Set<string>][]) {
        expect(set.has(config[key as keyof typeof config] as string)).toBe(true);
      }
    }
  });
});
