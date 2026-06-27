export type PetAccessoryId =
  | "bowTie"
  | "bandana"
  | "sunglasses"
  | "partyHat"
  | "cape"
  | "angelWings"
  | "halo"
  | "topHat"
  | "spikedCollar"
  | "goldenCrown";

export interface PetAccessoryDef {
  id: PetAccessoryId;
  label: string;
  emoji: string;
  /** Level at which this accessory unlocks for every pet the player owns — same level roadmap as avatar unlocks. */
  unlockLevel: number;
}

/**
 * Pet accessories, unlocked by player level (not bought) and equippable on
 * whichever pet you currently have equipped. New accessories only need a
 * catalog entry here — the level roadmap, Pet Shop picker, and badge
 * rendering all read from this list.
 */
export const PET_ACCESSORIES: PetAccessoryDef[] = [
  { id: "bowTie", label: "Bow Tie", emoji: "🎀", unlockLevel: 5 },
  { id: "bandana", label: "Bandana", emoji: "🧣", unlockLevel: 15 },
  { id: "sunglasses", label: "Sunglasses", emoji: "🕶️", unlockLevel: 25 },
  { id: "partyHat", label: "Party Hat", emoji: "🥳", unlockLevel: 35 },
  { id: "cape", label: "Hero Cape", emoji: "🦸", unlockLevel: 45 },
  { id: "angelWings", label: "Angel Wings", emoji: "🪽", unlockLevel: 60 },
  { id: "halo", label: "Halo", emoji: "😇", unlockLevel: 70 },
  { id: "topHat", label: "Top Hat", emoji: "🎩", unlockLevel: 80 },
  { id: "spikedCollar", label: "Spiked Collar", emoji: "⛓️", unlockLevel: 90 },
  { id: "goldenCrown", label: "Golden Crown", emoji: "👑", unlockLevel: 100 },
];

export const MAX_PET_ACCESSORY_SLOTS = 3;

export function getPetAccessoryDef(id: string): PetAccessoryDef | undefined {
  return PET_ACCESSORIES.find((a) => a.id === id);
}

export function unlockedPetAccessories(playerLevel: number): PetAccessoryDef[] {
  return PET_ACCESSORIES.filter((a) => a.unlockLevel <= playerLevel);
}

/** Drops anything not a real, currently-unlocked accessory id, dedupes, and caps at MAX_PET_ACCESSORY_SLOTS. */
export function sanitizePetAccessories(raw: unknown, playerLevel: number): PetAccessoryId[] {
  if (!Array.isArray(raw)) return [];
  const unlockedIds = new Set(unlockedPetAccessories(playerLevel).map((a) => a.id));
  const seen = new Set<string>();
  const valid: PetAccessoryId[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || seen.has(item) || !unlockedIds.has(item as PetAccessoryId)) continue;
    seen.add(item);
    valid.push(item as PetAccessoryId);
    if (valid.length >= MAX_PET_ACCESSORY_SLOTS) break;
  }
  return valid;
}
