import type {
  AccessoryStyle,
  BackgroundStyle,
  ClothingColor,
  ClothingStyle,
  EyeColor,
  EyebrowStyle,
  EyeShape,
  FaceShape,
  FacialHairStyle,
  HairColor,
  HairLength,
  HairStyle,
  MouthStyle,
  NoseStyle,
  PantsStyle,
  ShoeStyle,
  SkinTone,
} from "./types";

/**
 * Every selectable option, with its display label and the player level
 * required to unlock it. unlockLevel 1 means available from the start.
 * Most options are unlocked immediately per the spec; a handful of
 * "rare" items per category are gated behind a level to demonstrate the
 * unlock framework ahead of the future XP/Level system landing.
 */
export interface AvatarOption<T extends string> {
  value: T;
  label: string;
  unlockLevel: number;
  /** Swatch color for color-pickers; omitted for shape/style options. */
  swatch?: string;
  /**
   * Weekly Tournament reward items: never unlockable by leveling at all
   * (unlockLevel is a sentinel that's effectively unreachable) — only
   * granted by owning the item, checked separately from player level.
   */
  exclusive?: boolean;
}

/** Sentinel level used for exclusive items so they never unlock via normal leveling. */
export const EXCLUSIVE_UNLOCK_LEVEL = 9999;

export const FACE_SHAPES: AvatarOption<FaceShape>[] = [
  { value: "round", label: "Round", unlockLevel: 1 },
  { value: "oval", label: "Oval", unlockLevel: 1 },
  { value: "square", label: "Square", unlockLevel: 1 },
  { value: "heart", label: "Heart", unlockLevel: 1 },
  { value: "diamond", label: "Diamond", unlockLevel: 1 },
  { value: "long", label: "Long", unlockLevel: 1 },
  { value: "chubby", label: "Chubby", unlockLevel: 1 },
  { value: "squareJaw", label: "Square Jaw", unlockLevel: 1 },
  { value: "triangle", label: "Triangle", unlockLevel: 1 },
];

export const SKIN_TONES: AvatarOption<SkinTone>[] = [
  { value: "porcelain", label: "Porcelain", unlockLevel: 1, swatch: "#fde8d8" },
  { value: "fair", label: "Fair", unlockLevel: 1, swatch: "#f9ddc2" },
  { value: "light", label: "Light", unlockLevel: 1, swatch: "#f6d2ae" },
  { value: "tan", label: "Tan", unlockLevel: 1, swatch: "#e3b287" },
  { value: "almond", label: "Almond", unlockLevel: 1, swatch: "#d39c6c" },
  { value: "honey", label: "Honey", unlockLevel: 1, swatch: "#c9925f" },
  { value: "caramel", label: "Caramel", unlockLevel: 1, swatch: "#b07847" },
  { value: "brown", label: "Brown", unlockLevel: 1, swatch: "#9c6240" },
  { value: "deep", label: "Deep", unlockLevel: 1, swatch: "#6b4128" },
  { value: "ebony", label: "Ebony", unlockLevel: 1, swatch: "#4a2c1c" },
  { value: "diamond", label: "Diamond", unlockLevel: 50, swatch: "#bdeefc" },
  { value: "gold", label: "Gold", unlockLevel: 100, swatch: "#e9c46a" },
];

export const HAIR_STYLES: AvatarOption<HairStyle>[] = [
  { value: "bald", label: "Bald", unlockLevel: 1 },
  { value: "short", label: "Short", unlockLevel: 1 },
  { value: "buzzcut", label: "Buzzcut", unlockLevel: 1 },
  { value: "long", label: "Long", unlockLevel: 1 },
  { value: "curly", label: "Curly", unlockLevel: 1 },
  { value: "ponytail", label: "Ponytail", unlockLevel: 1 },
  { value: "afro", label: "Afro", unlockLevel: 1 },
  { value: "bun", label: "Bun", unlockLevel: 1 },
  { value: "bangs", label: "Bangs", unlockLevel: 1 },
  { value: "dreadlocks", label: "Dreadlocks", unlockLevel: 1 },
  { value: "spiky", label: "Spiky", unlockLevel: 1 },
  { value: "mohawk", label: "Mohawk", unlockLevel: 5 },
  { value: "spikyPro", label: "Spiky Hair", unlockLevel: 10 },
  { value: "longWavy", label: "Long Wavy Hair", unlockLevel: 10 },
  { value: "samuraiBun", label: "Samurai Bun", unlockLevel: 20 },
  { value: "curlyFade", label: "Curly Fade", unlockLevel: 20 },
  { value: "lightningHair", label: "Lightning Hair", unlockLevel: 35 },
  { value: "frostedTips", label: "Frosted Tips", unlockLevel: 55 },
  { value: "platinumWaves", label: "Platinum Waves", unlockLevel: 75 },
  { value: "crystalHair", label: "Crystal Hair", unlockLevel: 90 },
];

