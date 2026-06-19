import { useEffect, useRef } from "react";
import { BONUS_EVERY, BONUS_POINTS, CUBE_GAME_MS, POINTS_PER_CORRECT } from "../cube/constants";
import type { CubeState } from "../cube/types";
import { useCubeGame } from "../hooks/useCubeGame";
import { CubeStructureView } from "./CubeStructureView";
import { NumPad } from "./NumPad";

interface LogicGameProps {
  onExit: () => void;
  mode?: "solo" | "challenge";
  onRoundComplete?: (score: number) => void;
}

export function LogicGame({ onExit, mode = "solo", onRoundComplete }: LogicGameProps) {
  const { state, best, start, reset, setInput, submit } = useCubeGame();
  const { phase } = state;
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on the answer box whenever a new round begins or a structure swaps.
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
          Logic<span>Challenge</span>
        </h1>
        <p className="app__tag">spatial reasoning</p>
      </div>

      <LogicHUD state={state} best={best} />

      <main className="app__stage">
        {phase === "playing" && <CubeStructureView structure={state.structure} />}

        {phase === "playing" && (
          <form className="answer" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              className={`answer__input answer__input--${state.lastResult === "correct" ? "left" : state.lastResult === "wrong" ? "wrong" : "none"}`}
              key={state.flashId} // retrigger the flash on each resolved answer
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="How many cubes are in the structure?"
              value={state.input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <p className="answer__hint">How many cubes in total? · press Enter</p>
          </form>
        )}

        {phase === "playing" && (
          <NumPad
            onDigit={(d) => setInput(state.input + d)}
            onBackspace={() => setInput(state.input.slice(0, -1))}
            onSubmit={submit}
          />
        )}

        {phase === "idle" && (
          <Overlay>
            <h2>Logic Challenge</h2>
            <p className="overlay__lead">
              A 3D structure made of cube towers appears. Count only the
              cubes you can actually see on top of each tower and add them up
              for the total.
            </p>
            <ul className="overlay__rules">
              <li>
                Correct answer: <b>+{POINTS_PER_CORRECT} points</b> and a new,
                slightly bigger structure
              </li>
              <li>
                Every <b>{BONUS_EVERY} in a row</b>: an extra <b>+{BONUS_POINTS} bonus</b>
              </li>
              <li>Wrong answers move on without losing your progress</li>
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
              {state.correct} solved · {accuracy(state)}% accuracy · reached level{" "}
              {state.peakLevel}
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

function accuracy(state: CubeState): number {
  const total = state.correct + state.wrong;
  return total === 0 ? 100 : Math.round((state.correct / total) * 100);
}

function LogicHUD({ state, best }: { state: CubeState; best: number }) {
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const pct = Math.max(0, Math.min(100, (state.timeLeftMs / CUBE_GAME_MS) * 100));
  const low = state.timeLeftMs <= 10_000 && state.phase === "playing";

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score" value={state.score.toLocaleString()} />
        <Stat label="Level" value={`${state.level}`} />
        <Stat label="Correct" value={`${state.correct}`} />
        <Stat label="Best" value={best.toLocaleString()} />
      </div>
      {state.phase === "playing" && (
        <p className="hud__sub">
          {state.streakToBonus}/{BONUS_EVERY} correct until bonus
        </p>
      )}
      <div className="hud__timer">
        <div className="hud__timer-row">
          <span className="hud__phase hud__phase--recall">
            {state.phase === "playing" ? "Count" : state.phase === "over" ? "Time" : "Ready"}
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
