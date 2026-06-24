export type BorderId = "none" | "bronze" | "silver" | "gold" | "diamond" | "master" | "legend";

export interface BorderDef {
  id: BorderId;
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

export function getBorderDef(id: string): BorderDef {
  return BORDERS.find((b) => b.id === id) ?? BORDERS[0];
}

/** Validates a stored border id against the unlock catalog, falling back to "none" if unrecognized or no longer unlocked. */
export function sanitizeBorder(id: unknown, playerLevel: number): BorderId {
  if (typeof id !== "string") return "none";
  const def = BORDERS.find((b) => b.id === id);
  if (!def) return "none";
  return isBorderUnlocked(def, playerLevel) ? def.id : "none";
}
