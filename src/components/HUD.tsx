import { GAME_MS } from "../game/constants";
import type { GameState } from "../game/types";

interface HUDProps {
  state: GameState;
  best: number;
}

const PHASE_LABEL: Record<GameState["phase"], string> = {
  idle: "Ready",
  memorize: "Memorize",
  recall: "Recall",
  feedback: "—",
  over: "Time",
};

/** Top status bar: countdown, score, level (board size) and best. */
export function HUD({ state, best }: HUDProps) {
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const pct = Math.max(0, Math.min(100, (state.timeLeftMs / GAME_MS) * 100));
  const low = state.timeLeftMs <= 10_000 && state.phase !== "idle";

  const label =
    state.phase === "feedback"
      ? state.lastRoundCorrect
        ? "Correct"
        : "Missed"
      : PHASE_LABEL[state.phase];

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score" value={state.score.toLocaleString()} />
        <Stat label="Level" value={`${state.gridSize}×${state.gridSize}`} />
        <Stat label="Round" value={String(Math.max(1, state.round))} />
        <Stat label="Best" value={best.toLocaleString()} />
      </div>

      <div className="hud__timer">
        <div className="hud__timer-row">
          <span
            className={`hud__phase hud__phase--${state.phase} ${
              state.phase === "feedback" && state.lastRoundCorrect ? "is-good" : ""
            } ${state.phase === "feedback" && state.lastRoundCorrect === false ? "is-bad" : ""}`}
          >
            {label}
          </span>
          <span className={`hud__clock ${low ? "is-low" : ""}`}>{seconds}s</span>
        </div>
        <div className="hud__bar" aria-hidden>
          <div
            className={`hud__bar-fill ${low ? "is-low" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </header>
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
