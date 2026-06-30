import { GAMES } from "../games";
import type { PlayerProfile } from "../player/types";
import { getBorderDef } from "../player/borders";
import { titleColors, titleForLevel } from "../xp/levels";
import { petDisplayName } from "../pets/naming";
import { AvatarSvg } from "./AvatarSvg";
import { PetBadge } from "./PetBadge";
import { XpBar } from "./XpBar";

interface PublicProfileProps {
  profile: PlayerProfile;
  onBack: () => void;
}

/** Read-only view of another player's stats and level — reached by clicking their row on the leaderboard. */
export function PublicProfile({ profile, onBack }: PublicProfileProps) {
  const border = getBorderDef(profile.profileBorder, profile.exclusiveCosmetics);
  const title = profile.selectedTitle || titleForLevel(profile.level);

  return (
    <div className="app__shell">
      <div className="app__head">
        <div>
          <h1 className="app__logo">
            Player<span>.</span>
          </h1>
          <p className="app__tag">Viewing {profile.username}'s profile</p>
        </div>
        <button className="app__back" onClick={onBack}>
          ‹ Back to leaderboard
        </button>
      </div>

      <section className="profile__section">
        <div className="profile__avatar">
          <div
            className="profile__avatar-frame"
            style={{ boxShadow: border.id === "none" ? undefined : `0 0 0 5px ${border.colors[0]}, 0 0 0 8px ${border.colors[1]}` }}
          >
            <AvatarSvg config={profile.avatarConfig} size={120} />
            {profile.equippedPet && (
              <PetBadge
                petId={profile.equippedPet}
                accessoryIds={profile.petAccessories}
                name={petDisplayName(profile.petNames, profile.equippedPet)}
                size={26}
                className="pet-badge"
              />
            )}
          </div>
          <p className="public-profile__name" style={{ color: border.id === "none" ? undefined : border.colors[0] }}>
            {profile.username}
          </p>
          <p className="public-profile__title" style={{ color: titleColors(title)[0] }}>
            {title}
          </p>
        </div>
      </section>

      <section className="profile__section">
        <h2 className="profile__section-title">Level & XP</h2>
        <XpBar xp={profile.xp} selectedTitle={profile.selectedTitle} />
      </section>

      <section className="profile__section">
        <h2 className="profile__section-title">Stats</h2>
        <div className="hud__stats">
          <div className="stat">
            <span className="stat__value">{profile.overallBestScore}</span>
            <span className="stat__label">Overall best</span>
          </div>
          <div className="stat">
            <span className="stat__value">{profile.combinedBestScore}</span>
            <span className="stat__label">Challenge score</span>
          </div>
          <div className="stat">
            <span className="stat__value">{profile.totalGamesPlayed}</span>
            <span className="stat__label">Games played</span>
          </div>
          <div className="stat">
            <span className="stat__value">{profile.streak.longestStreak}</span>
            <span className="stat__label">Longest streak</span>
          </div>
          <div className="stat">
            <span className="stat__value">{profile.ratedPatterns.rating}</span>
            <span className="stat__label">Pattern rating</span>
          </div>
          <div className="stat">
            <span className="stat__value">{profile.ratedPuzzles.rating}</span>
            <span className="stat__label">Chess rating</span>
          </div>
        </div>
      </section>

      <section className="profile__section">
        <h2 className="profile__section-title">Game Bests</h2>
        <div className="profile__games">
          {GAMES.map((g) => (
            <div key={g.id} className="profile__game" style={{ ["--card-accent" as string]: g.accent }}>
              <span className="gamecard__tag">{g.tag}</span>
              <span className="gamecard__name">{g.name}</span>
              <div className="hud__stats profile__game-stats">
                <div className="stat">
                  <span className="stat__value">{profile.games[g.id].bestScore}</span>
                  <span className="stat__label">Best</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{profile.games[g.id].gamesPlayed}</span>
                  <span className="stat__label">Played</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
