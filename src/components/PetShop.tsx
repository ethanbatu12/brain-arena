import { lazy, Suspense, useState } from "react";
import type { PlayerProfile } from "../player/types";
import { PET_CATALOG, getPetDef } from "../pets/catalog";
import { RARITY_COLORS, RARITY_LABELS, RARITY_ORDER, PET_EMOJI } from "../pets/rarity";
import { canPurchase, collectionStats } from "../pets/collection";
import { MAX_PET_ACCESSORY_SLOTS, PET_ACCESSORIES, unlockedPetAccessories } from "../pets/accessories";
import { AvatarSvg } from "./AvatarSvg";
import { PetBadge } from "./PetBadge";

const Pet3D = lazy(() => import("./Pet3D").then((m) => ({ default: m.Pet3D })));

type PetShopTab = "shop" | "collection" | "customize";

interface PetShopProps {
  profile: PlayerProfile;
  onBack: () => void;
  onBuyPet: (petId: string) => { ok: true } | { ok: false; error: "already-owned" | "not-enough-coins" | "unknown-pet" };
  onEquipPet: (petId: string | null) => void;
  onSetPetAccessories: (accessoryIds: string[]) => void;
  initialTab?: PetShopTab;
}

const PURCHASE_ERROR_LABEL: Record<string, string> = {
  "already-owned": "You already own this pet.",
  "not-enough-coins": "Not enough coins.",
  "unknown-pet": "Unknown pet.",
};

