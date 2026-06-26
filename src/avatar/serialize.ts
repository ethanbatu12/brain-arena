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
  FACIAL_HAIR_STYLES,
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
import { MAX_ACCESSORY_SLOTS } from "./unlocks";
import type { AccessoryStyle, AvatarConfig } from "./types";

function validValue<T extends string>(options: AvatarOption<T>[], value: unknown, fallback: T): T {
  if (typeof value === "string" && options.some((o) => o.value === value)) return value as T;
  return fallback;
}

/**
 * Validates a list of accessory values: drops unrecognized entries, drops
 * "none" (an empty array already means "wearing nothing"), de-duplicates,
 * and caps at the absolute max any player can ever have — the actual
 * level-based slot limit (3/5/7) is enforced by the editor UI, not here.
 * Also accepts a legacy single string value, from saves made before
 * multiple accessories were supported.
 */
function validAccessories(raw: unknown): AccessoryStyle[] {
  const candidates: unknown[] = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const valid = candidates.filter(
    (v): v is AccessoryStyle => typeof v === "string" && v !== "none" && ACCESSORIES.some((o) => o.value === v),
  );
  return Array.from(new Set(valid)).slice(0, MAX_ACCESSORY_SLOTS);
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

    facialHair: validValue(FACIAL_HAIR_STYLES, r.facialHair, DEFAULT_AVATAR_CONFIG.facialHair),

    clothingStyle: validValue(CLOTHING_STYLES, r.clothingStyle, DEFAULT_AVATAR_CONFIG.clothingStyle),
    clothingColor: validValue(CLOTHING_COLORS, r.clothingColor, DEFAULT_AVATAR_CONFIG.clothingColor),

    pantsStyle: validValue(PANTS_STYLES, r.pantsStyle, DEFAULT_AVATAR_CONFIG.pantsStyle),
    pantsColor: validValue(CLOTHING_COLORS, r.pantsColor, DEFAULT_AVATAR_CONFIG.pantsColor),

    shoeStyle: validValue(SHOE_STYLES, r.shoeStyle, DEFAULT_AVATAR_CONFIG.shoeStyle),
    shoeColor: validValue(CLOTHING_COLORS, r.shoeColor, DEFAULT_AVATAR_CONFIG.shoeColor),

    accessories: validAccessories((r as Partial<AvatarConfig> & { accessory?: unknown }).accessories ?? (r as { accessory?: unknown }).accessory),

    background: validValue(BACKGROUNDS, r.background, DEFAULT_AVATAR_CONFIG.background),
  };
}
