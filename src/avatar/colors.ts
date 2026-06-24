import { CLOTHING_COLORS, EYE_COLORS, HAIR_COLORS, SKIN_TONES } from "./options";
import type { ClothingColor, EyeColor, HairColor, SkinTone } from "./types";

function lookup<T extends string>(catalog: { value: T; swatch?: string }[], value: T): string {
  return catalog.find((o) => o.value === value)?.swatch ?? "#cccccc";
}

export function skinToneColor(tone: SkinTone): string {
  return lookup(SKIN_TONES, tone);
}

export function hairColorValue(color: HairColor): string {
  return lookup(HAIR_COLORS, color);
}

export function eyeColorValue(color: EyeColor): string {
  return lookup(EYE_COLORS, color);
}

export function clothingColorValue(color: ClothingColor): string {
  return lookup(CLOTHING_COLORS, color);
}

/** Darkens a hex color by a fraction (0-1) for shading/outlines. */
export function darken(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}
