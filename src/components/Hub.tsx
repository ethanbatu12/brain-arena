import { CHALLENGE_META, GAMES } from "../games";
import type { GameId, PlayerProfile } from "../player/types";

interface HubProps {
  profile: PlayerProfile;
  onPick: (id: GameId | "challenge") => void;
  onChess: () => void;
  onProfile: () => void;
  onDb: () => void;
  onSignOut: () => void;
}

export function Hub({ profile, onPick, onChess, onProfile, onDb, onSignOut }: HubProps) {
  return (
    <div className="app__shell home">
      <div className="home__head">
        <h1 className="home__title">
          Brain<span>Arena</span>
        </h1>
        <p className="home__sub">Quick games that measure how your mind performs.</p>
      </div>

      <div className="home__player">
        <div className="home__greeting">
          Welcome back, <strong>{profile.username}</strong>
        </div>
        <div className="home__player-actions">
          <button className="btn btn--ghost" onClick={onProfile}>
            Profile
          </button>
          <button className="btn btn--ghost" onClick={onDb}>
            Database
          </button>
          <button className="btn btn--ghost" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="home__summary hud__stats">
        <div className="stat">
          <span className="stat__value">{profile.overallBestScore}</span>
          <span className="stat__label">Overall best</span>
        </div>
        <div className="stat">
          <span className="stat__value">{profile.totalGamesPlayed}</span>
          <span className="stat__label">Games played</span>
        </div>
      </div>

      <button
        key={CHALLENGE_META.id}
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
