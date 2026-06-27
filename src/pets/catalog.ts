import type { PetDef } from "./types";

/**
 * The full pet catalog. Adding a new pet (seasonal, holiday, tournament
 * reward, achievement reward, etc.) is just appending an entry here —
 * the shop, collection page, and 3D preview all read from this list.
 */
/** Given free to every player as their starter pet — see DEFAULT_STARTER_PET_ID. */
export const SIMPLE_CAT_ID = "simple-cat";

export const PET_CATALOG: PetDef[] = [
  // Free starter
  { id: SIMPLE_CAT_ID, name: "Simple Cat", species: "simpleCat", rarity: "common", price: 0 },

  // Common
  { id: "golden-retriever", name: "Golden Retriever", species: "goldenRetriever", rarity: "common", price: 300 },
  { id: "black-cat", name: "Black Cat", species: "blackCat", rarity: "common", price: 300 },
  { id: "rabbit", name: "Rabbit", species: "rabbit", rarity: "common", price: 350 },
  { id: "hamster", name: "Hamster", species: "hamster", rarity: "common", price: 350 },

  // Uncommon
  { id: "fox", name: "Fox", species: "fox", rarity: "uncommon", price: 600 },
  { id: "panda", name: "Panda", species: "panda", rarity: "uncommon", price: 650 },
  { id: "penguin", name: "Penguin", species: "penguin", rarity: "uncommon", price: 700 },
  { id: "owl", name: "Owl", species: "owl", rarity: "uncommon", price: 700 },

  // Rare
  { id: "red-panda", name: "Red Panda", species: "redPanda", rarity: "rare", price: 1000 },
  { id: "wolf", name: "Wolf", species: "wolf", rarity: "rare", price: 1100 },
  { id: "snow-leopard", name: "Snow Leopard", species: "snowLeopard", rarity: "rare", price: 1200 },
  { id: "baby-tiger", name: "Baby Tiger", species: "babyTiger", rarity: "rare", price: 1250 },

  // Epic
  { id: "baby-dragon", name: "Baby Dragon", species: "babyDragon", rarity: "epic", price: 2000 },
  { id: "phoenix", name: "Phoenix", species: "phoenix", rarity: "epic", price: 2200 },
  { id: "robot-companion", name: "Robot Companion", species: "robotCompanion", rarity: "epic", price: 2300 },
  { id: "space-alien", name: "Space Alien", species: "spaceAlien", rarity: "epic", price: 2500 },

  // Legendary
  { id: "golden-dragon", name: "Golden Dragon", species: "goldenDragon", rarity: "legendary", price: 4000 },
  { id: "crystal-phoenix", name: "Crystal Phoenix", species: "crystalPhoenix", rarity: "legendary", price: 4500 },
  { id: "cosmic-wolf", name: "Cosmic Wolf", species: "cosmicWolf", rarity: "legendary", price: 5000 },
  { id: "galaxy-dragon", name: "Galaxy Dragon", species: "galaxyDragon", rarity: "legendary", price: 6000 },
];

export function getPetDef(id: string): PetDef | undefined {
  return PET_CATALOG.find((p) => p.id === id);
}
