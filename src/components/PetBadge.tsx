import { getPetDef } from "../pets/catalog";
import { PET_EMOJI } from "../pets/rarity";
import { getPetAccessoryDef } from "../pets/accessories";

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
 * accessories, shared across Hub/Profile/Leaderboard. Falls back to a
 * generic sparkle emoji for pets not in the purchasable catalog (e.g.
 * Season Pass-exclusive pets), so those still render correctly even
 * though they have no catalog entry — that's exactly what keeps them
 * unobtainable any other way.
 */
export function PetBadge({ petId, accessoryIds, name, showName = false, size = 22, className }: PetBadgeProps) {
  if (!petId) return null;
  const pet = getPetDef(petId);
  const displayName = name ?? pet?.name ?? "Pet";
  const emoji = pet ? PET_EMOJI[pet.species] : "✨";
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
