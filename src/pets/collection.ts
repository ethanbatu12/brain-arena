import { PET_CATALOG } from "./catalog";

export interface CollectionStats {
  owned: number;
  total: number;
  /** 0-100, rounded to the nearest whole percent. */
  percent: number;
}

export function collectionStats(ownedPets: string[]): CollectionStats {
  const total = PET_CATALOG.length;
  const owned = ownedPets.filter((id) => PET_CATALOG.some((p) => p.id === id)).length;
  return { owned, total, percent: total === 0 ? 0 : Math.round((owned / total) * 100) };
}

export type PurchaseResult =
  | { ok: true }
  | { ok: false; error: "already-owned" | "not-enough-coins" | "unknown-pet" };

/** Whether buying `petId` for this player would succeed, without mutating anything. */
export function canPurchase(petId: string, coins: number, ownedPets: string[]): PurchaseResult {
  const pet = PET_CATALOG.find((p) => p.id === petId);
  if (!pet) return { ok: false, error: "unknown-pet" };
  if (ownedPets.includes(petId)) return { ok: false, error: "already-owned" };
  if (coins < pet.price) return { ok: false, error: "not-enough-coins" };
  return { ok: true };
}
