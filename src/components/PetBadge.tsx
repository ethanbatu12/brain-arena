import { getPetDef } from "../pets/catalog";
import { getPetAccessoryDef } from "../pets/accessories";
import { PetSvg } from "./PetSvg";

interface PetBadgeProps {
  petId: string | null;
  accessoryIds: string[];
  /** The pet's display name (custom name if renamed, otherwise its catalog default). */
  name?: string;
  /** Renders the name as visible text next to the icon, instead of only as a hover tooltip. */
  showName?: boolean;
  size?: number;
  className?: string;
}

/**
 * The small "avatar" for a player's equipped pet, with its accessories,
 * shared across Hub/Profile/Leaderboard/Pet Shop. Renders a real 2D
 * illustration (PetSvg) shaped per species — a fox actually looks like a
 * fox — not a single generic emoji glyph. Pets not in the purchasable
 * catalog (Season Pass exclusives) resolve the same way since PetSvg
 * accepts either a catalog species or a season-exclusive pet id directly.
 */
export function PetBadge({ petId, accessoryIds, name, showName = false, size = 22, className }: PetBadgeProps) {
  if (!petId) return null;
  const pet = getPetDef(petId);
  const displayName = name ?? pet?.name ?? "Pet";
  return (
    <span className={`pet-badge-wrap${className ? ` ${className}` : ""}`}>
      <span className="pet-badge-icon" title={displayName}>
        <PetSvg species={pet ? pet.species : petId} size={size} />
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
