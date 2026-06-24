export type FaceShape = "round" | "oval" | "square" | "heart" | "diamond";
export type SkinTone = "porcelain" | "light" | "tan" | "honey" | "brown" | "deep";

export type HairStyle =
  | "bald" | "short" | "long" | "curly" | "ponytail" | "buzzcut" | "mohawk"
  | "afro" | "bun" | "bangs" | "dreadlocks" | "spiky";
export type HairLength = "short" | "medium" | "long";
export type HairColor =
  | "black" | "brown" | "blonde" | "red" | "gray" | "blue" | "pink" | "purple" | "white" | "green";

export type EyeShape = "round" | "almond" | "sleepy" | "wide" | "narrow";
export type EyeColor = "brown" | "blue" | "green" | "hazel" | "gray" | "amber" | "violet";
export type EyebrowStyle = "straight" | "arched" | "thick" | "thin";

export type NoseStyle = "small" | "button" | "defined" | "wide" | "upturned";

export type MouthStyle = "smile" | "bigSmile" | "neutral" | "smirk" | "openSmile" | "pursed";

export type ClothingStyle =
  | "tshirt" | "hoodie" | "jacket" | "jersey"
  | "tracksuit" | "varsity" | "polo" | "tank" | "graphicTee" | "oversizedHoodie"
  | "brainLabHoodie";
export type ClothingColor = "red" | "blue" | "green" | "yellow" | "purple" | "black" | "white" | "orange";

export type PantsStyle = "jeans" | "shorts" | "joggers" | "trackPants" | "cargo";

export type ShoeStyle = "sneakers" | "highTops" | "boots" | "sandals";

export type AccessoryStyle =
  | "none" | "glasses" | "sunglasses" | "hat" | "headband" | "beanie"
  | "cap" | "snapback" | "bucketHat" | "crown";

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
  | "gradient-forest";

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
  "clothing",
  "accessories",
  "background",
] as const;

export type AvatarCategory = (typeof AVATAR_CATEGORIES)[number];