export const HAIR_LENGTHS: AvatarOption<HairLength>[] = [
  { value: "short", label: "Short", unlockLevel: 1 },
  { value: "medium", label: "Medium", unlockLevel: 1 },
  { value: "long", label: "Long", unlockLevel: 1 },
];

export const HAIR_COLORS: AvatarOption<HairColor>[] = [
  { value: "black", label: "Black", unlockLevel: 1, swatch: "#1f1a17" },
  { value: "brown", label: "Brown", unlockLevel: 1, swatch: "#5b3a29" },
  { value: "blonde", label: "Blonde", unlockLevel: 1, swatch: "#e8c179" },
  { value: "red", label: "Red", unlockLevel: 1, swatch: "#b5482f" },
  { value: "gray", label: "Gray", unlockLevel: 1, swatch: "#9a9a9a" },
  { value: "blue", label: "Blue", unlockLevel: 5, swatch: "#3b82f6" },
  { value: "pink", label: "Pink", unlockLevel: 5, swatch: "#ec4899" },
  { value: "purple", label: "Purple", unlockLevel: 5, swatch: "#8b5cf6" },
  { value: "white", label: "White", unlockLevel: 5, swatch: "#f1f1f1" },
  { value: "green", label: "Green", unlockLevel: 5, swatch: "#22c55e" },
  { value: "gold", label: "Gold", unlockLevel: 15, swatch: "#d4af37" },
  { value: "silver", label: "Silver", unlockLevel: 15, swatch: "#c0c0c8" },
  { value: "neonRed", label: "Neon Red", unlockLevel: 15, swatch: "#ff1744" },
  { value: "rainbow", label: "Rainbow", unlockLevel: 30, swatch: "#f472b6" },
  { value: "galaxy", label: "Galaxy", unlockLevel: 30, swatch: "#6d28d9" },
  { value: "iceBlue", label: "Ice Blue", unlockLevel: 60, swatch: "#bae6fd" },
  { value: "obsidian", label: "Obsidian", unlockLevel: 85, swatch: "#1c1917" },
];

export const EYE_SHAPES: AvatarOption<EyeShape>[] = [
  { value: "round", label: "Round", unlockLevel: 1 },
  { value: "almond", label: "Almond", unlockLevel: 1 },
  { value: "sleepy", label: "Sleepy", unlockLevel: 1 },
  { value: "wide", label: "Wide", unlockLevel: 1 },
  { value: "narrow", label: "Narrow", unlockLevel: 1 },
  { value: "hooded", label: "Hooded", unlockLevel: 1 },
  { value: "cat", label: "Cat-Eye", unlockLevel: 1 },
];

export const EYE_COLORS: AvatarOption<EyeColor>[] = [
  { value: "brown", label: "Brown", unlockLevel: 1, swatch: "#5b3a29" },
  { value: "blue", label: "Blue", unlockLevel: 1, swatch: "#3b82f6" },
  { value: "green", label: "Green", unlockLevel: 1, swatch: "#22c55e" },
  { value: "hazel", label: "Hazel", unlockLevel: 1, swatch: "#a3793d" },
  { value: "gray", label: "Gray", unlockLevel: 1, swatch: "#9a9a9a" },
  { value: "amber", label: "Amber", unlockLevel: 1, swatch: "#f59e0b" },
  { value: "violet", label: "Violet", unlockLevel: 1, swatch: "#8b5cf6" },
];

export const EYEBROW_STYLES: AvatarOption<EyebrowStyle>[] = [
  { value: "straight", label: "Straight", unlockLevel: 1 },
  { value: "arched", label: "Arched", unlockLevel: 1 },
  { value: "thick", label: "Thick", unlockLevel: 1 },
  { value: "thin", label: "Thin", unlockLevel: 1 },
  { value: "bushy", label: "Bushy", unlockLevel: 1 },
  { value: "soft", label: "Soft", unlockLevel: 1 },
];

export const NOSE_STYLES: AvatarOption<NoseStyle>[] = [
  { value: "small", label: "Small", unlockLevel: 1 },
  { value: "button", label: "Button", unlockLevel: 1 },
  { value: "defined", label: "Defined", unlockLevel: 1 },
  { value: "wide", label: "Wide", unlockLevel: 1 },
  { value: "upturned", label: "Upturned", unlockLevel: 1 },
];

export const MOUTH_STYLES: AvatarOption<MouthStyle>[] = [
  { value: "smile", label: "Smile", unlockLevel: 1 },
  { value: "bigSmile", label: "Big Smile", unlockLevel: 1 },
  { value: "neutral", label: "Neutral", unlockLevel: 1 },
  { value: "smirk", label: "Smirk", unlockLevel: 1 },
  { value: "openSmile", label: "Open Smile", unlockLevel: 1 },
  { value: "pursed", label: "Pursed", unlockLevel: 1 },
  { value: "toothySmile", label: "Toothy Smile", unlockLevel: 1 },
  { value: "smolder", label: "Smolder", unlockLevel: 1 },
];