export function PetShop({ profile, onBack, onBuyPet, onEquipPet, onSetPetAccessories, initialTab = "shop" }: PetShopProps) {
  const [tab, setTab] = useState<PetShopTab>(initialTab);
  const [selectedId, setSelectedId] = useState<string>(PET_CATALOG[0].id);
  const [message, setMessage] = useState<string | null>(null);

  const selected = getPetDef(selectedId) ?? PET_CATALOG[0];
  const owned = profile.ownedPets.includes(selected.id);
  const stats = collectionStats(profile.ownedPets);

  const handleBuy = () => {
    const result = onBuyPet(selected.id);
    setMessage(result.ok ? `${selected.name} purchased!` : PURCHASE_ERROR_LABEL[result.error]);
  };

  return (
    <div className="app__shell">
      <div className="screen-header">
        <button className="btn btn--ghost" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Pet Shop</h1>
        <span className="home__coins-badge" title="Coins">
          🪙 {profile.coins.toLocaleString()}
        </span>
      </div>

      <div className="pet-shop__tabs">
        <button className={`btn ${tab === "shop" ? "btn--primary" : "btn--ghost"}`} onClick={() => setTab("shop")}>
          Shop
        </button>
        <button
          className={`btn ${tab === "collection" ? "btn--primary" : "btn--ghost"}`}
          onClick={() => setTab("collection")}
        >
          My Collection ({stats.owned}/{stats.total} · {stats.percent}%)
        </button>
        <button
          className={`btn ${tab === "customize" ? "btn--primary" : "btn--ghost"}`}
          onClick={() => setTab("customize")}
        >
          Customize Pet
        </button>
      </div>

      {tab === "shop" && (
        <div className="pet-shop">
          <div className="pet-shop__preview">
            <div className="pet-shop__preview-row">
              <AvatarSvg config={profile.avatarConfig} size={120} />
              <Suspense fallback={<div style={{ height: 220, flex: 1 }} />}>
                <div style={{ flex: 1 }}>
                  <Pet3D rarity={selected.rarity} />
                </div>
              </Suspense>
            </div>
            <h2 style={{ color: RARITY_COLORS[selected.rarity][0] }}>{selected.name}</h2>
            <p className="pet-shop__rarity" style={{ color: RARITY_COLORS[selected.rarity][0] }}>
              {RARITY_LABELS[selected.rarity]}
            </p>
            <p className="pet-shop__price">🪙 {selected.price.toLocaleString()}</p>
            {message && <p className="pet-shop__message">{message}</p>}
            {owned ? (
              <button
                className="btn btn--primary"
                onClick={() => {
                  onEquipPet(profile.equippedPet === selected.id ? null : selected.id);
                }}
              >
                {profile.equippedPet === selected.id ? "Unequip" : "Equip"}
              </button>
            ) : (
              <button
                className="btn btn--primary"
                disabled={!canPurchase(selected.id, profile.coins, profile.ownedPets).ok}
                onClick={handleBuy}
              >
                Buy
              </button>
            )}
          </div>

          {RARITY_ORDER.map((rarity) => (
            <div key={rarity} className="pet-shop__rarity-group">
              <h3 style={{ color: RARITY_COLORS[rarity][0] }}>{RARITY_LABELS[rarity]}</h3>
              <div className="pet-shop__grid">
                {PET_CATALOG.filter((p) => p.rarity === rarity).map((pet) => {
                  const isOwned = profile.ownedPets.includes(pet.id);
                  return (
                    <button
                      key={pet.id}
                      className={`pet-card${pet.id === selectedId ? " pet-card--selected" : ""}`}
                      style={{ borderColor: RARITY_COLORS[pet.rarity][0] }}
                      onClick={() => {
                        setSelectedId(pet.id);
                        setMessage(null);
                      }}
                    >
                      <span className="pet-card__emoji">{PET_EMOJI[pet.species]}</span>
                      <span className="pet-card__name">{pet.name}</span>
                      <span className="pet-card__price">{isOwned ? "Owned" : `🪙 ${pet.price}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "collection" && (
        <div className="pet-shop">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{stats.owned}</span>
              <span className="stat__label">Pets owned</span>
            </div>
            <div className="stat">
              <span className="stat__value">{stats.total}</span>
              <span className="stat__label">Total available</span>
            </div>
            <div className="stat">
              <span className="stat__value">{stats.percent}%</span>
              <span className="stat__label">Completion</span>
            </div>
          </div>
          <div className="pet-shop__grid">
            {PET_CATALOG.filter((p) => profile.ownedPets.includes(p.id)).map((pet) => (
              <button
                key={pet.id}
                className={`pet-card${profile.equippedPet === pet.id ? " pet-card--selected" : ""}`}
                style={{ borderColor: RARITY_COLORS[pet.rarity][0] }}
                onClick={() => onEquipPet(profile.equippedPet === pet.id ? null : pet.id)}
              >
                <span className="pet-card__emoji">{PET_EMOJI[pet.species]}</span>
                <span className="pet-card__name">{pet.name}</span>
                <span className="pet-card__price">{profile.equippedPet === pet.id ? "Equipped" : "Tap to equip"}</span>
              </button>
            ))}
            {stats.owned === 0 && <p>No pets owned yet — visit the Shop tab to buy your first one!</p>}
          </div>
        </div>
      )}

      {tab === "customize" && (
        <div className="pet-shop">
          {profile.equippedPet ? (
            <>
              <div className="pet-shop__preview">
                <PetBadge petId={profile.equippedPet} accessoryIds={profile.petAccessories} size={48} />
                <p>
                  {profile.petAccessories.length}/{MAX_PET_ACCESSORY_SLOTS} accessory slots worn
                </p>
              </div>
              <div className="pet-shop__grid">
                {PET_ACCESSORIES.map((accessory) => {
                  const unlocked = unlockedPetAccessories(profile.level).some((a) => a.id === accessory.id);
                  const equipped = profile.petAccessories.includes(accessory.id);
                  const atCap = profile.petAccessories.length >= MAX_PET_ACCESSORY_SLOTS;
                  return (
                    <button
                      key={accessory.id}
                      className={`pet-card${equipped ? " pet-card--selected" : ""}`}
                      disabled={!unlocked || (!equipped && atCap)}
                      onClick={() => {
                        const next = equipped
                          ? profile.petAccessories.filter((id) => id !== accessory.id)
                          : [...profile.petAccessories, accessory.id];
                        onSetPetAccessories(next);
                      }}
                    >
                      <span className="pet-card__emoji">{unlocked ? accessory.emoji : "🔒"}</span>
                      <span className="pet-card__name">{accessory.label}</span>
                      <span className="pet-card__price">
                        {unlocked ? (equipped ? "Worn — tap to remove" : "Tap to wear") : `Unlocks at level ${accessory.unlockLevel}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p>Equip a pet first (Shop or Collection tab) before customizing it.</p>
          )}
        </div>
      )}
    </div>
  );
}
