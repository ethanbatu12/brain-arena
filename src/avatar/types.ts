export type FaceShape =
  | "round" | "oval" | "square" | "heart" | "diamond"
  | "long" | "chubby" | "squareJaw" | "triangle";
export type SkinTone =
  | "porcelain" | "light" | "tan" | "honey" | "brown" | "deep"
  | "fair" | "almond" | "caramel" | "ebony"
  | "diamond" | "gold";

export type HairStyle =
  | "bald" | "short" | "long" | "curly" | "ponytail" | "buzzcut" | "mohawk"
  | "afro" | "bun" | "bangs" | "dreadlocks" | "spiky"
  | "spikyPro" | "longWavy" | "samuraiBun" | "curlyFade" | "lightningHair";
export type HairLength = "short" | "medium" | "long";
export type HairColor =
  | "black" | "brown" | "blonde" | "red" | "gray" | "blue" | "pink" | "purple" | "white" | "green"
  | "gold" | "silver" | "neonRed" | "rainbow" | "galaxy";

export type EyeShape = "round" | "almond" | "sleepy" | "wide" | "narrow" | "hooded" | "cat";
export type EyeColor = "brown" | "blue" | "green" | "hazel" | "gray" | "amber" | "violet";
export type EyebrowStyle = "straight" | "arched" | "thick" | "thin" | "bushy" | "soft";

export type NoseStyle = "small" | "button" | "defined" | "wide" | "upturned";

export type MouthStyle = "smile" | "bigSmile" | "neutral" | "smirk" | "openSmile" | "pursed" | "toothySmile" | "smolder";

export type FacialHairStyle = "none" | "stubble" | "mustache" | "goatee" | "fullBeard" | "soulPatch";

export type ClothingStyle =
  | "tshirt" | "hoodie" | "jacket" | "jersey"
  | "tracksuit" | "varsity" | "polo" | "tank" | "graphicTee" | "oversizedHoodie"
  | "brainLabHoodie"
  | "sportsHoodie" | "trainingJacket" | "championHoodie" | "eliteJersey" | "grandmasterRobe"
  // Weekly Tournament exclusives — only ever earned by placing top 3, never unlocked by leveling.
  | "tournamentVarsity" | "diamondHoodie" | "lightningJacket" | "goldChampionJacket" | "galaxyChampionHoodie";
export type ClothingColor = "red" | "blue" | "green" | "yellow" | "purple" | "black" | "white" | "orange";

export type PantsStyle = "jeans" | "shorts" | "joggers" | "trackPants" | "cargo" | "cargoElite" | "eliteJoggers";

export type ShoeStyle = "sneakers" | "highTops" | "boots" | "sandals" | "basketballShoes" | "runningShoes" | "goldenSneakers";

export type AccessoryStyle =
  | "none" | "glasses" | "sunglasses" | "hat" | "headband" | "beanie"
  | "cap" | "snapback" | "bucketHat" | "crown"
  | "headphones" | "sportsHeadband" | "goldenCrown" | "diamondCrown"
  // Weekly Tournament exclusives — only ever earned by placing top 3, never unlocked by leveling.
  | "goldChain" | "diamondChain" | "championMedal" | "platinumNecklace"
  | "sportWatch" | "goldWatch" | "diamondWatch" | "championWatch"
  | "goldenLaurelCrown" | "championHeadband" | "animatedCrown" | "championGlasses";

export type BackgroundStyle =
  | "solid-sky"
  | "solid-mint"
  | "solid-blush"
  | "solid-sun"
  | "solid-lavender"
  | "solid-slate"
  | "gradient-sunset"
  | "gradient-ocean"
  | "gradient-candy"
  | "gradient-forest"
  | "gradient-ocean-deep"
  | "gradient-sunset-blaze"
  | "city-lights"
  | "basketball-court"
  | "chess-board"
  | "neon-arena"
  | "galaxy"
  | "golden-trophy-room";

export interface AvatarConfig {
  faceShape: FaceShape;
  skinTone: SkinTone;
  freckles: boolean;
  blush: boolean;

  hairStyle: HairStyle;
  hairLength: HairLength;
  hairColor: HairColor;

  eyeShape: EyeShape;
  eyeColor: EyeColor;
  eyebrowStyle: EyebrowStyle;

  noseStyle: NoseStyle;

  mouthStyle: MouthStyle;

  facialHair: FacialHairStyle;

  clothingStyle: ClothingStyle;
  clothingColor: ClothingColor;

  pantsStyle: PantsStyle;
  pantsColor: ClothingColor;

  shoeStyle: ShoeStyle;
  shoeColor: ClothingColor;

  accessory: AccessoryStyle;

  background: BackgroundStyle;
}

/** Every customizable avatar category, used to drive the editor's category tabs. */
export const AVATAR_CATEGORIES = [
  "face",
  "hair",
  "eyes",
  "nose",
  "mouth",
  "facialHair",
  "clothing",
  "accessories",
  "background",
] as const;

export type AvatarCategory = (typeof AVATAR_CATEGORIES)[number];
