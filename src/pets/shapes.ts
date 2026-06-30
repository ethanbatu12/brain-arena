import type { PetSpecies } from "./types";
import { getTheme } from "../season/themes";

export type EarShape = "round" | "pointy" | "long" | "tiny" | "none";
export type TailShape = "fluffy" | "thin" | "short" | "stub" | "none";
export type Extra = "wings" | "hornPlates" | "antenna" | "beak" | "mask" | "stripes" | "spots" | "antennaeBug";

export interface PetShape {
  /** A natural/iconic color for the species — not just the rarity tint, so a golden retriever actually reads as golden. */
  color: string;
  secondaryColor?: string;
  earShape: EarShape;
  tailShape: TailShape;
  snoutLength: number;
  bodyScale: number;
  extras: Extra[];
}

const DEFAULT_SHAPE: PetShape = {
  color: "#9ca3af",
  earShape: "round",
  tailShape: "short",
  snoutLength: 0.1,
  bodyScale: 1,
  extras: [],
};

/**
 * Per-species silhouette parameters so each pet actually reads as that
 * animal (a fox looks foxlike, a dragon has wings) instead of every pet
 * being the same colored blob. Primitive-geometry shapes, not sculpted
 * models — same honest tradeoff as the player avatar's 3D preview — but
 * distinct enough to tell species apart at a glance.
 */
export const PET_SHAPES: Record<PetSpecies | "seasonFox" | "seasonDragon" | "seasonPhoenix" | "seasonLion", PetShape> = {
  simpleCat: { ...DEFAULT_SHAPE, color: "#d1d5db", earShape: "pointy", tailShape: "thin", snoutLength: 0.06 },
  goldenRetriever: { ...DEFAULT_SHAPE, color: "#d4a24c", earShape: "long", tailShape: "fluffy", snoutLength: 0.22, bodyScale: 1.15 },
  blackCat: { ...DEFAULT_SHAPE, color: "#1f2937", earShape: "pointy", tailShape: "thin", snoutLength: 0.06 },
  rabbit: { ...DEFAULT_SHAPE, color: "#f5f5f4", earShape: "long", tailShape: "stub", snoutLength: 0.05, bodyScale: 0.85 },
  hamster: { ...DEFAULT_SHAPE, color: "#c98a4b", earShape: "tiny", tailShape: "none", snoutLength: 0.03, bodyScale: 0.7 },
  fox: { ...DEFAULT_SHAPE, color: "#d2641c", secondaryColor: "#fff7ed", earShape: "pointy", tailShape: "fluffy", snoutLength: 0.2 },
  panda: { ...DEFAULT_SHAPE, color: "#f5f5f4", secondaryColor: "#1f2937", earShape: "round", tailShape: "stub", snoutLength: 0.12, bodyScale: 1.1, extras: ["mask"] },
  penguin: { ...DEFAULT_SHAPE, color: "#1f2937", secondaryColor: "#f5f5f4", earShape: "none", tailShape: "stub", snoutLength: 0.05, extras: ["beak"] },
  owl: { ...DEFAULT_SHAPE, color: "#92653a", earShape: "tiny", tailShape: "short", snoutLength: 0.04, extras: ["beak", "wings"] },
  redPanda: { ...DEFAULT_SHAPE, color: "#c1440e", secondaryColor: "#f5f5f4", earShape: "round", tailShape: "fluffy", snoutLength: 0.14, extras: ["mask"] },
  wolf: { ...DEFAULT_SHAPE, color: "#6b7280", earShape: "pointy", tailShape: "fluffy", snoutLength: 0.22, bodyScale: 1.1 },
  snowLeopard: { ...DEFAULT_SHAPE, color: "#e5e7eb", earShape: "round", tailShape: "fluffy", snoutLength: 0.16, extras: ["spots"] },
  babyTiger: { ...DEFAULT_SHAPE, color: "#f59e0b", secondaryColor: "#1f2937", earShape: "round", tailShape: "thin", snoutLength: 0.14, extras: ["stripes"] },
  babyDragon: { ...DEFAULT_SHAPE, color: "#16a34a", earShape: "pointy", tailShape: "thin", snoutLength: 0.2, extras: ["wings", "hornPlates"] },
  phoenix: { ...DEFAULT_SHAPE, color: "#f97316", secondaryColor: "#fde047", earShape: "none", tailShape: "fluffy", snoutLength: 0.05, extras: ["beak", "wings"] },
  robotCompanion: { ...DEFAULT_SHAPE, color: "#94a3b8", secondaryColor: "#38bdf8", earShape: "tiny", tailShape: "none", snoutLength: 0.04, extras: ["antenna"] },
  spaceAlien: { ...DEFAULT_SHAPE, color: "#84cc16", earShape: "none", tailShape: "thin", snoutLength: 0.02, bodyScale: 0.9, extras: ["antennaeBug"] },
  goldenDragon: { ...DEFAULT_SHAPE, color: "#eab308", secondaryColor: "#fef9c3", earShape: "pointy", tailShape: "thin", snoutLength: 0.22, extras: ["wings", "hornPlates"], bodyScale: 1.1 },
  crystalPhoenix: { ...DEFAULT_SHAPE, color: "#67e8f9", secondaryColor: "#f0fdfa", earShape: "none", tailShape: "fluffy", snoutLength: 0.05, extras: ["beak", "wings"] },
  cosmicWolf: { ...DEFAULT_SHAPE, color: "#6d28d9", secondaryColor: "#c4b5fd", earShape: "pointy", tailShape: "fluffy", snoutLength: 0.22, bodyScale: 1.1, extras: ["spots"] },
  galaxyDragon: { ...DEFAULT_SHAPE, color: "#312e81", secondaryColor: "#a5b4fc", earShape: "pointy", tailShape: "thin", snoutLength: 0.24, extras: ["wings", "hornPlates"], bodyScale: 1.2 },
  // Season Pass-exclusive pets — placeholder colors only; the real color
  // always comes from the active season's theme via shapeForSeasonPetId,
  // so a Neon Season fox is neon-colored, not the same orange as every
  // other season's fox.
  seasonFox: { ...DEFAULT_SHAPE, color: "#ea580c", secondaryColor: "#fff7ed", earShape: "pointy", tailShape: "fluffy", snoutLength: 0.2 },
  seasonDragon: { ...DEFAULT_SHAPE, color: "#7c3aed", secondaryColor: "#ddd6fe", earShape: "pointy", tailShape: "thin", snoutLength: 0.22, extras: ["wings", "hornPlates"], bodyScale: 1.15 },
  seasonPhoenix: { ...DEFAULT_SHAPE, color: "#dc2626", secondaryColor: "#fef08a", earShape: "none", tailShape: "fluffy", snoutLength: 0.05, extras: ["beak", "wings"] },
  seasonLion: { ...DEFAULT_SHAPE, color: "#d97706", secondaryColor: "#92400e", earShape: "round", tailShape: "thin", snoutLength: 0.16, bodyScale: 1.15, extras: ["mask"] },
};

