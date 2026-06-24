import { levelForTotalXp, titleForLevel } from "../xp/levels";

interface XpBarProps {
  xp: number;
  selectedTitle?: string;
  compact?: boolean;
}

export function XpBar({ xp, selectedTitle, compact }: XpBarProps) {
  const info = levelForTotalXp(xp);
  const pct = info.xpForNextLevel === 0 ? 100 : Math.min(100, (info.xpIntoLevel / info.xpForNextLevel) * 100);
  const title = selectedTitle ?? titleForLevel(info.level);

  return (
    <div className={`xp-bar${compact ? " xp-bar--compact" : ""}`}>
      <div className="xp-bar__head">
        <span className="xp-bar__level">Level {info.level}</span>
        <span className="xp-bar__title">{title}</span>
      </div>
      <div className="xp-bar__track" role="progressbar" aria-valuenow={info.xpIntoLevel} aria-valuemax={info.xpForNextLevel}>
        <div className="xp-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="xp-bar__caption">
        {info.xpIntoLevel} / {info.xpForNextLevel} XP to Level {info.level + 1}
      </span>
    </div>
  );
}
