import { useEffect, useState } from "react";
import { GAMES } from "../games";
import { averageScore, combinedAverageScore, overallAverageScore } from "../player/storage";
import { indexedDbProfileStore } from "../player/db";
import { diagnoseLeaderboardSync } from "../leaderboard/globalLeaderboard";
import type { PlayerProfile } from "../player/types";

interface DbViewerProps {
  onBack: () => void;
}

function round(value: number): number {
  return Math.round(value);
}

export function DbViewer({ onBack }: DbViewerProps) {
  const [profiles, setProfiles] = useState<Record<string, PlayerProfile> | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagResult, setDiagResult] = useState<string | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [all, current] = await Promise.all([
      indexedDbProfileStore.getAllProfiles(),
      indexedDbProfileStore.getCurrentUsername(),
    ]);
    setProfiles(all);
    setCurrentUsername(current);
    setLoading(false);
  };

  const runDiagnostic = async () => {
    setDiagRunning(true);
    setDiagResult(null);
    const result = await diagnoseLeaderboardSync();
    setDiagResult(result);
    setDiagRunning(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const usernames = profiles ? Object.keys(profiles).sort() : [];

  return (
    <div className="app__shell">
      <div className="app__head">
        <div>
          <h1 className="app__logo">
            Database<span>.</span>
          </h1>
          <p className="app__tag">brain-arena · IndexedDB</p>
        </div>
        <button className="app__back" onClick={onBack}>
          ‹ Back to hub
        </button>
      </div>

      <section className="profile__section">
        <h2 className="profile__section-title">Session</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{currentUsername ?? "—"}</span>
              <span className="stat__label">Current user</span>
            </div>
            <div className="stat">
              <span className="stat__value">{usernames.length}</span>
              <span className="stat__label">Stored profiles</span>
            </div>
          </div>
        </div>
        <button className="btn btn--ghost" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </section>

      <section className="profile__section">
        <h2 className="profile__section-title">Cloud Sync Diagnostic</h2>
        <p className="profile__row-label" style={{ marginBottom: 10 }}>
          Runs a real test write to the global leaderboard and shows exactly what Supabase says back — use this to
          debug avatar/sync issues without needing browser DevTools.
        </p>
        <button className="btn btn--primary" onClick={runDiagnostic} disabled={diagRunning}>
          {diagRunning ? "Running…" : "Test Cloud Sync"}
        </button>
        {diagResult && (
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              background: "var(--surface-2)",
              borderRadius: 8,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              userSelect: "text",
            }}
          >
            {diagResult}
          </pre>
        )}
      </section>

      {usernames.map((username) => {
        const p = profiles![username];
        return (
          <section className="profile__section" key={username}>
            <h2 className="profile__section-title">
              {username}
              {username === currentUsername ? " · signed in" : ""}
            </h2>

            <div className="db__table-wrap">
              <table className="db__table">
                <tbody>
                  <tr>
                    <th>Overall best score</th>
                    <td>{p.overallBestScore}</td>
                  </tr>
                  <tr>
                    <th>Overall total score</th>
                    <td>{p.overallTotalScore}</td>
                  </tr>
                  <tr>
                    <th>Overall average score</th>
                    <td>{round(overallAverageScore(p))}</td>
                  </tr>
                  <tr>
                    <th>Total games played</th>
                    <td>{p.totalGamesPlayed}</td>
                  </tr>
                  <tr>
                    <th>Challenge best (combined)</th>
                    <td>{p.combinedBestScore}</td>
                  </tr>
                  <tr>
                    <th>Challenge total (combined)</th>
                    <td>{p.combinedTotalScore}</td>
                  </tr>
                  <tr>
                    <th>Challenge average (combined)</th>
                    <td>{round(combinedAverageScore(p))}</td>
                  </tr>
                  <tr>
                    <th>Challenge runs completed</th>
                    <td>{p.challengeRunsCompleted}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="db__table-wrap">
              <table className="db__table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Best</th>
                    <th>Average</th>
                    <th>Played</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {GAMES.map((g) => {
                    const stats = p.games[g.id];
                    return (
                      <tr key={g.id}>
                        <th>{g.name}</th>
                        <td>{stats.bestScore}</td>
                        <td>{round(averageScore(stats))}</td>
                        <td>{stats.gamesPlayed}</td>
                        <td>{stats.totalScore}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {usernames.length === 0 && !loading && <p className="home__sub">No player profiles stored yet.</p>}
    </div>
  );
}
