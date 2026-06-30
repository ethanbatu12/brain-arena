import { seasonBorderFromRewardId } from "../season/rewards";

export type BorderId = "none" | "bronze" | "silver" | "gold" | "diamond" | "master" | "legend";

export interface BorderDef {
  /** A fixed BorderId for level-unlocked borders, or an arbitrary claimed Season Pass reward id for season-exclusive ones. */
  id: string;
  label: string;
  unlockLevel: number;
  /** CSS color(s) used to render the ring; a single color or a gradient pair. */
  colors: [string, string];
}

export const BORDERS: BorderDef[] = [
  { id: "none", label: "None", unlockLevel: 1, colors: ["transparent", "transparent"] },
  { id: "bronze", label: "Bronze Border", unlockLevel: 10, colors: ["#b87333", "#8a5524"] },
  { id: "silver", label: "Silver Border", unlockLevel: 20, colors: ["#d4d4d8", "#9ca3af"] },
  { id: "gold", label: "Gold Border", unlockLevel: 35, colors: ["#fbbf24", "#b45309"] },
  { id: "diamond", label: "Diamond Border", unlockLevel: 50, colors: ["#a5f3fc", "#0891b2"] },
  { id: "master", label: "Master Border", unlockLevel: 75, colors: ["#c4b5fd", "#6d28d9"] },
  { id: "legend", label: "Legend Border", unlockLevel: 100, colors: ["#fde68a", "#dc2626"] },
];

export function isBorderUnlocked(border: BorderDef, playerLevel: number): boolean {
  return playerLevel >= border.unlockLevel;
}

export function unlockedBorders(playerLevel: number): BorderDef[] {
  return BORDERS.filter((b) => isBorderUnlocked(b, playerLevel));
}

/**
 * Season Pass-claimed border/animated-border/name-color rewards, turned
 * into the same BorderDef shape so they show up in the same equip picker
 * as level-unlocked borders — there's no separate "name color" slot since
 * the leaderboard name color already comes from the equipped border.
 */
export function ownedSeasonBorders(exclusiveCosmeticIds: string[]): BorderDef[] {
  return exclusiveCosmeticIds
    .map((id) => seasonBorderFromRewardId(id))
    .filter((b): b is NonNullable<typeof b> => !!b)
    .map((b) => ({ id: b.id, label: b.label, unlockLevel: 0, colors: b.colors }));
}

/** Every border the player can currently equip: level-unlocked plus any claimed Season Pass borders. */
export function equippableBorders(playerLevel: number, exclusiveCosmeticIds: string[]): BorderDef[] {
  return [...unlockedBorders(playerLevel), ...ownedSeasonBorders(exclusiveCosmeticIds)];
}

export function getBorderDef(id: string, exclusiveCosmeticIds: string[] = []): BorderDef {
  const fixed = BORDERS.find((b) => b.id === id);
  if (fixed) return fixed;
  if (exclusiveCosmeticIds.includes(id)) {
    const season = seasonBorderFromRewardId(id);
    if (season) return { id: season.id, label: season.label, unlockLevel: 0, colors: season.colors };
  }
  return BORDERS[0];
}

/** Validates a stored border id against the unlock catalog and any claimed Season Pass borders, falling back to "none" otherwise. */
export function sanitizeBorder(id: unknown, playerLevel: number, exclusiveCosmeticIds: string[] = []): string {
  if (typeof id !== "string") return "none";
  const fixed = BORDERS.find((b) => b.id === id);
  if (fixed) return isBorderUnlocked(fixed, playerLevel) ? fixed.id : "none";
  if (exclusiveCosmeticIds.includes(id) && seasonBorderFromRewardId(id)) return id;
  return "none";
}
