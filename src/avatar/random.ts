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
  HAIR_COLORS,
  HAIR_LENGTHS,
  HAIR_STYLES,
  MOUTH_STYLES,
  NOSE_STYLES,
  SKIN_TONES,
} from "./options";
import { unlockedValues } from "./unlocks";
import type { AvatarConfig } from "./types";

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
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

    clothingStyle: pick(unlockedValues(CLOTHING_STYLES, playerLevel), rng),
    clothingColor: pick(unlockedValues(CLOTHING_COLORS, playerLevel), rng),

    accessory: pick(unlockedValues(ACCESSORIES, playerLevel), rng),

    background: pick(unlockedValues(BACKGROUNDS, playerLevel), rng),
  };
}
