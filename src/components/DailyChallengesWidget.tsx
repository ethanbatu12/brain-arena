import type { TripleChallengeState, ChallengeStreakData } from "../player/tripleChallenges";

interface DailyChallengesWidgetProps {
  challenges: TripleChallengeState;
  streak: ChallengeStreakData;
}

function timeUntilNextReset(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);
  const ms = tomorrow.getTime() - now.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function DailyChallengesWidget({ challenges, streak }: DailyChallengesWidgetProps) {
  return (
    <div className="daily-challenges">
      <div className="daily-challenges__head">
        <h2 className="daily-challenges__title">Daily Challenges</h2>
        <span className="daily-challenges__reset">Resets in {timeUntilNextReset()}</span>
      </div>
      {streak.currentStreak > 0 && (
        <p className="daily-challenges__streak">
          🔥 {streak.currentStreak}-day streak (best: {streak.longestStreak})
        </p>
      )}
      <div className="daily-challenges__list">
        {challenges.challenges.map((c) => {
          const pct = Math.min(100, (c.progress / c.target) * 100);
          return (
            <div key={c.id} className={`daily-challenges__item${c.completed ? " daily-challenges__item--done" : ""}`}>
              <div className="daily-challenges__item-head">
                <span className="daily-challenges__item-desc">{c.completed ? "✅ " : ""}{c.description}</span>
                <span className="daily-challenges__item-xp">+{c.xpReward} XP</span>
              </div>
              <div className="daily-challenges__track">
                <div className="daily-challenges__fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="daily-challenges__progress">
                {Math.min(c.progress, c.target)} / {c.target}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
