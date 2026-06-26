import type { Rng } from "../game/rng";
import {
  ACCESSORIES,
  BACKGROUNDS,
  CLOTHING_COLORS,
  CLOTHING_STYLES,
  EYEBROW_STYLES,
  EYE_COLORS,
  EYE_SHAPES,
  FACE_SHAPES,
  FACIAL_HAIR_STYLES,
  HAIR_COLORS,
  HAIR_LENGTHS,
  HAIR_STYLES,
  MOUTH_STYLES,
  NOSE_STYLES,
  PANTS_STYLES,
  SHOE_STYLES,
  SKIN_TONES,
} from "./options";
import { accessorySlotsForLevel, unlockedValues } from "./unlocks";
import type { AccessoryStyle, AvatarConfig } from "./types";

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/** Picks a random subset (no duplicates) of up to `max` items, between 0 and max of them. */
function pickSubset<T>(items: T[], max: number, rng: Rng): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = Math.min(pool.length, Math.floor(rng() * (max + 1)));
  return pool.slice(0, count);
}

/** Generates a random avatar using only options unlocked at the given player level. */
export function randomizeAvatar(playerLevel: number, rng: Rng): AvatarConfig {
  return {
    faceShape: pick(unlockedValues(FACE_SHAPES, playerLevel), rng),
    skinTone: pick(unlockedValues(SKIN_TONES, playerLevel), rng),
    freckles: rng() < 0.3,
    blush: rng() < 0.3,

    hairStyle: pick(unlockedValues(HAIR_STYLES, playerLevel), rng),
    hairLength: pick(unlockedValues(HAIR_LENGTHS, playerLevel), rng),
    hairColor: pick(unlockedValues(HAIR_COLORS, playerLevel), rng),

    eyeShape: pick(unlockedValues(EYE_SHAPES, playerLevel), rng),
    eyeColor: pick(unlockedValues(EYE_COLORS, playerLevel), rng),
    eyebrowStyle: pick(unlockedValues(EYEBROW_STYLES, playerLevel), rng),

    noseStyle: pick(unlockedValues(NOSE_STYLES, playerLevel), rng),

    mouthStyle: pick(unlockedValues(MOUTH_STYLES, playerLevel), rng),

    facialHair: pick(unlockedValues(FACIAL_HAIR_STYLES, playerLevel), rng),

    clothingStyle: pick(unlockedValues(CLOTHING_STYLES, playerLevel), rng),
    clothingColor: pick(unlockedValues(CLOTHING_COLORS, playerLevel), rng),

    pantsStyle: pick(unlockedValues(PANTS_STYLES, playerLevel), rng),
    pantsColor: pick(unlockedValues(CLOTHING_COLORS, playerLevel), rng),

    shoeStyle: pick(unlockedValues(SHOE_STYLES, playerLevel), rng),
    shoeColor: pick(unlockedValues(CLOTHING_COLORS, playerLevel), rng),

    accessories: pickSubset<AccessoryStyle>(
      unlockedValues(ACCESSORIES, playerLevel).filter((v) => v !== "none"),
      accessorySlotsForLevel(playerLevel),
      rng,
    ),

    background: pick(unlockedValues(BACKGROUNDS, playerLevel), rng),
  };
}
