import { useEffect } from "react";
import {
  BALLOON_GAME_MS,
  BONUS_EVERY_SETS,
  BONUS_POINTS,
  POINTS_PER_BALLOON,
} from "../balloon/constants";
import type { BalloonState } from "../balloon/types";
import { useBalloonGame } from "../hooks/useBalloonGame";

const PALETTE = ["var(--accent)", "var(--good)", "var(--warn)", "var(--logic)", "var(--balloon)", "var(--bad)"];

interface BalloonGameProps {
  onExit: () => void;
  mode?: "solo" | "challenge";
  onRoundComplete?: (score: number) => void;
}

export function BalloonGame({ onExit, mode = "solo", onRoundComplete }: BalloonGameProps) {
  const { state, best, start, reset, tap } = useBalloonGame();
  const { phase } = state;

  useEffect(() => {
    if (mode === "challenge" && phase === "idle") start();
  }, [mode, phase, start]);

  return (
    <div className="app__shell">
      <div className="app__head">
        <button className="app__back" onClick={onExit} aria-label="Back to menu">
          ‹ Menu
        </button>
        <h1 className="app__logo">
          Balloon<span>Order</span>
        </h1>
        <p className="app__tag">ascending order</p>
      </div>

      <BalloonHUD state={state} best={best} />

      <main className="app__stage">
        {phase === "playing" && (
          <div className="balloons__stage">
            {state.balloons.map((b, i) => {
              const justResolved = state.lastResult?.id === b.id;
              const className = [
                "balloon",
                b.popped ? "balloon--popped" : "",
                justResolved && !state.lastResult?.correct ? "balloon--wrong" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={`${b.id}-${justResolved ? state.flashId : ""}`}
                  className={className}
                  style={{
                    left: `${b.x * 100}%`,
                    top: `${b.y * 100}%`,
                    ["--balloon-color" as string]: PALETTE[i % PALETTE.length],
                  }}
                  disabled={b.popped}
                  aria-label={`Balloon ${b.label}`}
                  onClick={() => tap(b.id)}
                >
                  <span className="balloon__label">{b.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {phase === "idle" && (
          <Overlay>
            <h2>Balloon Order</h2>
            <p className="overlay__lead">
              Balloons drift onto the screen carrying numbers and math
              expressions. Tap them in order from the smallest value to the
              largest before time runs out.
            </p>
            <ul className="overlay__rules">
              <li>
                Correct tap: <b>+{POINTS_PER_BALLOON} points</b>
              </li>
              <li>
                Clear <b>{BONUS_EVERY_SETS} sets in a row</b>: an extra{" "}
                <b>+{BONUS_POINTS} bonus</b>
              </li>
              <li>Wrong taps don't cost points — just keep going in order</li>
              <li>Each cleared set adds more balloons and harder expressions</li>
            </ul>
            <button className="btn btn--primary" onClick={start}>
              Start · 60 seconds
            </button>
            {best > 0 && <p className="overlay__best">Best score {best.toLocaleString()}</p>}
          </Overlay>
        )}

        {phase === "over" && (
          <Overlay>
            <h2>Time!</h2>
            <div className="overlay__score">{state.score.toLocaleString()}</div>
            <p className="overlay__lead">
              {state.completedSets} set{state.completedSets === 1 ? "" : "s"} cleared ·{" "}
              {accuracy(state)}% accuracy · reached level {state.peakLevel}
              {state.score >= best && state.score > 0 ? " · new best!" : ""}
            </p>
            <div className="overlay__actions">
              {mode === "challenge" ? (
                <button className="btn btn--primary" onClick={() => onRoundComplete?.(state.score)}>
                  Continue ›
                </button>
              ) : (
                <>
                  <button className="btn btn--primary" onClick={start}>
                    Play again
                  </button>
                  <button
                    className="btn btn--ghost"
                    onClick={() => {
                      reset();
                      onExit();
                    }}
                  >
                    Menu
                  </button>
                </>
              )}
            </div>
          </Overlay>
        )}
      </main>
    </div>
  );
}

function accuracy(state: BalloonState): number {
  const total = state.correctTaps + state.wrongTaps;
  return total === 0 ? 100 : Math.round((state.correctTaps / total) * 100);
}

function BalloonHUD({ state, best }: { state: BalloonState; best: number }) {
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const pct = Math.max(0, Math.min(100, (state.timeLeftMs / BALLOON_GAME_MS) * 100));
  const low = state.timeLeftMs <= 10_000 && state.phase === "playing";

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score" value={state.score.toLocaleString()} />
        <Stat label="Level" value={`${state.level}`} />
        <Stat label="Sets" value={`${state.completedSets}`} />
        <Stat label="Best" value={best.toLocaleString()} />
      </div>
      {state.phase === "playing" && (
        <p className="hud__sub">
          {state.setsToBonus}/{BONUS_EVERY_SETS} sets until bonus
        </p>
      )}
      <div className="hud__timer">
        <div className="hud__timer-row">
          <span className="hud__phase hud__phase--recall">
            {state.phase === "playing" ? "Pop" : state.phase === "over" ? "Time" : "Ready"}
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

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay">
      <div className="overlay__card">{children}</div>
    </div>
  );
}
