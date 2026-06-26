import { useEffect, useState } from "react";
import { GAMES } from "../games";
import { isGlobalLeaderboardEnabled } from "../leaderboard/globalLeaderboard";
import { ratingTier } from "../pattern/ratedPatternReducer";
import { fetchAllCloudProfiles, fetchBannedUsernames } from "../player/cloudSync";
import { averageScore, normalizeProfile } from "../player/storage";
import type { GameId, PlayerProfile } from "../player/types";
import { sanitizeAvatarConfig } from "../avatar/serialize";
import type { AvatarConfig } from "../avatar/types";
import { getBorderDef } from "../player/borders";
import { titleColors, titleForLevel } from "../xp/levels";
import { AvatarSvg } from "./AvatarSvg";

type AvgKey =
  | "memory-avg" | "math-avg" | "logic-avg" | "balloon-avg" | "pattern-avg"
  | "reaction-avg" | "trivia-avg" | "direction-avg";

type SortKey =
  | GameId
  | AvgKey
  | "score"
  | "level"
  | "pattern-rating"
  | "chess-rating"
  | "chess-puzzle-rating"
  | "games-played"
  | "streak"
  | "challenge-runs"
  | "pets";

type Scope = "local" | "global";

interface LeaderboardProps {
  profiles: PlayerProfile[];
  currentUsername: string;
  onBack: () => void;
}

interface Row {
  username: string;
  avatar: string;
  avatarConfig: AvatarConfig;
  level: number;
  title: string;
  borderColor: string | null;
  value: number;
  label: string;
  isCurrentUser: boolean;
}

const AVG_GAME_MAP: Partial<Record<AvgKey, GameId>> = {
  "memory-avg": "memory",
  "math-avg": "math",
  "logic-avg": "logic",
  "balloon-avg": "balloon",
  "pattern-avg": "pattern",
  "reaction-avg": "reaction",
  "trivia-avg": "trivia",
  "direction-avg": "direction",
};

