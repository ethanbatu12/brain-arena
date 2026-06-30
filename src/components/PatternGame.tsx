import { useEffect } from "react";
import { PATTERN_GAME_MS } from "../pattern/constants";
import { levelBand } from "../pattern/logic";
import type { Pattern, PatternState } from "../pattern/types";
import { usePatternGame } from "../hooks/usePatternGame";

interface PatternGameProps {
  onExit: () => void;
  mode?: "solo" | "challenge";
  onRoundComplete?: (score: number) => void;
}

export function PatternGame({ onExit, mode = "solo", onRoundComplete }: PatternGameProps) {
  const { state, best, start, reset, answer } = usePatternGame();
  const { phase } = state;

  useEffect(() => {
    if (mode === "challenge" && phase === "idle") start();
  }, [mode, phase, start]);

  const accuracy =
    state.correct + state.wrong === 0
      ? 100
      : Math.round((state.correct / (state.correct + state.wrong)) * 100);

  return (
    <div className="app__shell">
      <div className="app__head">
        <button className="app__back" onClick={onExit} aria-label="Back to menu">
          ‹ Menu
        </button>
        <h1 className="app__logo">
          Fill the<span>Pattern</span>
        </h1>
        <p className="app__tag">sequence sprint</p>
      </div>

      <PatternHUD state={state} best={best} />

      <main className="app__stage">
        {phase === "playing" && state.current && (
          <PatternCard
            pattern={state.current}
            flashId={state.flashId}
            lastResult={state.lastResult}
            onAnswer={answer}
          />
        )}

        {phase === "idle" && (
          <Overlay>
            <h2>Fill in the Pattern</h2>
            <p className="overlay__lead">
              A sequence appears with one value missing — figure out the rule
              and tap the correct answer. Patterns grow harder as you score.
            </p>
            <ul className="overlay__rules">
              <li>Each correct answer: <b>50+ points</b></li>
              <li>Every 5 correct: <b>+50 bonus</b></li>
              <li>Wrong answers score 0</li>
              <li>Types: arithmetic, geometric, Fibonacci, squares, cubes, primes, and more</li>
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
              {state.correct} solved · {accuracy}% accuracy · best streak{" "}
              {state.bestStreak} · reached level {state.peakLevel}
              {state.score >= best && state.score > 0 ? " · new best!" : ""}
            </p>
            <div className="overlay__actions">
              {mode === "challenge" ? (
                <button
                  className="btn btn--primary"
                  onClick={() => onRoundComplete?.(state.score)}
                >
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

// ── sub-components ─────────────────────────────────────────────────────────────

function PatternHUD({ state, best }: { state: PatternState; best: number }) {
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const pct = Math.max(0, Math.min(100, (state.timeLeftMs / PATTERN_GAME_MS) * 100));
  const low = state.timeLeftMs <= 10_000 && state.phase === "playing";
  const level = levelBand(state.levelF);
  const nextBonus = 5 - (state.correct % 5);

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score"  value={state.score.toLocaleString()} />
        <Stat label="Level"  value={`${level}`} />
        <Stat label="Streak" value={`${state.streak}`} />
        <Stat label="Best"   value={best.toLocaleString()} />
        {state.phase === "playing" && (
          <Stat label="Next bonus" value={`in ${nextBonus}`} />
        )}
      </div>
      <div className="hud__timer">
        <div className="hud__timer-row">
          <span className="hud__phase hud__phase--recall">
            {state.phase === "playing" ? "Solve" : state.phase === "over" ? "Time" : "Ready"}
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

function PatternCard({
  pattern,
  flashId,
  lastResult,
  onAnswer,
}: {
  pattern: Pattern;
  flashId: number;
  lastResult: "correct" | "wrong" | null;
  onAnswer: (v: string) => void;
}) {
  const flashClass =
    lastResult === "correct"
      ? "pattern__card--correct"
      : lastResult === "wrong"
        ? "pattern__card--wrong"
        : "";

  // All options = answer + distractors, shuffled with the flashId as seed
  const options = shuffleOptions(
    [pattern.answer, ...pattern.distractors],
    flashId,
  );

  return (
    <div className={`pattern__card ${flashClass}`} key={flashId}>
      <p className="pattern__hint">{pattern.hint}</p>
      <div className="pattern__sequence">
        {pattern.terms.map((term, i) => (
          <span
            key={i}
            className={`pattern__term ${term === null ? "pattern__term--gap" : ""}`}
          >
            {term === null ? "?" : String(term)}
          </span>
        ))}
      </div>
      <div className="pattern__choices" aria-label="Choose the missing value">
        {options.map((opt) => (
          <button
            key={opt}
            className="pattern__choice btn btn--ghost"
            onClick={() => onAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="pattern__points">+{pattern.points} pts</p>
    </div>
  );
}

/** Deterministic shuffle of the answer choices so they don't move between renders. */
function shuffleOptions(opts: string[], seed: number): string[] {
  const arr = [...opts];
  let s = seed + 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = ((s * 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay">
      <div className="overlay__card">{children}</div>
    </div>
  );
}