const SEASON_PET_TIER_ARCHETYPE: Record<string, "seasonFox" | "seasonDragon" | "seasonPhoenix" | "seasonLion"> = {
  "t5-pet": "seasonFox",
  "t40-pet": "seasonDragon",
  "t85-pet": "seasonPhoenix",
  "t100-pet": "seasonLion",
};

/**
 * Resolves a Season Pass-exclusive pet id (e.g. "neon-t5-pet") to its
 * shape, colored from that pet's actual season theme rather than a fixed
 * color — so the same fox archetype looks different season to season
 * (and different from the regular catalog Fox).
 */
export function shapeForSeasonPetId(petId: string): PetShape | undefined {
  const archetypeEntry = Object.entries(SEASON_PET_TIER_ARCHETYPE).find(([suffix]) => petId.endsWith(suffix));
  if (!archetypeEntry) return undefined;
  const [suffix, archetypeKey] = archetypeEntry;
  const themeId = petId.slice(0, petId.length - suffix.length - 1);
  const theme = getTheme(themeId);
  const base = PET_SHAPES[archetypeKey];
  if (!theme) return base;
  const [color, secondaryColor] = theme.colors;
  return { ...base, color, secondaryColor };
}

export function shapeFor(key: string): PetShape {
  return shapeForSeasonPetId(key) ?? (PET_SHAPES as Record<string, PetShape>)[key] ?? DEFAULT_SHAPE;
}
