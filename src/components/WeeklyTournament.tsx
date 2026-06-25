import { useEffect, useState } from "react";
import { GAMES } from "../games";
import { DEFAULT_AVATAR_CONFIG } from "../avatar/defaults";
import { sanitizeAvatarConfig } from "../avatar/serialize";
import type { AvatarConfig } from "../avatar/types";
import { fetchAllCloudProfiles } from "../player/cloudSync";
import { normalizeProfile } from "../player/storage";
import type { PlayerProfile } from "../player/types";
import { fetchTournamentLeaderboard } from "../tournament/cloudSync";
import { currentTournamentWeek, formatDuration, msUntilTournamentEnd } from "../tournament/schedule";
import type { TournamentEntryRow } from "../tournament/types";
import { AvatarSvg } from "./AvatarSvg";

interface WeeklyTournamentProps {
  profile: PlayerProfile;
  onBack: () => void;
  onPlayFeaturedGame: () => void;
  onViewHistory: () => void;
}

interface Row extends TournamentEntryRow {
  rank: number;
  avatarConfig: AvatarConfig;
  isYou: boolean;
}

export function WeeklyTournament({ profile, onBack, onPlayFeaturedGame, onViewHistory }: WeeklyTournamentProps) {
  const week = currentTournamentWeek();
  const gameMeta = GAMES.find((g) => g.id === week.gameId)!;

  const [rows, setRows] = useState<Row[] | null>(null);
  const [msLeft, setMsLeft] = useState(() => msUntilTournamentEnd(week.weekStart));

  useEffect(() => {
    const id = setInterval(() => setMsLeft(msUntilTournamentEnd(week.weekStart)), 1000);
    return () => clearInterval(id);
  }, [week.weekStart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [scores, accounts] = await Promise.all([
        fetchTournamentLeaderboard(week.weekStart),
        fetchAllCloudProfiles(),
      ]);
      if (cancelled) return;
      const avatarByUsername = new Map<string, AvatarConfig>();
      for (const a of accounts) {
        const p = normalizeProfile({ ...a.profile_data, username: a.username });
        avatarByUsername.set(a.username, sanitizeAvatarConfig(p.avatarConfig));
      }
      const sorted = [...scores].sort((a, b) => b.score - a.score);
      setRows(
        sorted.map((s, i) => ({
          ...s,
          rank: i + 1,
          avatarConfig: avatarByUsername.get(s.username) ?? DEFAULT_AVATAR_CONFIG,
          isYou: s.username === profile.username,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [week.weekStart, profile.username]);

  const myRow = rows?.find((r) => r.isYou) ?? null;
  const topRows = rows?.slice(0, 25) ?? [];
  const showMyRowSeparately = myRow && myRow.rank > 25;

  return (
    <div className="app__shell">
      <div className="app__head">
        <div>
          <h1 className="app__logo">
            Weekly<span>Tournament</span>
          </h1>
          <p className="app__tag">Every player auto-entered · no sign-up needed</p>
        </div>
        <button className="app__back" onClick={onBack}>
          ‹ Back to hub
        </button>
      </div>

      <div className="tournament__hero">
        <div className="tournament__hero-game">
          <span className="tournament__hero-label">This week's featured game</span>
          <h2 className="tournament__hero-title">{gameMeta.name}</h2>
          <p className="tournament__hero-blurb">{gameMeta.blurb}</p>
        </div>
        <div className="tournament__hero-timer">
          <span className="tournament__hero-label">Ends in</span>
          <span className="tournament__hero-countdown">{formatDuration(msLeft)}</span>
        </div>
      </div>

      <div className="tournament__actions">
        <button className="btn btn--primary" onClick={onPlayFeaturedGame}>
          ▶ Quick Play
        </button>
        <button className="btn btn--ghost" onClick={onViewHistory}>
          Tournament History
        </button>
      </div>

      {myRow && (
        <div className="tournament__you-summary">
          Your rank: <strong>#{myRow.rank}</strong> · Best score: <strong>{myRow.score.toLocaleString()}</strong>
        </div>
      )}

      <section className="profile__section">
        <h2 className="profile__section-title">Leaderboard</h2>
        {rows === null ? (
          <p className="leaderboard__empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="leaderboard__empty">No scores yet this week — be the first!</p>
        ) : (
          <div className="leaderboard__list">
            {topRows.map((row) => <TournamentRow key={row.username} row={row} />)}
            {showMyRowSeparately && myRow && (
              <>
                <div className="tournament__row-gap">⋯</div>
                <TournamentRow row={myRow} />
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TournamentRow({ row }: { row: Row }) {
  return (
    <div className={`leaderboard__row${row.isYou ? " leaderboard__row--you" : ""}`}>
      <span className="leaderboard__rank">
        {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `#${row.rank}`}
      </span>
      <span className="leaderboard__avatar">
        <AvatarSvg config={row.avatarConfig} size={32} />
      </span>
      <span className="leaderboard__name">
        {row.username}
        {row.isYou && <span className="leaderboard__you-tag"> (you)</span>}
        <span className="leaderboard__level-badge">Lv {row.level}</span>
      </span>
      <span className="leaderboard__value">{row.score.toLocaleString()}</span>
    </div>
  );
}
