import { mulberry32 } from "../game/rng";
import type { AccessoryStyle, ClothingStyle } from "../avatar/types";

export const TOP3_XP: [number, number, number] = [500, 350, 250];

export function xpForRank(rank: 1 | 2 | 3): number {
  return TOP3_XP[rank - 1];
}

/** A reward cosmetic that can only ever be earned by placing top 3 in a weekly tournament. */
export interface ExclusiveCosmetic {
  id: string;
  label: string;
  slot: "clothingStyle" | "accessory";
  value: ClothingStyle | AccessoryStyle;
}

export const EXCLUSIVE_COSMETICS: ExclusiveCosmetic[] = [
  { id: "championVarsityJacket", label: "Champion Varsity Jacket", slot: "clothingStyle", value: "tournamentVarsity" },
  { id: "diamondHoodie", label: "Diamond Hoodie", slot: "clothingStyle", value: "diamondHoodie" },
  { id: "lightningJacket", label: "Lightning Jacket", slot: "clothingStyle", value: "lightningJacket" },
  { id: "goldChampionJacket", label: "Gold Champion Jacket", slot: "clothingStyle", value: "goldChampionJacket" },
  { id: "galaxyChampionHoodie", label: "Galaxy Champion Hoodie", slot: "clothingStyle", value: "galaxyChampionHoodie" },
  { id: "goldChain", label: "Gold Chain", slot: "accessory", value: "goldChain" },
  { id: "diamondChain", label: "Diamond Chain", slot: "accessory", value: "diamondChain" },
  { id: "championMedal", label: "Champion Medal", slot: "accessory", value: "championMedal" },
  { id: "platinumNecklace", label: "Platinum Necklace", slot: "accessory", value: "platinumNecklace" },
  { id: "sportWatch", label: "Sport Watch", slot: "accessory", value: "sportWatch" },
  { id: "goldWatch", label: "Gold Watch", slot: "accessory", value: "goldWatch" },
  { id: "diamondWatch", label: "Diamond Watch", slot: "accessory", value: "diamondWatch" },
  { id: "championWatch", label: "Champion Watch", slot: "accessory", value: "championWatch" },
  { id: "goldenLaurelCrown", label: "Golden Laurel Crown", slot: "accessory", value: "goldenLaurelCrown" },
  { id: "championHeadband", label: "Champion Headband", slot: "accessory", value: "championHeadband" },
  { id: "animatedCrown", label: "Animated Crown", slot: "accessory", value: "animatedCrown" },
  { id: "championGlasses", label: "Champion Glasses", slot: "accessory", value: "championGlasses" },
];

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h || 1;
}

/**
 * Picks which 3 exclusive cosmetics (one per rank) are up for grabs in a
 * given week — rotating the pool so players keep coming back for items they
 * haven't collected yet, while staying deterministic so every client agrees.
 */
export function exclusiveCosmeticsForWeek(weekStart: string): [ExclusiveCosmetic, ExclusiveCosmetic, ExclusiveCosmetic] {
  const rng = mulberry32(seedFromString(`tournament-rewards:${weekStart}`));
  const pool = [...EXCLUSIVE_COSMETICS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [pool[0], pool[1], pool[2]];
}

export function cosmeticForRank(weekStart: string, rank: 1 | 2 | 3): ExclusiveCosmetic {
  return exclusiveCosmeticsForWeek(weekStart)[rank - 1];
}
