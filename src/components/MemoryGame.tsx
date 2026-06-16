import { useEffect } from "react";
import { Grid } from "./Grid";
import { HUD } from "./HUD";
import { useMemoryGame } from "../hooks/useMemoryGame";

interface MemoryGameProps {
  onExit: () => void;
  mode?: "solo" | "challenge";
  onRoundComplete?: (score: number) => void;
}

export function MemoryGame({ onExit, mode = "solo", onRoundComplete }: MemoryGameProps) {
  const { state, best, start, clickCell } = useMemoryGame();
  const { phase } = state;

  useEffect(() => {
    if (mode === "challenge" && phase === "idle") start();
  }, [mode, phase, start]);

  const isPlaying = phase !== "idle" && phase !== "over";
  const remaining = Math.max(0, state.pattern.size - state.found.size);

  const banner =
    phase === "memorize"
      ? "Memorize the lit tiles…"
      : phase === "recall"
        ? `Tap the ${state.pattern.size} tiles — ${remaining} to go`
        : phase === "feedback"
          ? state.lastRoundCorrect
            ? "Nice — leveling up"
            : "Round over — here's the answer"
          : "";

  return (
    <div className="app__shell">
      <div className="app__head">
        <button className="app__back" onClick={onExit} aria-label="Back to menu">
          ‹ Menu
        </button>
        <h1 className="app__logo">
          Memory<span>Matrix</span>
        </h1>
        <p className="app__tag">visual memory</p>
      </div>

      <HUD state={state} best={best} />

      <main className="app__stage">
        <Grid state={state} onPick={clickCell} />

        {isPlaying && (
          <p className="app__banner" role="status" aria-live="polite">
            {banner}
          </p>
        )}

        {phase === "idle" && (
          <Overlay>
            <h2>Memory Matrix</h2>
            <p className="overlay__lead">
              Tiles flash for a few seconds — longer as the board grows. Tap them
              all back before the clock runs out.
            </p>
            <ul className="overlay__rules">
              <li>Get the whole pattern → the board <b>grows</b> &amp; you score</li>
              <li>One wrong tap → the board <b>shrinks</b>, no points</li>
              <li>Bigger boards are worth far more — push your luck</li>
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
              {state.roundsWon} round{state.roundsWon === 1 ? "" : "s"} cleared ·
              reached {state.peakSize}×{state.peakSize}
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
                  <button className="btn btn--ghost" onClick={onExit}>
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

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay">
      <div className="overlay__card">{children}</div>
    </div>
  );
}
