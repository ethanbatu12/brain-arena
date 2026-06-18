import { useEffect } from "react";
import { getAchievementDef } from "../player/achievements";
import type { AchievementRecord } from "../player/types";

interface AchievementToastProps {
  achievement: AchievementRecord;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const def = getAchievementDef(achievement.id);

  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!def) return null;

  return (
    <div className="achievement-toast" role="status" aria-live="polite">
      <span className="achievement-toast__icon">{def.icon}</span>
      <div className="achievement-toast__body">
        <div className="achievement-toast__title">Achievement Unlocked!</div>
        <div className="achievement-toast__name">{def.label}</div>
        <div className="achievement-toast__desc">{def.description}</div>
      </div>
      <button className="achievement-toast__close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
