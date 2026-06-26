import { useEffect } from "react";
import { BONUS_EVERY_HITS, BONUS_POINTS, GRID_SIZE, POINTS_PER_DOT, REACTION_GAME_MS } from "../reaction/constants";
import type { ReactionState } from "../reaction/types";
import { useReactionGame } from "../hooks/useReactionGame";

interface ReactionGameProps {
  onExit: () => void;
  mode?: "solo" | "challenge";
  onRoundComplete?: (score: number) => void;
}

export function ReactionGame({ onExit, mode = "solo", onRoundComplete }: ReactionGameProps) {
  const { state, best, start, reset, tap } = useReactionGame();
  const { phase } = state;

  useEffect(() => {
    if (mode === "challenge" && phase === "idle") start();
  }, [mode, phase, start]);

  const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    col: i % GRID_SIZE,
    row: Math.floor(i / GRID_SIZE),
  }));

  return (
    <div className="app__shell">
      <div className="app__head">
        <button className="app__back" onClick={onExit} aria-label="Back to menu">
          ‹ Menu
        </button>
        <h1 className="app__logo">
          Reaction<span>Grid</span>
        </h1>
        <p className="app__tag">tap the dot</p>
      </div>

      <ReactionHUD state={state} best={best} />

      <main className="app__stage">
        {phase === "playing" && (
          <div
            className="reaction__grid"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {cells.map(({ col, row }) => {
              const isDot = state.dot?.col === col && state.dot?.row === row;
              const justHit = isDot && state.dot!.id === state.lastHitId;
              return (
                <div key={`${col}-${row}`} className="reaction__cell">
                  {isDot && (
                    <button
                      key={`${state.dot!.id}-${justHit ? state.flashId : ""}`}
                      className="reaction__dot"
                      aria-label="Tap the blue dot"
                      onClick={() => tap(state.dot!.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {phase === "idle" && (
          <Overlay>
            <h2>Reaction Grid</h2>
            <p className="overlay__lead">
              A blue dot appears somewhere on the grid. Tap it as fast as you
              can before it disappears — a new one spawns immediately.
            </p>
            <ul className="overlay__rules">
              <li>
                Hit a dot: <b>+{POINTS_PER_DOT} points</b>
              </li>
              <li>
                Every <b>{BONUS_EVERY_HITS} hits</b>: an extra{" "}
                <b>+{BONUS_POINTS} bonus</b>
              </li>
              <li>Miss a dot and it's gone — no penalty, just keep tapping</li>
            </ul>
            <button className="btn btn--primary" onClick={start}>
              Start · 30 seconds
            </button>
            {best > 0 && <p className="overlay__best">Best score {best.toLocaleString()}</p>}
          </Overlay>
        )}

        {phase === "over" && (
          <Overlay>
            <h2>Time!</h2>
            <div className="overlay__score">{state.score.toLocaleString()}</div>
            <p className="overlay__lead">
              {state.hits} hit{state.hits === 1 ? "" : "s"} · {accuracy(state)}% accuracy
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

function accuracy(state: ReactionState): number {
  const total = state.hits + state.misses;
  return total === 0 ? 100 : Math.round((state.hits / total) * 100);
}

function ReactionHUD({ state, best }: { state: ReactionState; best: number }) {
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const pct = Math.max(0, Math.min(100, (state.timeLeftMs / REACTION_GAME_MS) * 100));
  const low = state.timeLeftMs <= 10_000 && state.phase === "playing";

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score" value={state.score.toLocaleString()} />
        <Stat label="Hits" value={`${state.hits}`} />
        <Stat label="Best" value={best.toLocaleString()} />
      </div>
      {state.phase === "playing" && (
        <p className="hud__sub">{BONUS_EVERY_HITS - (state.hits % BONUS_EVERY_HITS)} hits until bonus</p>
      )}
      <div className="hud__timer">
        <div className="hud__timer-row">
          <span className="hud__phase hud__phase--recall">
            {state.phase === "playing" ? "Tap" : state.phase === "over" ? "Time" : "Ready"}
          </span>
          <span className={`hud__clock ${low ? "is-low" : ""}`}>{seconds}s</span>
        </div>
        <div className="hud__bar" aria-hidden>
          <div className={`hud__bar-fill ${low ? "is-low" : ""}`} style={{ width: `${pct}%` }} />
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
