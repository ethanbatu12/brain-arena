import { useEffect, useState } from "react";
import { GAMES } from "../games";
import { fetchAllTournamentHistory } from "../tournament/cloudSync";
import type { TournamentHistoryEntry } from "../tournament/types";

interface TournamentHistoryPageProps {
  onBack: () => void;
}

export function TournamentHistoryPage({ onBack }: TournamentHistoryPageProps) {
  const [entries, setEntries] = useState<TournamentHistoryEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllTournamentHistory().then((rows) => {
      if (!cancelled) setEntries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app__shell">
      <div className="app__head">
        <div>
          <h1 className="app__logo">
            Tournament<span>History</span>
          </h1>
          <p className="app__tag">Past weekly champions</p>
        </div>
        <button className="app__back" onClick={onBack}>
          ‹ Back
        </button>
      </div>

      {entries === null ? (
        <p className="leaderboard__empty">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="leaderboard__empty">No tournaments have finished yet — check back after this week ends.</p>
      ) : (
        <div className="tournament-history__list">
          {entries.map((entry) => {
            const gameMeta = GAMES.find((g) => g.id === entry.gameId);
            return (
              <div key={entry.weekStart} className="tournament-history__card">
                <div className="tournament-history__head">
                  <span className="tournament-history__game">{gameMeta?.name ?? entry.gameId}</span>
                  <span className="tournament-history__dates">{entry.weekStart} – {entry.weekEnd}</span>
                </div>
                <div className="tournament-history__podium">
                  <PodiumSlot place="🥇" entry={entry.first} />
                  <PodiumSlot place="🥈" entry={entry.second} />
                  <PodiumSlot place="🥉" entry={entry.third} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PodiumSlot({ place, entry }: { place: string; entry: { username: string; score: number } | null }) {
  return (
    <div className="tournament-history__slot">
      <span className="tournament-history__place">{place}</span>
      {entry ? (
        <>
          <span className="tournament-history__name">{entry.username}</span>
          <span className="tournament-history__score">{entry.score.toLocaleString()}</span>
        </>
      ) : (
        <span className="tournament-history__name">—</span>
      )}
    </div>
  );
}
