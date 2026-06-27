import {
  ACCESSORIES,
  BACKGROUNDS,
  CLOTHING_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  PANTS_STYLES,
  SHOE_STYLES,
  SKIN_TONES,
  type AvatarOption,
} from "../avatar/options";
import { BORDERS } from "../player/borders";
import { TITLES } from "./levels";
import { PET_ACCESSORIES } from "../pets/accessories";

export interface RoadmapEntry {
  level: number;
  /** Total lifetime XP required to reach this level. */
  xpRequired: number;
  unlocks: string[];
}

function labelsAtLevel<T extends string>(options: AvatarOption<T>[], level: number): string[] {
  return options.filter((o) => !o.exclusive && o.unlockLevel === level).map((o) => o.label);
}

/** Every avatar/border/title unlock grouped by the level it unlocks at, levels 1-100. */
export function buildLevelRoadmap(totalXpForLevel: (level: number) => number): RoadmapEntry[] {
  const entries: RoadmapEntry[] = [];
  for (let level = 1; level <= 100; level++) {
    const unlocks: string[] = [
      ...labelsAtLevel(SKIN_TONES, level).map((l) => `Skin tone: ${l}`),
      ...labelsAtLevel(HAIR_STYLES, level).map((l) => `Hairstyle: ${l}`),
      ...labelsAtLevel(HAIR_COLORS, level).map((l) => `Hair color: ${l}`),
      ...labelsAtLevel(CLOTHING_STYLES, level).map((l) => `Top: ${l}`),
      ...labelsAtLevel(PANTS_STYLES, level).map((l) => `Pants: ${l}`),
      ...labelsAtLevel(SHOE_STYLES, level).map((l) => `Shoes: ${l}`),
      ...labelsAtLevel(ACCESSORIES, level).map((l) => `Accessory: ${l}`),
      ...labelsAtLevel(BACKGROUNDS, level).map((l) => `Background: ${l}`),
      ...BORDERS.filter((b) => b.unlockLevel === level).map((b) => `Profile border: ${b.label}`),
      ...TITLES.filter((t) => t.level === level).map((t) => `Title: "${t.title}"`),
      ...PET_ACCESSORIES.filter((a) => a.unlockLevel === level).map((a) => `Pet accessory: ${a.label}`),
    ];
    entries.push({ level, xpRequired: totalXpForLevel(level), unlocks });
  }
  return entries;
}
