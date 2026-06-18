import { useState } from "react";
import { GAMES } from "../games";
import { ratingTier } from "../pattern/ratedPatternReducer";
import type { GameId, PlayerProfile } from "../player/types";

type SortKey =
  | GameId
  | "score"
  | "pattern-rating"
  | "chess-rating"
  | "chess-puzzle-rating"
  | "games-played"
  | "streak"
  | "challenge-runs";

interface LeaderboardProps {
  profiles: PlayerProfile[];
  currentUsername: string;
  onBack: () => void;
}

interface Row {
  username: string;
  avatar: string;
  value: number;
  label: string;
  isCurrentUser: boolean;
}

function buildRows(profiles: PlayerProfile[], key: SortKey): Row[] {
  return profiles
    .map((p) => {
      let value: number;
      let label: string;

      // Per-game best scores
      if (key === "memory" || key === "math" || key === "logic" || key === "balloon" || key === "pattern") {
        value = p.games[key].bestScore;
        label = String(value);
      } else {
        switch (key) {
          case "score":
            value = p.combinedBestScore;
            label = String(value);
            break;
          case "pattern-rating":
            value = p.ratedPatterns.rating;
            label = `${value} (${ratingTier(value)})`;
            break;
          case "chess-rating":
            value = p.ratedPuzzles.rating;
            label = String(value);
            break;
          case "chess-puzzle-rating":
            value = p.ratedPuzzles.highestRating;
            label = String(value);
            break;
          case "games-played":
            value = p.totalGamesPlayed;
            label = String(value);
            break;
          case "streak":
            value = p.streak.longestStreak;
            label = `${value} days`;
            break;
          case "challenge-runs":
            value = p.challengeRunsCompleted;
            label = String(value);
            break;
          default:
            value = 0;
            label = "0";
        }
      }

      return { username: p.username, avatar: p.avatar ?? "🧠", value, label, isCurrentUser: false };
    })
    .sort((a, b) => b.value - a.value);
}

interface TabGroup {
  heading: string;
  tabs: { key: SortKey; label: string }[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    heading: "Overall",
    tabs: [
      { key: "score",          label: "Challenge Score" },
      { key: "challenge-runs", label: "Challenge Runs" },
      { key: "games-played",   label: "Games Played" },
      { key: "streak",         label: "Longest Streak" },
    ],
  },
  {
    heading: "Individual Games",
    tabs: GAMES.map((g) => ({ key: g.id as SortKey, label: g.name })),
  },
  {
    heading: "Ratings",
    tabs: [
      { key: "pattern-rating",      label: "Pattern Rating" },
      { key: "chess-rating",        label: "Chess Rating" },
      { key: "chess-puzzle-rating", label: "Chess Peak Rating" },
    ],
  },
];

export function Leaderboard({ profiles, currentUsername, onBack }: LeaderboardProps) {
  const [activeKey, setActiveKey] = useState<SortKey>("score");

  const rows = buildRows(profiles, activeKey).map((r) => ({
    ...r,
    isCurrentUser: r.username === currentUsername,
  }));

  return (
    <div className="app__shell">
      <div className="app__head">
        <div>
          <h1 className="app__logo">
            Leader<span>board</span>
          </h1>
          <p className="app__tag">Local rankings — all players on this device</p>
        </div>
        <button className="app__back" onClick={onBack}>
          ‹ Back to hub
        </button>
      </div>

      <div className="leaderboard__groups">
        {TAB_GROUPS.map((group) => (
          <div key={group.heading} className="leaderboard__group">
            <p className="leaderboard__group-label">{group.heading}</p>
            <div className="leaderboard__tabs" role="tablist">
              {group.tabs.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={activeKey === t.key}
                  className={`leaderboard__tab${activeKey === t.key ? " leaderboard__tab--active" : ""}`}
                  onClick={() => setActiveKey(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="leaderboard__empty">No players yet.</p>
      ) : (
        <div className="leaderboard__list">
          {rows.map((row, idx) => (
            <div
              key={row.username}
              className={`leaderboard__row${row.isCurrentUser ? " leaderboard__row--you" : ""}`}
            >
              <span className="leaderboard__rank">
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
              </span>
              <span className="leaderboard__avatar">{row.avatar}</span>
              <span className="leaderboard__name">
                {row.username}
                {row.isCurrentUser && <span className="leaderboard__you-tag"> (you)</span>}
              </span>
              <span className="leaderboard__value">{row.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
