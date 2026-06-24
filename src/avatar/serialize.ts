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
  PANTS_STYLES,
  SHOE_STYLES,
  SKIN_TONES,
  type AvatarOption,
} from "./options";
import type { AvatarConfig } from "./types";

function validValue<T extends string>(options: AvatarOption<T>[], value: unknown, fallback: T): T {
  if (typeof value === "string" && options.some((o) => o.value === value)) return value as T;
  return fallback;
}

/**
 * Repairs a possibly-partial or corrupted avatar config (e.g. loaded from
 * an older save, or from a database row that predates an option being
 * added) into a fully valid AvatarConfig — every field is guaranteed to be
 * a recognized option value, falling back to the default avatar's value
 * for anything missing or invalid. Never throws.
 */
export function sanitizeAvatarConfig(raw: Partial<AvatarConfig> | null | undefined): AvatarConfig {
  const r = raw ?? {};
  return {
    faceShape: validValue(FACE_SHAPES, r.faceShape, DEFAULT_AVATAR_CONFIG.faceShape),
    skinTone: validValue(SKIN_TONES, r.skinTone, DEFAULT_AVATAR_CONFIG.skinTone),
    freckles: typeof r.freckles === "boolean" ? r.freckles : DEFAULT_AVATAR_CONFIG.freckles,
    blush: typeof r.blush === "boolean" ? r.blush : DEFAULT_AVATAR_CONFIG.blush,

    hairStyle: validValue(HAIR_STYLES, r.hairStyle, DEFAULT_AVATAR_CONFIG.hairStyle),
    hairLength: validValue(HAIR_LENGTHS, r.hairLength, DEFAULT_AVATAR_CONFIG.hairLength),
    hairColor: validValue(HAIR_COLORS, r.hairColor, DEFAULT_AVATAR_CONFIG.hairColor),

    eyeShape: validValue(EYE_SHAPES, r.eyeShape, DEFAULT_AVATAR_CONFIG.eyeShape),
    eyeColor: validValue(EYE_COLORS, r.eyeColor, DEFAULT_AVATAR_CONFIG.eyeColor),
    eyebrowStyle: validValue(EYEBROW_STYLES, r.eyebrowStyle, DEFAULT_AVATAR_CONFIG.eyebrowStyle),

    noseStyle: validValue(NOSE_STYLES, r.noseStyle, DEFAULT_AVATAR_CONFIG.noseStyle),

    mouthStyle: validValue(MOUTH_STYLES, r.mouthStyle, DEFAULT_AVATAR_CONFIG.mouthStyle),

    clothingStyle: validValue(CLOTHING_STYLES, r.clothingStyle, DEFAULT_AVATAR_CONFIG.clothingStyle),
    clothingColor: validValue(CLOTHING_COLORS, r.clothingColor, DEFAULT_AVATAR_CONFIG.clothingColor),

    pantsStyle: validValue(PANTS_STYLES, r.pantsStyle, DEFAULT_AVATAR_CONFIG.pantsStyle),
    pantsColor: validValue(CLOTHING_COLORS, r.pantsColor, DEFAULT_AVATAR_CONFIG.pantsColor),

    shoeStyle: validValue(SHOE_STYLES, r.shoeStyle, DEFAULT_AVATAR_CONFIG.shoeStyle),
    shoeColor: validValue(CLOTHING_COLORS, r.shoeColor, DEFAULT_AVATAR_CONFIG.shoeColor),

    accessory: validValue(ACCESSORIES, r.accessory, DEFAULT_AVATAR_CONFIG.accessory),

    background: validValue(BACKGROUNDS, r.background, DEFAULT_AVATAR_CONFIG.background),
  };
}
