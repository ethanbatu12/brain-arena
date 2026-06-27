export type PetRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/**
 * Drives both the lightweight emoji badge (shown following the avatar on
 * Profile/Hub) and the 3D preview shape/color in the Pet Shop. New pets only
 * need a catalog entry — no other code changes — to support future
 * seasonal/holiday/tournament/achievement pets.
 */
export type PetSpecies =
  | "simpleCat"
  | "goldenRetriever" | "blackCat" | "rabbit" | "hamster"
  | "fox" | "panda" | "penguin" | "owl"
  | "redPanda" | "wolf" | "snowLeopard" | "babyTiger"
  | "babyDragon" | "phoenix" | "robotCompanion" | "spaceAlien"
  | "goldenDragon" | "crystalPhoenix" | "cosmicWolf" | "galaxyDragon";

export interface PetDef {
  id: string;
  name: string;
  species: PetSpecies;
  rarity: PetRarity;
  price: number;
}
