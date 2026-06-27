import type { PetRarity, PetSpecies } from "./types";

export const RARITY_ORDER: PetRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

export const RARITY_LABELS: Record<PetRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** [start, end] gradient colors per rarity tier, escalating in prestige like titles/borders. */
export const RARITY_COLORS: Record<PetRarity, [string, string]> = {
  common: ["#9ca3af", "#6b7280"],
  uncommon: ["#4ade80", "#16a34a"],
  rare: ["#60a5fa", "#1d4ed8"],
  epic: ["#c084fc", "#7e22ce"],
  legendary: ["#fbbf24", "#dc2626"],
};

/** A lightweight emoji per species, used for the badge that follows the avatar outside the Pet Shop's 3D preview. */
export const PET_EMOJI: Record<PetSpecies, string> = {
  simpleCat: "🐱",
  goldenRetriever: "🐕",
  blackCat: "🐈‍⬛",
  rabbit: "🐇",
  hamster: "🐹",
  fox: "🦊",
  panda: "🐼",
  penguin: "🐧",
  owl: "🦉",
  redPanda: "🐾",
  wolf: "🐺",
  snowLeopard: "🐆",
  babyTiger: "🐯",
  babyDragon: "🐲",
  phoenix: "🔥",
  robotCompanion: "🤖",
  spaceAlien: "👽",
  goldenDragon: "🐉",
  crystalPhoenix: "✨",
  cosmicWolf: "🌙",
  galaxyDragon: "🌌",
};
