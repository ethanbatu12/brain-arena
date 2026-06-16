import { GAMES } from "../games";
import { averageScore, combinedAverageScore, overallAverageScore } from "../player/storage";
import type { PlayerProfile } from "../player/types";

interface ProfileProps {
  profile: PlayerProfile;
  onBack: () => void;
  onSignOut: () => void;
}

function round(value: number): number {
  return Math.round(value);
}

export function Profile({ profile, onBack, onSignOut }: ProfileProps) {
  return (
    <div className="app__shell">
      <div className="app__head">
        <div>
          <h1 className="app__logo">
            Profile<span>.</span>
          </h1>
          <p className="app__tag">{profile.username}</p>
        </div>
        <button className="app__back" onClick={onBack}>
          ‹ Back to hub
        </button>
      </div>

      <section className="profile__section">
        <h2 className="profile__section-title">Account Information</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{profile.username}</span>
              <span className="stat__label">Username</span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile__section">
        <h2 className="profile__section-title">High Scores</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{profile.overallBestScore}</span>
              <span className="stat__label">Overall best</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.combinedBestScore}</span>
              <span className="stat__label">Combined best</span>
            </div>
          </div>
        </div>

        <div className="profile__games">
          {GAMES.map((g) => {
            const stats = profile.games[g.id];
            return (
              <div key={g.id} className="profile__game" style={{ ["--card-accent" as string]: g.accent }}>
                <span className="gamecard__tag">{g.tag}</span>
                <span className="gamecard__name">{g.name}</span>
                <div className="hud__stats profile__game-stats">
                  <div className="stat">
                    <span className="stat__value">{stats.bestScore}</span>
                    <span className="stat__label">Best</span>
                  </div>
                  <div className="stat">
                    <span className="stat__value">{round(averageScore(stats))}</span>
                    <span className="stat__label">Average</span>
                  </div>
                  <div className="stat">
                    <span className="stat__value">{stats.gamesPlayed}</span>
                    <span className="stat__label">Played</span>
                  </div>
                  <div className="stat">
                    <span className="stat__value">{stats.totalScore}</span>
                    <span className="stat__label">Total</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="profile__section">
        <h2 className="profile__section-title">Average Scores</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{round(overallAverageScore(profile))}</span>
              <span className="stat__label">Overall average</span>
            </div>
            <div className="stat">
              <span className="stat__value">{round(combinedAverageScore(profile))}</span>
              <span className="stat__label">Challenge average</span>
            </div>
            {GAMES.map((g) => (
              <div key={g.id} className="stat">
                <span className="stat__value">{round(averageScore(profile.games[g.id]))}</span>
                <span className="stat__label">{g.name} average</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="profile__section">
        <h2 className="profile__section-title">Gameplay Statistics</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{profile.totalGamesPlayed}</span>
              <span className="stat__label">Games played</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.challengeRunsCompleted}</span>
              <span className="stat__label">Challenge runs</span>
            </div>
            {GAMES.map((g) => (
              <div key={g.id} className="stat">
                <span className="stat__value">{profile.games[g.id].gamesPlayed}</span>
                <span className="stat__label">{g.name} played</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <button className="btn btn--ghost" onClick={onSignOut}>
        Switch player
      </button>
    </div>
  );
}
