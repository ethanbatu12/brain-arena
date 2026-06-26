import { CHALLENGE_META, GAMES } from "../games";
import { getDailyGameId, getTodaysDailyRecord } from "../player/dailyChallenge";
import { getToday } from "../player/streak";
import type { GameId, PlayerProfile } from "../player/types";
import { AvatarSvg } from "./AvatarSvg";
import { XpBar } from "./XpBar";
import { DailyChallengesWidget } from "./DailyChallengesWidget";
import { WeeklyTournamentCard } from "./WeeklyTournamentCard";
import { getPetDef } from "../pets/catalog";
import { PET_EMOJI } from "../pets/rarity";

interface HubProps {
  profile: PlayerProfile;
  onPick: (id: GameId | "challenge") => void;
  onChess: () => void;
  onProfile: () => void;
  onDb: () => void;
  onLeaderboard: () => void;
  onTournament: () => void;
  onPetShop: () => void;
  onSignOut: () => void;
}

export function Hub({
  profile,
  onPick,
  onChess,
  onProfile,
  onDb,
  onLeaderboard,
  onTournament,
  onPetShop,
  onSignOut,
}: HubProps) {
  const today = getToday();
  const dailyGameId = getDailyGameId(today);
  const dailyGameMeta = GAMES.find((g) => g.id === dailyGameId)!;
  const dailyRecord = getTodaysDailyRecord(profile, today);
  const { currentStreak, longestStreak } = profile.streak;

  return (
    <div className="app__shell home">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="home__head">
        <div className="home__brand">
          <h1 className="home__title">
            Brain<span>Arena</span>
          </h1>
        </div>
        <div className="home__player-actions">
          <span className="home__coins-badge" title="Coins">
            🪙 {profile.coins}
          </span>
          <button className="btn btn--ghost" onClick={onProfile}>
            Profile
          </button>
          <button className="btn btn--ghost" onClick={onLeaderboard}>
            Leaderboard
          </button>
          <button className="btn btn--ghost" onClick={onTournament}>
            Tournament
          </button>
          <button className="btn btn--ghost" onClick={onPetShop}>
            Pet Shop
          </button>
          <button className="btn btn--ghost" onClick={onDb}>
            Database
          </button>
          <button className="btn btn--ghost" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Player greeting ─────────────────────────────────────────── */}
      <div className="home__player">
        <div className="home__avatar">
          <AvatarSvg config={profile.avatarConfig} size={56} />
          {profile.equippedPet && getPetDef(profile.equippedPet) && (
            <span className="home__pet-badge" title={getPetDef(profile.equippedPet)!.name}>
              {PET_EMOJI[getPetDef(profile.equippedPet)!.species]}
            </span>
          )}
        </div>
        <div className="home__player-info">
          <p className="home__greeting">
            Welcome back, <strong>{profile.username}</strong>
          </p>
          <div className="home__streak-row">
            <span className="home__streak-badge" title={`Longest streak: ${longestStreak} days`}>
              🔥 {Math.max(currentStreak, 1)} day streak
            </span>
            {longestStreak > currentStreak && (
              <span className="home__streak-best">Best: {longestStreak}</span>
            )}
          </div>
        </div>
      </div>

      <XpBar xp={profile.xp} selectedTitle={profile.selectedTitle} />

      <WeeklyTournamentCard username={profile.username} onView={onTournament} />

      {profile.tripleChallenges.challenges.length > 0 && (
        <DailyChallengesWidget challenges={profile.tripleChallenges} streak={profile.challengeStreak} />
      )}

      {/* ── Quick stats ─────────────────────────────────────────────── */}
      <div className="home__summary hud__stats">
        <div className="stat">
          <span className="stat__value">{profile.overallBestScore}</span>
          <span className="stat__label">Overall best</span>
        </div>
        <div className="stat">
          <span className="stat__value">{profile.totalGamesPlayed}</span>
          <span className="stat__label">Games played</span>
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

      {/* ── Daily challenge card ─────────────────────────────────────── */}
      <button
        className={`daily-card${dailyRecord?.completed ? " daily-card--done" : ""}`}
        style={{ ["--card-accent" as string]: dailyGameMeta.accent }}
        onClick={() => onPick(dailyGameId)}
        aria-label="Today's Challenge"
      >
        <div className="daily-card__left">
          <span className="daily-card__label">Today's Challenge</span>
          <span className="daily-card__game">{dailyGameMeta.name}</span>
          {dailyRecord?.completed ? (
            <span className="daily-card__status">✓ Completed — best {dailyRecord.score}</span>
          ) : (
            <span className="daily-card__status">Tap to play</span>
          )}
        </div>
        <span className="daily-card__cta">{dailyRecord?.completed ? "✓" : "›"}</span>
      </button>

      {/* ── All Games Challenge ──────────────────────────────────────── */}
      <button
        className="gamecard gamecard--featured"
        style={{ ["--card-accent" as string]: CHALLENGE_META.accent }}
        onClick={() => onPick("challenge")}
      >
        <span className="gamecard__tag">{CHALLENGE_META.tag}</span>
        <span className="gamecard__name">{CHALLENGE_META.name}</span>
        <span className="gamecard__blurb">{CHALLENGE_META.blurb}</span>
        <span className="gamecard__best">Best combined {profile.combinedBestScore}</span>
        <span className="gamecard__cta">Play ›</span>
      </button>

      {/* ── Individual games grid ────────────────────────────────────── */}
      <div className="home__grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className="gamecard"
            style={{ ["--card-accent" as string]: g.accent }}
            onClick={() => onPick(g.id)}
          >
            <span className="gamecard__tag">{g.tag}</span>
            <span className="gamecard__name">{g.name}</span>
            <span className="gamecard__blurb">{g.blurb}</span>
            <span className="gamecard__best">Best {profile.games[g.id].bestScore}</span>
            <span className="gamecard__cta">Play ›</span>
          </button>
        ))}
        <button
          className="gamecard"
          style={{ ["--card-accent" as string]: "var(--chess)" }}
          onClick={onChess}
        >
          <span className="gamecard__tag">Chess</span>
          <span className="gamecard__name">Chess</span>
          <span className="gamecard__blurb">Full Chess vs AI · Puzzle Rush. Official rules, 5 difficulty levels.</span>
          <span className="gamecard__cta">Play ›</span>
        </button>
      </div>
    </div>
  );
}