export const FACIAL_HAIR_STYLES: AvatarOption<FacialHairStyle>[] = [
  { value: "none", label: "None", unlockLevel: 1 },
  { value: "stubble", label: "Stubble", unlockLevel: 1 },
  { value: "mustache", label: "Mustache", unlockLevel: 1 },
  { value: "goatee", label: "Goatee", unlockLevel: 1 },
  { value: "soulPatch", label: "Soul Patch", unlockLevel: 1 },
  { value: "fullBeard", label: "Full Beard", unlockLevel: 1 },
];

export const CLOTHING_STYLES: AvatarOption<ClothingStyle>[] = [
  { value: "tshirt", label: "T-Shirt", unlockLevel: 1 },
  { value: "hoodie", label: "Hoodie", unlockLevel: 1 },
  { value: "oversizedHoodie", label: "Oversized Hoodie", unlockLevel: 1 },
  { value: "jacket", label: "Jacket", unlockLevel: 1 },
  { value: "polo", label: "Polo", unlockLevel: 1 },
  { value: "tank", label: "Tank Top", unlockLevel: 1 },
  { value: "graphicTee", label: "Graphic Tee", unlockLevel: 1 },
  { value: "tracksuit", label: "Tracksuit", unlockLevel: 1 },
  { value: "varsity", label: "Varsity Jacket", unlockLevel: 5 },
  { value: "jersey", label: "Jersey", unlockLevel: 5 },
  { value: "sportsHoodie", label: "Sports Hoodie", unlockLevel: 10 },
  { value: "trainingJacket", label: "Training Jacket", unlockLevel: 10 },
  { value: "brainLabHoodie", label: "Brain Lab Hoodie", unlockLevel: 15 },
  { value: "championHoodie", label: "Champion Hoodie", unlockLevel: 25 },
  { value: "eliteJersey", label: "Elite Jersey", unlockLevel: 25 },
  { value: "grandmasterRobe", label: "Grandmaster Robe", unlockLevel: 40 },
  { value: "trackJacket", label: "Track Jacket", unlockLevel: 60 },
  { value: "bomberJacket", label: "Bomber Jacket", unlockLevel: 70 },
  { value: "tuxedo", label: "Tuxedo", unlockLevel: 80 },
  { value: "winterJacket", label: "Winter Jacket", unlockLevel: 95 },
  { value: "tournamentVarsity", label: "Champion Varsity Jacket", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "diamondHoodie", label: "Diamond Hoodie", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "lightningJacket", label: "Lightning Jacket", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "goldChampionJacket", label: "Gold Champion Jacket", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "galaxyChampionHoodie", label: "Galaxy Champion Hoodie", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
];

export const PANTS_STYLES: AvatarOption<PantsStyle>[] = [
  { value: "jeans", label: "Jeans", unlockLevel: 1 },
  { value: "shorts", label: "Shorts", unlockLevel: 1 },
  { value: "joggers", label: "Joggers", unlockLevel: 1 },
  { value: "cargo", label: "Cargo Pants", unlockLevel: 1 },
  { value: "trackPants", label: "Track Pants", unlockLevel: 5 },
  { value: "cargoElite", label: "Tactical Cargo Pants", unlockLevel: 15 },
  { value: "eliteJoggers", label: "Elite Joggers", unlockLevel: 25 },
  { value: "suitPants", label: "Suit Pants", unlockLevel: 80 },
];

export const SHOE_STYLES: AvatarOption<ShoeStyle>[] = [
  { value: "sneakers", label: "Sneakers", unlockLevel: 1 },
  { value: "highTops", label: "High-Tops", unlockLevel: 1 },
  { value: "sandals", label: "Sandals", unlockLevel: 1 },
  { value: "boots", label: "Boots", unlockLevel: 5 },
  { value: "basketballShoes", label: "Basketball Shoes", unlockLevel: 10 },
  { value: "runningShoes", label: "Running Shoes", unlockLevel: 20 },
  { value: "goldenSneakers", label: "Golden Sneakers", unlockLevel: 35 },
  { value: "designerSneakers", label: "Designer Sneakers", unlockLevel: 65 },
  { value: "skateShoes", label: "Skate Shoes", unlockLevel: 85 },
];

export const CLOTHING_COLORS: AvatarOption<ClothingColor>[] = [
  { value: "red", label: "Red", unlockLevel: 1, swatch: "#ef4444" },
  { value: "blue", label: "Blue", unlockLevel: 1, swatch: "#3b82f6" },
  { value: "green", label: "Green", unlockLevel: 1, swatch: "#22c55e" },
  { value: "yellow", label: "Yellow", unlockLevel: 1, swatch: "#eab308" },
  { value: "purple", label: "Purple", unlockLevel: 1, swatch: "#8b5cf6" },
  { value: "black", label: "Black", unlockLevel: 1, swatch: "#1f1a17" },
  { value: "white", label: "White", unlockLevel: 1, swatch: "#f5f5f5" },
  { value: "orange", label: "Orange", unlockLevel: 1, swatch: "#f97316" },
];

export const ACCESSORIES: AvatarOption<AccessoryStyle>[] = [
  { value: "none", label: "None", unlockLevel: 1 },
  { value: "glasses", label: "Glasses", unlockLevel: 1 },
  { value: "headband", label: "Headband", unlockLevel: 1 },
  { value: "cap", label: "Cap", unlockLevel: 1 },
  { value: "snapback", label: "Snapback", unlockLevel: 1 },
  { value: "bucketHat", label: "Bucket Hat", unlockLevel: 1 },
  { value: "sunglasses", label: "Sunglasses", unlockLevel: 5 },
  { value: "hat", label: "Hat", unlockLevel: 5 },
  { value: "beanie", label: "Beanie", unlockLevel: 10 },
  { value: "crown", label: "Crown", unlockLevel: 10 },
  { value: "headphones", label: "Headphones", unlockLevel: 20 },
  { value: "sportsHeadband", label: "Sports Headband", unlockLevel: 20 },
  { value: "goldenCrown", label: "Golden Crown", unlockLevel: 30 },
  { value: "diamondCrown", label: "Diamond Crown", unlockLevel: 50 },
  { value: "silverChain", label: "Silver Chain", unlockLevel: 65 },
  { value: "smartWatch", label: "Smart Watch", unlockLevel: 65 },
  { value: "luxuryWatch", label: "Luxury Watch", unlockLevel: 90 },
  { value: "prestigeChain", label: "Prestige Chain", unlockLevel: 95 },
  { value: "goldChain", label: "Gold Chain", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "diamondChain", label: "Diamond Chain", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "championMedal", label: "Champion Medal", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "platinumNecklace", label: "Platinum Necklace", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "sportWatch", label: "Sport Watch", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "goldWatch", label: "Gold Watch", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "diamondWatch", label: "Diamond Watch", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "championWatch", label: "Champion Watch", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "goldenLaurelCrown", label: "Golden Laurel Crown", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "championHeadband", label: "Champion Headband", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "animatedCrown", label: "Animated Crown", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
  { value: "championGlasses", label: "Champion Glasses", unlockLevel: EXCLUSIVE_UNLOCK_LEVEL, exclusive: true },
];

export const BACKGROUNDS: AvatarOption<BackgroundStyle>[] = [
  { value: "solid-sky", label: "Sky", unlockLevel: 1, swatch: "#bfe3f7" },
  { value: "solid-mint", label: "Mint", unlockLevel: 1, swatch: "#c4f0d8" },
  { value: "solid-blush", label: "Blush", unlockLevel: 1, swatch: "#fbd5dd" },
  { value: "solid-sun", label: "Sun", unlockLevel: 1, swatch: "#fde68a" },
  { value: "solid-lavender", label: "Lavender", unlockLevel: 1, swatch: "#ddd6fe" },
  { value: "solid-slate", label: "Slate", unlockLevel: 1, swatch: "#cbd5e1" },
  { value: "gradient-sunset", label: "Sunset", unlockLevel: 1 },
  { value: "gradient-ocean", label: "Ocean", unlockLevel: 1 },
  { value: "gradient-candy", label: "Candy", unlockLevel: 5 },
  { value: "gradient-forest", label: "Forest", unlockLevel: 5 },
  { value: "gradient-ocean-deep", label: "Ocean Gradient", unlockLevel: 10 },
  { value: "gradient-sunset-blaze", label: "Sunset Gradient", unlockLevel: 10 },
  { value: "city-lights", label: "City Lights", unlockLevel: 20 },
  { value: "basketball-court", label: "Basketball Court", unlockLevel: 20 },
  { value: "chess-board", label: "Chess Board", unlockLevel: 35 },
  { value: "neon-arena", label: "Neon Arena", unlockLevel: 35 },
  { value: "galaxy", label: "Galaxy", unlockLevel: 50 },
  { value: "golden-trophy-room", label: "Golden Trophy Room", unlockLevel: 50 },
  { value: "stadium", label: "Stadium", unlockLevel: 55 },
  { value: "space-station", label: "Space Station", unlockLevel: 70 },
  { value: "esports-stage", label: "Esports Stage", unlockLevel: 80 },
  { value: "luxury-penthouse", label: "Luxury Penthouse", unlockLevel: 95 },
];
