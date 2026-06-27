export const SEASON_TIER_COUNT = 100;
/** Every tier costs the same Season XP, so progression feels smooth and predictable. */
export const SEASON_XP_PER_TIER = 200;

export type SeasonRewardKind =
  | "coins"
  | "xp"
  | "pet"
  | "petSkin"
  | "hairstyle"
  | "hairColor"
  | "clothing"
  | "accessory"
  | "banner"
  | "border"
  | "animatedBorder"
  | "victoryAnimation"
  | "avatarEffect"
  | "title"
  | "animatedNameColor"
  | "badge";

export interface SeasonReward {
  tier: number;
  kind: SeasonRewardKind;
  /** Stable id for this reward, namespaced by theme so it's truly exclusive to one season and never repeats. */
  id: string;
  label: string;
  /** Coin/XP amount for filler reward kinds; undefined for cosmetics. */
  amount?: number;
}

/**
 * Milestone tiers that grant an exclusive cosmetic, matching the spec's
 * example track. Every other tier (besides the explicit filler tiers below)
 * defaults to a small coin or XP reward so every tier always rewards
 * something.
 */
const MILESTONES: { tier: number; kind: SeasonRewardKind; label: (themeName: string) => string }[] = [
  { tier: 3, kind: "banner", label: (t) => `${t} Banner` },
  { tier: 5, kind: "pet", label: (t) => `${t} Fox` },
  { tier: 10, kind: "animatedNameColor", label: () => "Animated Blue Name Color" },
  { tier: 15, kind: "coins", label: () => "250 Coins" },
  { tier: 20, kind: "clothing", label: (t) => `${t} Astronaut Outfit` },
  { tier: 30, kind: "border", label: (t) => `${t} Border` },
  { tier: 40, kind: "pet", label: (t) => `Cosmic ${t} Dragon Pet` },
  { tier: 50, kind: "avatarEffect", label: (t) => `Animated ${t} Avatar Effect` },
  { tier: 60, kind: "petSkin", label: (t) => `${t} Pet Skin` },
  { tier: 70, kind: "hairColor", label: (t) => `${t} Hair Color` },
  { tier: 75, kind: "accessory", label: () => "Legendary Helmet" },
  { tier: 80, kind: "victoryAnimation", label: (t) => `${t} Victory Animation` },
  { tier: 90, kind: "animatedBorder", label: (t) => `Animated ${t} Border` },
];

function coinAmountForTier(tier: number): number {
  return tier === 1 ? 100 : 50 + (tier % 5) * 10;
}

function xpAmountForTier(tier: number): number {
  return tier === 2 ? 50 : 25 + (tier % 4) * 10;
}

/**
 * Builds the full 100-tier reward track for a season, namespacing every
 * exclusive cosmetic id with the theme id so it can never be earned again
 * once the season ends (a new season's track uses entirely new ids, even
 * for the "same" reward kind).
 */
export function buildSeasonRewardTrack(themeId: string, themeName: string): SeasonReward[] {
  const milestoneByTier = new Map(MILESTONES.map((m) => [m.tier, m]));
  const track: SeasonReward[] = [];

  for (let tier = 1; tier <= SEASON_TIER_COUNT; tier++) {
    const milestone = milestoneByTier.get(tier);
    if (milestone) {
      if (milestone.kind === "coins") {
        track.push({ tier, kind: "coins", id: `${themeId}-t${tier}-coins`, label: milestone.label(themeName), amount: 250 });
      } else {
        track.push({ tier, kind: milestone.kind, id: `${themeId}-t${tier}-${milestone.kind}`, label: milestone.label(themeName) });
      }
      continue;
    }

    if (tier === SEASON_TIER_COUNT) {
      // Grand finale: multiple exclusive rewards on the final tier.
      track.push({ tier, kind: "clothing", id: `${themeId}-t100-outfit`, label: `${themeName} Champion Outfit` });
      continue;
    }

    // Filler tiers alternate between small coin and XP rewards so every
    // tier rewards something, even between milestones.
    if (tier % 2 === 0) {
      track.push({ tier, kind: "xp", id: `${themeId}-t${tier}-xp`, label: `${xpAmountForTier(tier)} XP`, amount: xpAmountForTier(tier) });
    } else {
      track.push({ tier, kind: "coins", id: `${themeId}-t${tier}-coins`, label: `${coinAmountForTier(tier)} Coins`, amount: coinAmountForTier(tier) });
    }
  }

  return track;
}

/** Tier 100 grants extra exclusive rewards beyond the single track slot — the title and animated border called out in the spec. */
export function bonusFinaleRewards(themeId: string, themeName: string): SeasonReward[] {
  return [
    { tier: SEASON_TIER_COUNT, kind: "animatedBorder", id: `${themeId}-t100-border`, label: `Legendary Animated ${themeName} Border` },
    { tier: SEASON_TIER_COUNT, kind: "title", id: `${themeId}-t100-title`, label: `${themeName} Champion` },
  ];
}

export function seasonLevelForXp(xp: number): number {
  return Math.max(1, Math.min(SEASON_TIER_COUNT, Math.floor(xp / SEASON_XP_PER_TIER) + 1));
}

export function xpIntoCurrentTier(xp: number): number {
  return xp % SEASON_XP_PER_TIER;
}

export function xpRequiredForNextTier(): number {
  return SEASON_XP_PER_TIER;
}
