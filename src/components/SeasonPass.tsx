import { useState } from "react";
import type { PlayerProfile } from "../player/types";
import { claimableRewards, rewardTrackFor, seasonCompletionPercent } from "../season/progress";
import { seasonLevelForXp, xpIntoCurrentTier, xpRequiredForNextTier, type SeasonReward } from "../season/rewards";
import { daysRemainingInSeason, themeForSeason } from "../season/schedule";

interface SeasonPassProps {
  profile: PlayerProfile;
  onBack: () => void;
  onViewHistory: () => void;
  onClaimReward: (rewardId: string) => { ok: true; reward: SeasonReward } | { ok: false; error: string };
}

export function SeasonPass({ profile, onBack, onViewHistory, onClaimReward }: SeasonPassProps) {
  const { seasonProgress } = profile;
  const theme = themeForSeason(seasonProgress.seasonIndex);
  const level = seasonLevelForXp(seasonProgress.seasonXp);
  const xpIntoTier = xpIntoCurrentTier(seasonProgress.seasonXp);
  const xpForNext = xpRequiredForNextTier();
  const pct = Math.min(100, (xpIntoTier / xpForNext) * 100);
  const daysLeft = daysRemainingInSeason(seasonProgress.seasonIndex, Date.now());
  const track = rewardTrackFor(seasonProgress);
  const claimable = new Set(claimableRewards(seasonProgress).map((r) => r.id));
  const claimed = new Set(seasonProgress.claimedRewardIds);
  const completion = seasonCompletionPercent(seasonProgress);

  const [message, setMessage] = useState<string | null>(null);

  const handleClaim = (reward: SeasonReward) => {
    const result = onClaimReward(reward.id);
    setMessage(result.ok ? `Claimed: ${reward.label}!` : "Couldn't claim that reward.");
  };

  return (
    <div className="app__shell">
      <div className="screen-header">
        <button className="btn btn--ghost" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Season Pass</h1>
        <button className="btn btn--ghost" onClick={onViewHistory}>
          Season History
        </button>
      </div>

      <section
        className="season-hero"
        style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }}
      >
        <p className="season-hero__name">{theme.name}</p>
        <div className="season-hero__top">
          <span className="season-hero__level">Tier {level}</span>
          <span className="season-hero__days">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>
        </div>
        <div className="season-hero__bar">
          <div className="season-hero__bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="season-hero__xp">
          {xpIntoTier} / {xpForNext} Season XP to Tier {Math.min(100, level + 1)}
        </p>
        <p className="season-hero__completion">{completion}% of the season's rewards claimed</p>
      </section>

      {message && <p className="season-message">{message}</p>}

      <div className="season-track">
        {track.map((reward) => {
          const isClaimed = claimed.has(reward.id);
          const isClaimable = claimable.has(reward.id);
          const isLocked = !isClaimed && !isClaimable;
          return (
            <div
              key={reward.id}
              className={`season-card${isClaimed ? " season-card--claimed" : ""}${isLocked ? " season-card--locked" : ""}`}
            >
              <span className="season-card__tier">Tier {reward.tier}</span>
              <span className="season-card__label">{isLocked ? "🔒" : rewardEmoji(reward.kind)}</span>
              <span className="season-card__name">{reward.label}</span>
              {isClaimed ? (
                <span className="season-card__status">Claimed</span>
              ) : isClaimable ? (
                <button className="btn btn--primary season-card__claim" onClick={() => handleClaim(reward)}>
                  Claim
                </button>
              ) : (
                <span className="season-card__status">Locked</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function rewardEmoji(kind: SeasonReward["kind"]): string {
  switch (kind) {
    case "coins": return "🪙";
    case "xp": return "✨";
    case "pet": return "🐾";
    case "petSkin": return "🎨";
    case "hairstyle": return "💇";
    case "hairColor": return "🎨";
    case "clothing": return "👕";
    case "accessory": return "🎩";
    case "banner": return "🚩";
    case "border": return "🖼️";
    case "animatedBorder": return "🖼️";
    case "victoryAnimation": return "🏆";
    case "avatarEffect": return "💫";
    case "title": return "🏅";
    case "animatedNameColor": return "🌈";
    case "badge": return "🎖️";
    default: return "🎁";
  }
}
