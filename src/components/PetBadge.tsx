import { getPetDef } from "../pets/catalog";
import { PET_EMOJI } from "../pets/rarity";
import { getPetAccessoryDef } from "../pets/accessories";
import { emojiForSeasonPetId } from "../season/rewards";

interface PetBadgeProps {
  petId: string | null;
  accessoryIds: string[];
  /** The pet's display name (custom name if renamed, otherwise its catalog default). */
  name?: string;
  /** Renders the name as visible text next to the emoji, instead of only as a hover tooltip. */
  showName?: boolean;
  size?: number;
  className?: string;
}

/**
 * The small emoji "avatar" for a player's equipped pet, with its
 * accessories, shared across Hub/Profile/Leaderboard. Pets not in the
 * purchasable catalog (Season Pass exclusives) still get their real
 * species emoji via emojiForSeasonPetId — that's what keeps them
 * unobtainable any other way while still looking like an actual pet
 * rather than a generic placeholder icon.
 */
export function PetBadge({ petId, accessoryIds, name, showName = false, size = 22, className }: PetBadgeProps) {
  if (!petId) return null;
  const pet = getPetDef(petId);
  const displayName = name ?? pet?.name ?? "Pet";
  const emoji = pet ? PET_EMOJI[pet.species] : emojiForSeasonPetId(petId) ?? "✨";
  return (
    <span className={`pet-badge-wrap${className ? ` ${className}` : ""}`}>
      <span className="pet-badge-icon" style={{ fontSize: size }} title={displayName}>
        {emoji}
        {accessoryIds.map((id) => {
          const def = getPetAccessoryDef(id);
          if (!def) return null;
          return (
            <span key={id} className="pet-badge-icon__accessory" style={{ fontSize: size * 0.55 }} title={def.label}>
              {def.emoji}
            </span>
          );
        })}
      </span>
      {showName && <span className="pet-badge-icon__name">{displayName}</span>}
    </span>
  );
}