function profileToRow(p: PlayerProfile, key: SortKey, currentUsername: string): Row {
  let value: number;
  let label: string;
  if (
    key === "memory" || key === "math" || key === "logic" ||
    key === "balloon" || key === "pattern" || key === "reaction" ||
    key === "trivia" || key === "direction"
  ) {
    value = p.games[key].bestScore;
    label = String(value);
  } else if (key in AVG_GAME_MAP) {
    const gameId = AVG_GAME_MAP[key as AvgKey]!;
    value = Math.round(averageScore(p.games[gameId]));
    label = value === 0 ? "—" : String(value);
  } else {
    switch (key) {
      case "score":          value = p.combinedBestScore; label = String(value); break;
      case "level":          value = p.level; label = `Level ${value}`; break;
      case "pattern-rating": value = p.ratedPatterns.rating; label = `${value} (${ratingTier(value)})`; break;
      case "chess-rating":   value = p.ratedPuzzles.rating; label = String(value); break;
      case "chess-puzzle-rating": value = p.ratedPuzzles.highestRating; label = String(value); break;
      case "games-played":   value = p.totalGamesPlayed; label = String(value); break;
      case "streak":         value = p.streak.longestStreak; label = `${value} days`; break;
      case "challenge-runs": value = p.challengeRunsCompleted; label = String(value); break;
      case "pets":           value = p.ownedPets.length; label = `${value} pet${value === 1 ? "" : "s"}`; break;
      default:               value = 0; label = "0";
    }
  }
  const border = getBorderDef(p.profileBorder);
  return {
    username: p.username,
    avatar: p.avatar ?? "🧠",
    avatarConfig: sanitizeAvatarConfig(p.avatarConfig),
    level: p.level,
    title: p.selectedTitle || titleForLevel(p.level),
    borderColor: border.id === "none" ? null : border.colors[0],
    value,
    label,
    isCurrentUser: p.username === currentUsername,
  };
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
      { key: "level",          label: "Level" },
      { key: "challenge-runs", label: "Challenge Runs" },
      { key: "games-played",   label: "Games Played" },
      { key: "streak",         label: "Longest Streak" },
      { key: "pets",           label: "Most Pets" },
    ],
  },
  {
    heading: "Individual Games (Best)",
    tabs: GAMES.map((g) => ({ key: g.id as SortKey, label: g.name })),
  },
  {
    heading: "Individual Games (Avg)",
    tabs: GAMES.map((g) => ({ key: `${g.id}-avg` as SortKey, label: g.name })),
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
  const [scope, setScope] = useState<Scope>("local");
  const [globalProfiles, setGlobalProfiles] = useState<PlayerProfile[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(false);

  const globalEnabled = isGlobalLeaderboardEnabled();

  useEffect(() => {
    if (scope !== "global" || !globalEnabled) return;
    let cancelled = false;
    setGlobalLoading(true);
    setGlobalError(false);
    (async () => {
      try {
        // Every registered account in user_profiles is the single source of
        // truth for who appears on the global leaderboard — no separate
        // sync step that can drift or silently fail.
        const [accounts, banned] = await Promise.all([fetchAllCloudProfiles(), fetchBannedUsernames()]);
        if (cancelled) return;
        const normalized = accounts
          .filter((a) => !banned.has(a.username))
          .map((a) => normalizeProfile({ ...a.profile_data, username: a.username }));
        setGlobalProfiles(normalized);
        setGlobalLoading(false);
      } catch {
        if (cancelled) return;
        setGlobalError(true);
        setGlobalLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, globalEnabled]);

  const rows: Row[] = (scope === "global" ? globalProfiles : profiles)
    .map((p) => profileToRow(p, activeKey, currentUsername))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="app__shell">
      <div className="app__head">
        <div>
          <h1 className="app__logo">
            Leader<span>board</span>
          </h1>
          <p className="app__tag">
            {scope === "local" ? "Players on this device" : "Global — all players worldwide"}
          </p>
        </div>
        <button className="app__back" onClick={onBack}>
          ‹ Back to hub
        </button>
      </div>

      {/* ── Local / Global scope toggle ─────────────────────────────── */}
      <div className="leaderboard__scope">
        <button
          className={`leaderboard__scope-btn${scope === "local" ? " leaderboard__scope-btn--active" : ""}`}
          onClick={() => setScope("local")}
        >
          📍 Local
        </button>
        <button
          className={`leaderboard__scope-btn${scope === "global" ? " leaderboard__scope-btn--active" : ""}`}
          onClick={() => setScope("global")}
          disabled={!globalEnabled}
          title={globalEnabled ? "Global leaderboard" : "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable"}
        >
          🌐 Global{!globalEnabled && " (not configured)"}
        </button>
      </div>

      {scope === "global" && !globalEnabled && (
        <div className="leaderboard__setup">
          <h3>Set up the global leaderboard</h3>
          <p>
            Create a free <a href="https://supabase.com" target="_blank" rel="noreferrer">Supabase</a> project
            and add two environment variables to a <code>.env</code> file in the project root:
          </p>
          <pre className="leaderboard__setup-code">{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
          <p>Then run this SQL in your Supabase SQL editor:</p>
          <pre className="leaderboard__setup-code">{SETUP_SQL}</pre>
          <p>Rebuild the app and the global leaderboard will activate automatically.</p>
        </div>
      )}

      {/* ── Stat category tabs ─────────────────────────────────────── */}
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

      {/* ── Rows ────────────────────────────────────────────────────── */}
      {globalLoading ? (
        <p className="leaderboard__empty">Loading global scores…</p>
      ) : globalError ? (
        <p className="leaderboard__empty">Could not load global leaderboard. Check your connection.</p>
      ) : rows.length === 0 ? (
        <p className="leaderboard__empty">No players yet.</p>
      ) : (
        <div className="leaderboard__list">
          {rows.map((row, idx) => (
            <div
              key={`${row.username}-${idx}`}
              className={`leaderboard__row${row.isCurrentUser ? " leaderboard__row--you" : ""}`}
            >
              <span className="leaderboard__rank">
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
              </span>
              <span className="leaderboard__avatar">
                <AvatarSvg config={row.avatarConfig} size={32} />
              </span>
              <span className="leaderboard__name">
                <span className="leaderboard__name-row">
                  <span style={{ color: row.borderColor ?? "#000000" }}>{row.username}</span>
                  {row.isCurrentUser && <span className="leaderboard__you-tag"> (you)</span>}
                  {activeKey !== "level" && <span className="leaderboard__level-badge">Lv {row.level}</span>}
                </span>
                <span className="leaderboard__title" style={{ color: titleColors(row.title)[0] }}>
                  {row.title}
                </span>
              </span>
              <span className="leaderboard__value">{row.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SETUP_SQL = `CREATE TABLE leaderboard_entries (
  device_id   TEXT NOT NULL,
  username    TEXT NOT NULL,
  avatar      TEXT DEFAULT '🧠',
  avatar_config JSONB,
  combined_best_score   INTEGER DEFAULT 0,
  total_games_played    INTEGER DEFAULT 0,
  longest_streak        INTEGER DEFAULT 0,
  pattern_rating        INTEGER DEFAULT 1000,
  chess_rating          INTEGER DEFAULT 1000,
  chess_peak_rating     INTEGER DEFAULT 1000,
  memory_best           INTEGER DEFAULT 0,
  math_best             INTEGER DEFAULT 0,
  logic_best            INTEGER DEFAULT 0,
  balloon_best          INTEGER DEFAULT 0,
  pattern_best          INTEGER DEFAULT 0,
  reaction_best         INTEGER DEFAULT 0,
  trivia_best           INTEGER DEFAULT 0,
  direction_best        INTEGER DEFAULT 0,
  challenge_runs        INTEGER DEFAULT 0,
  memory_avg            INTEGER DEFAULT 0,
  math_avg              INTEGER DEFAULT 0,
  logic_avg             INTEGER DEFAULT 0,
  balloon_avg           INTEGER DEFAULT 0,
  pattern_avg           INTEGER DEFAULT 0,
  reaction_avg          INTEGER DEFAULT 0,
  trivia_avg            INTEGER DEFAULT 0,
  direction_avg         INTEGER DEFAULT 0,
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (device_id, username)
);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON leaderboard_entries FOR SELECT TO anon USING (true);
CREATE POLICY "Public upsert" ON leaderboard_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update" ON leaderboard_entries FOR UPDATE TO anon USING (true);`;
