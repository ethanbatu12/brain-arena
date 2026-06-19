import { useEffect, useRef } from "react";
import { MATH_GAME_MS } from "../math/constants";
import { levelBand } from "../math/logic";
import type { MathState, Problem } from "../math/types";
import { useMathGame } from "../hooks/useMathGame";
import { NumPad } from "./NumPad";

interface MathGameProps {
  onExit: () => void;
  mode?: "solo" | "challenge";
  onRoundComplete?: (score: number) => void;
}

export function MathGame({ onExit, mode = "solo", onRoundComplete }: MathGameProps) {
  const { state, best, start, reset, setInput, submit } = useMathGame();
  const { phase } = state;
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on the answer box whenever a new round begins or a problem swaps.
  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [phase, state.flashId]);

  useEffect(() => {
    if (mode === "challenge" && phase === "idle") start();
  }, [mode, phase, start]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <div className="app__shell">
      <div className="app__head">
        <button className="app__back" onClick={onExit} aria-label="Back to menu">
          ‹ Menu
        </button>
        <h1 className="app__logo">
          Mental<span>Math</span>
        </h1>
        <p className="app__tag">speed sprint</p>
      </div>

      <MathHUD state={state} best={best} />

      <main className="app__stage">
        <div className="bubbles">
          <Bubble problem={state.left} dim={phase !== "playing"} />
          <span className="bubbles__or">or</span>
          <Bubble problem={state.right} dim={phase !== "playing"} />
        </div>

        {phase === "playing" && (
          <form className="answer" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              className={`answer__input answer__input--${state.lastResult ?? "none"}`}
              key={state.flashId} // retrigger the flash on each resolved answer
              type="text"
              inputMode="text"
              pattern="-?[0-9]*"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Type the answer to either problem, then press Enter"
              value={state.input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <p className="answer__hint">Answer either side · press Enter</p>
          </form>
        )}

        {phase === "playing" && (
          <NumPad
            showMinus
            onDigit={(d) => {
              if (d === "-" && state.input.includes("-")) return;
              if (d === "-" && state.input.length > 0) return;
              setInput(state.input + d);
            }}
            onBackspace={() => setInput(state.input.slice(0, -1))}
            onSubmit={submit}
          />
        )}

        {phase === "idle" && (
          <Overlay>
            <h2>Mental Math</h2>
            <p className="overlay__lead">
              Two problems, always on screen. Solve <b>either one</b> — type its
              answer and press Enter. The more you get right, the harder and more
              valuable the problems become.
            </p>
            <ul className="overlay__rules">
              <li>Pick whichever side is faster for you</li>
              <li>Harder problems are worth <b>more points</b></li>
              <li>Difficulty adapts to you, up to 2-digit × 1-digit</li>
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
              {state.correct} solved · {accuracy(state)}% accuracy · best streak{" "}
              {state.bestStreak} · reached level {state.peakLevel}
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

function accuracy(state: MathState): number {
  const total = state.correct + state.wrong;
  return total === 0 ? 100 : Math.round((state.correct / total) * 100);
}

function Bubble({ problem, dim }: { problem: Problem; dim: boolean }) {
  // Keyed by problem id so a freshly generated problem animates in.
  return (
    <div className={`bubble ${dim ? "bubble--dim" : ""}`} key={problem.id}>
      <span className="bubble__problem">{problem.text || "—"}</span>
      {!dim && <span className="bubble__points">+{problem.points}</span>}
    </div>
  );
}

function MathHUD({ state, best }: { state: MathState; best: number }) {
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const pct = Math.max(0, Math.min(100, (state.timeLeftMs / MATH_GAME_MS) * 100));
  const low = state.timeLeftMs <= 10_000 && state.phase === "playing";
  const level = levelBand(state.levelF);

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score" value={state.score.toLocaleString()} />
        <Stat label="Level" value={`${level}`} />
        <Stat label="Streak" value={`${state.streak}`} />
        <Stat label="Best" value={best.toLocaleString()} />
      </div>
      <div className="hud__timer">
        <div className="hud__timer-row">
          <span className="hud__phase hud__phase--recall">
            {state.phase === "playing" ? "Solve" : state.phase === "over" ? "Time" : "Ready"}
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
