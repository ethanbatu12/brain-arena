import type { PlayerProfile } from "../player/types";

interface SeasonHistoryPageProps {
  profile: PlayerProfile;
  onBack: () => void;
}

export function SeasonHistoryPage({ profile, onBack }: SeasonHistoryPageProps) {
  const history = [...profile.seasonHistory].sort((a, b) => b.seasonIndex - a.seasonIndex);

  return (
    <div className="app__shell">
      <div className="screen-header">
        <button className="btn btn--ghost" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Season History</h1>
        <span />
      </div>

      {history.length === 0 ? (
        <p className="season-history__empty">No completed seasons yet — keep playing to fill this in!</p>
      ) : (
        <div className="season-history__list">
          {history.map((entry) => (
            <div key={entry.seasonIndex} className="season-history__card">
              <h3>{entry.themeName}</h3>
              <div className="hud__stats">
                <div className="stat">
                  <span className="stat__value">{entry.finalLevel}</span>
                  <span className="stat__label">Highest tier</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{entry.claimedRewardIds.length}</span>
                  <span className="stat__label">Rewards earned</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{entry.completionPercent}%</span>
                  <span className="stat__label">Completion</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{entry.finalLeaderboardPlacement ?? "—"}</span>
                  <span className="stat__label">Final placement</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
