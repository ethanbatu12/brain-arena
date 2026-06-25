import { GAMES } from "../games";
import { ACHIEVEMENT_DEFS } from "../player/achievements";
import {
  averageScore,
  avgSolveTimeMs,
  combinedAverageScore,
  directionAccuracy,
  overallAverageScore,
  puzzleWinPct,
  triviaAccuracy,
} from "../player/storage";
import type { PlayerProfile } from "../player/types";
import { AvatarSvg } from "./AvatarSvg";
import { XpBar } from "./XpBar";
import { usePlayerProfile } from "../player/PlayerContext";
import { unlockedTitles } from "../xp/levels";
import { BORDERS, getBorderDef, unlockedBorders } from "../player/borders";
import { isBadgeActive } from "../tournament/claim";

function formatTime(ms: number): string {
  if (ms === 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface ProfileProps {
  profile: PlayerProfile;
  onBack: () => void;
  onEditAvatar: () => void;
  onSignOut: () => void;
}

function round(value: number): number {
  return Math.round(value);
}

export function Profile({ profile, onBack, onEditAvatar, onSignOut }: ProfileProps) {
  const { setSelectedTitle, setProfileBorder } = usePlayerProfile();
  const unlockedIds = new Set(profile.achievements.map((a) => a.id));
  const titles = unlockedTitles(profile.level);
  const borders = unlockedBorders(profile.level);
  const border = getBorderDef(profile.profileBorder);

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

      {/* ── Level & XP ──────────────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Level & XP</h2>
        <XpBar xp={profile.xp} selectedTitle={profile.selectedTitle} />
        {titles.length > 1 && (
          <div className="profile__row">
            <label htmlFor="title-select" className="profile__row-label">Display title</label>
            <select
              id="title-select"
              value={profile.selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
            >
              {titles.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* ── Avatar ──────────────────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Avatar</h2>
        <div className="profile__avatar">
          <div
            className="profile__avatar-frame"
            style={{ boxShadow: border.id === "none" ? undefined : `0 0 0 5px ${border.colors[0]}, 0 0 0 8px ${border.colors[1]}` }}
          >
            <AvatarSvg config={profile.avatarConfig} size={120} />
          </div>
          <button className="btn btn--primary" onClick={onEditAvatar}>
            Edit Avatar
          </button>
        </div>
        {borders.length > 1 && (
          <>
            {border.id !== "none" && (
              <p
                className="profile__border-badge"
                style={{ background: `linear-gradient(135deg, ${border.colors[0]}, ${border.colors[1]})` }}
              >
                {border.label}
              </p>
            )}
            <div className="profile__row">
              <label htmlFor="border-select" className="profile__row-label">
                Profile border
              </label>
              <select
                id="border-select"
                value={profile.profileBorder}
                onChange={(e) => setProfileBorder(e.target.value)}
              >
                {borders.map((b) => (
                  <option key={b.id} value={b.id} style={{ color: b.colors[0] }}>{b.label}</option>
                ))}
              </select>
            </div>
          </>
        )}
        {borders.length < BORDERS.length && (() => {
          const next = BORDERS.find((b) => !borders.includes(b));
          return next ? (
            <p className="profile__locked-hint">
              🔒 Next border: <span style={{ color: next.colors[0], fontWeight: 700 }}>{next.label}</span> — Requires
              Level {next.unlockLevel}
            </p>
          ) : null;
        })()}
      </section>

      {/* ── Weekly Tournament ─────────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Weekly Tournament</h2>
        {isBadgeActive(profile.weeklyBadge) && profile.weeklyBadge && (
          <p className={`profile__tournament-badge profile__tournament-badge--${profile.weeklyBadge.type}`}>
            {profile.weeklyBadge.type === "champion" ? "👑 Weekly Champion" : "🥈 Weekly Finalist"}
          </p>
        )}
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{profile.tournamentStats.weeklyWins}</span>
              <span className="stat__label">Weekly wins</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.tournamentStats.top3Finishes}</span>
              <span className="stat__label">Top 3 finishes</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.tournamentStats.bestRank ?? "—"}</span>
              <span className="stat__label">Best rank</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.tournamentStats.totalTournamentXp}</span>
              <span className="stat__label">Tournament XP earned</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.exclusiveCosmetics.length}</span>
              <span className="stat__label">Exclusive cosmetics</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Daily Challenge Streak ───────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Daily Challenge Streak</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">🔥 {profile.challengeStreak.currentStreak}</span>
              <span className="stat__label">Current streak</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.challengeStreak.longestStreak}</span>
              <span className="stat__label">Longest streak</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.challengeStreak.totalCompleted}</span>
              <span className="stat__label">Challenges completed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Streak ──────────────────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Daily Streak</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">🔥 {profile.streak.currentStreak}</span>
              <span className="stat__label">Current streak</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.streak.longestStreak}</span>
              <span className="stat__label">Longest streak</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.streak.lastPlayedDate ?? "—"}</span>
              <span className="stat__label">Last played</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Achievements ────────────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">
          Achievements ({unlockedIds.size} / {ACHIEVEMENT_DEFS.length})
        </h2>
        <div className="achievement-grid">
          {ACHIEVEMENT_DEFS.map((def) => {
            const record = profile.achievements.find((a) => a.id === def.id);
            const unlocked = !!record;
            return (
              <div
                key={def.id}
                className={`achievement-badge${unlocked ? " achievement-badge--unlocked" : ""}`}
                title={
                  unlocked
                    ? `${def.description} — Unlocked ${new Date(record!.unlockedAt).toLocaleDateString()}`
                    : def.description
                }
              >
                <span className="achievement-badge__icon">{def.icon}</span>
                <span className="achievement-badge__label">{def.label}</span>
                {!unlocked && <span className="achievement-badge__lock">🔒</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Account Information ──────────────────────────────────────── */}
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

      {/* ── High Scores ─────────────────────────────────────────────── */}
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

      {/* ── Average Scores ──────────────────────────────────────────── */}
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

      {/* ── Gameplay Statistics ──────────────────────────────────────── */}
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

      {/* ── Reaction Grid ───────────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Reaction Grid</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{profile.games.reaction.bestScore}</span>
              <span className="stat__label">High score</span>
            </div>
            <div className="stat">
              <span className="stat__value">{round(averageScore(profile.games.reaction))}</span>
              <span className="stat__label">Average score</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.games.reaction.gamesPlayed}</span>
              <span className="stat__label">Games played</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.reactionDotsHit}</span>
              <span className="stat__label">Total dots hit</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mixed Trivia ───────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Mixed Trivia</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{profile.games.trivia.bestScore}</span>
              <span className="stat__label">High score</span>
            </div>
            <div className="stat">
              <span className="stat__value">{round(averageScore(profile.games.trivia))}</span>
              <span className="stat__label">Average score</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.games.trivia.gamesPlayed}</span>
              <span className="stat__label">Games played</span>
            </div>
            <div className="stat">
              <span className="stat__value">{round(triviaAccuracy(profile))}%</span>
              <span className="stat__label">Accuracy</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.triviaQuestionsAnswered}</span>
              <span className="stat__label">Questions answered</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.triviaCorrectAnswers}</span>
              <span className="stat__label">Correct answers</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Direction Challenge ─────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Direction Challenge</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value">{profile.games.direction.bestScore}</span>
              <span className="stat__label">High score</span>
            </div>
            <div className="stat">
              <span className="stat__value">{round(averageScore(profile.games.direction))}</span>
              <span className="stat__label">Average score</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.games.direction.gamesPlayed}</span>
              <span className="stat__label">Games played</span>
            </div>
            <div className="stat">
              <span className="stat__value">{round(directionAccuracy(profile))}%</span>
              <span className="stat__label">Accuracy</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.directionQuestionsAnswered}</span>
              <span className="stat__label">Questions answered</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.directionCorrectAnswers}</span>
              <span className="stat__label">Correct answers</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Rated Puzzles ───────────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Rated Puzzles</h2>
        <div className="hud">
          <div className="hud__stats">
            <div className="stat">
              <span className="stat__value rated__rating">{profile.ratedPuzzles.rating}</span>
              <span className="stat__label">Current rating</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.ratedPuzzles.highestRating}</span>
              <span className="stat__label">Peak rating</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.ratedPuzzles.totalCompleted}</span>
              <span className="stat__label">Completed</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.ratedPuzzles.totalCorrect}</span>
              <span className="stat__label">Correct</span>
            </div>
            <div className="stat">
              <span className="stat__value">{profile.ratedPuzzles.totalIncorrect}</span>
              <span className="stat__label">Incorrect</span>
            </div>
            <div className="stat">
              <span className="stat__value">{formatTime(avgSolveTimeMs(profile.ratedPuzzles))}</span>
              <span className="stat__label">Avg solve time</span>
            </div>
            <div className="stat">
              <span className="stat__value">{round(puzzleWinPct(profile.ratedPuzzles))}%</span>
              <span className="stat__label">Win %</span>
            </div>
          </div>
        </div>
      </section>

      <button className="btn btn--ghost" onClick={onSignOut}>
        Switch player
      </button>
    </div>
  );
}
