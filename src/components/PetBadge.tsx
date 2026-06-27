import { getPetDef } from "../pets/catalog";
import { PET_EMOJI } from "../pets/rarity";
import { getPetAccessoryDef } from "../pets/accessories";

interface PetBadgeProps {
  petId: string | null;
  accessoryIds: string[];
  size?: number;
  className?: string;
}

/** The small emoji "avatar" for a player's equipped pet, with its accessories, shared across Hub/Profile/Leaderboard. */
export function PetBadge({ petId, accessoryIds, size = 22, className }: PetBadgeProps) {
  const pet = petId ? getPetDef(petId) : undefined;
  if (!pet) return null;
  return (
    <span className={`pet-badge-icon${className ? ` ${className}` : ""}`} style={{ fontSize: size }} title={pet.name}>
      {PET_EMOJI[pet.species]}
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
  );
}
