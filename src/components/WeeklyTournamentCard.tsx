import { useEffect, useState } from "react";
import { GAMES } from "../games";
import { fetchTournamentLeaderboard } from "../tournament/cloudSync";
import { currentTournamentWeek, formatDuration, msUntilTournamentEnd } from "../tournament/schedule";

interface WeeklyTournamentCardProps {
  username: string;
  onView: () => void;
}

export function WeeklyTournamentCard({ username, onView }: WeeklyTournamentCardProps) {
  const week = currentTournamentWeek();
  const gameMeta = GAMES.find((g) => g.id === week.gameId)!;
  const [msLeft, setMsLeft] = useState(() => msUntilTournamentEnd(week.weekStart));
  const [rank, setRank] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setMsLeft(msUntilTournamentEnd(week.weekStart)), 30_000);
    return () => clearInterval(id);
  }, [week.weekStart]);

  useEffect(() => {
    let cancelled = false;
    fetchTournamentLeaderboard(week.weekStart).then((rows) => {
      if (cancelled) return;
      const sorted = [...rows].sort((a, b) => b.score - a.score);
      const idx = sorted.findIndex((r) => r.username === username);
      setRank(idx === -1 ? null : idx + 1);
      setBestScore(idx === -1 ? null : sorted[idx].score);
    });
    return () => {
      cancelled = true;
    };
  }, [week.weekStart, username]);

  return (
    <button className="tournament-card" onClick={onView}>
      <div className="tournament-card__head">
        <span className="tournament-card__label">🏆 Weekly Tournament</span>
        <span className="tournament-card__timer">⏱ {formatDuration(msLeft)}</span>
      </div>
      <span className="tournament-card__game">{gameMeta.name}</span>
      <div className="tournament-card__stats">
        <span>{rank ? `Rank #${rank}` : "Not ranked yet"}</span>
        <span>{bestScore !== null ? `Best ${bestScore.toLocaleString()}` : "No score yet"}</span>
      </div>
      <span className="tournament-card__cta">Quick Play ›</span>
    </button>
  );
}
