import { useEffect, useRef } from "react";
import { levelForTotalXp, titleForLevel, totalXpForLevel } from "../xp/levels";
import { buildLevelRoadmap } from "../xp/roadmap";
import type { PlayerProfile } from "../player/types";

interface LevelsPageProps {
  profile: PlayerProfile;
  onBack: () => void;
}

export function LevelsPage({ profile, onBack }: LevelsPageProps) {
  const info = levelForTotalXp(profile.xp);
  const pct = info.xpForNextLevel === 0 ? 100 : Math.min(100, (info.xpIntoLevel / info.xpForNextLevel) * 100);
  const roadmap = buildLevelRoadmap(totalXpForLevel);

  const currentRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="app__shell">
      <div className="app__head">
        <div>
          <h1 className="app__logo">
            Levels<span>.</span>
          </h1>
          <p className="app__tag">Your progression, all in one place</p>
        </div>
        <button className="app__back" onClick={onBack}>
          ‹ Back to profile
        </button>
      </div>

      {/* ── Stats header ─────────────────────────────────────────────── */}
      <section className="levels__hero">
        <div className="levels__hero-top">
          <div>
            <span className="levels__hero-level">Level {info.level}</span>
            <span className="levels__hero-title">{profile.selectedTitle || titleForLevel(info.level)}</span>
          </div>
          <div className="levels__hero-xp">
            <span className="levels__hero-xp-value">{info.xpIntoLevel.toLocaleString()} / {info.xpForNextLevel.toLocaleString()} XP</span>
            <span className="levels__hero-xp-label">to Level {info.level + 1}</span>
          </div>
        </div>
        <div className="levels__bar">
          <div className="levels__bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="levels__hero-stats">
          <Stat label="Total lifetime XP" value={profile.xp.toLocaleString()} />
          <Stat label="XP earned today" value={profile.xpEarnedToday.amount.toLocaleString()} />
          <Stat label="XP earned this week" value={profile.xpEarnedThisWeek.amount.toLocaleString()} />
          <Stat
            label="Daily challenges"
            value={`${profile.tripleChallenges.challenges.filter((c) => c.completed).length} / ${profile.tripleChallenges.challenges.length || 3}`}
          />
          <Stat label="Weekly tournament wins" value={String(profile.tournamentStats.weeklyWins)} />
          <Stat label="Best tournament finish" value={profile.tournamentStats.bestRank ? `#${profile.tournamentStats.bestRank}` : "—"} />
        </div>
      </section>

      {/* ── Roadmap ──────────────────────────────────────────────────── */}
      <section className="profile__section">
        <h2 className="profile__section-title">Level Roadmap (1–100)</h2>
        <div className="levels__roadmap">
          {roadmap.map((entry) => {
            const isCurrent = entry.level === info.level;
            const isLocked = entry.level > info.level;
            return (
              <div
                key={entry.level}
                ref={isCurrent ? currentRowRef : undefined}
                className={`levels__row${isCurrent ? " levels__row--current" : ""}${isLocked ? " levels__row--locked" : ""}`}
              >
                <span className="levels__row-status">
                  {isLocked ? "🔒" : entry.level <= info.level ? "✅" : ""}
                </span>
                <span className="levels__row-level">Lv {entry.level}</span>
                <span className="levels__row-xp">{entry.xpRequired.toLocaleString()} XP</span>
                <span className="levels__row-unlocks">
                  {entry.unlocks.length > 0 ? entry.unlocks.join(" · ") : <em>—</em>}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}
