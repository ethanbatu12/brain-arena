import { useEffect, useState } from "react";
import {
  BONUS_EVERY_CORRECT,
  BONUS_POINTS,
  CATEGORY_META,
  OBSERVATION_REVEAL_MS,
  POINTS_PER_CORRECT,
  TRIVIA_GAME_MS,
} from "../trivia/constants";
import type { TriviaState } from "../trivia/types";
import { useTriviaGame } from "../hooks/useTriviaGame";

interface TriviaGameProps {
  onExit: () => void;
  mode?: "solo" | "challenge";
  onRoundComplete?: (score: number) => void;
}

export function TriviaGame({ onExit, mode = "solo", onRoundComplete }: TriviaGameProps) {
  const { state, best, start, reset, answer } = useTriviaGame();
  const { phase, question } = state;

  // Observation questions briefly show their grid before the answer choices appear.
  const [revealed, setRevealed] = useState(true);
  useEffect(() => {
    if (!question) return;
    if (question.category !== "observation" || !question.observationGrid) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    const id = setTimeout(() => setRevealed(true), OBSERVATION_REVEAL_MS);
    return () => clearTimeout(id);
  }, [question]);

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
          Brain<span>Blitz</span>
        </h1>
        <p className="app__tag">trivia sprint</p>
      </div>

      <TriviaHUD state={state} best={best} />

      <main className="app__stage">
        {phase === "playing" && question && (
          <div
            key={state.flashId}
            className={`trivia__card${state.lastResult ? (state.lastResult.correct ? " trivia__card--correct" : " trivia__card--wrong") : ""}`}
          >
            <span className="trivia__category">
              {CATEGORY_META[question.category].icon} {CATEGORY_META[question.category].label}
            </span>

            {question.observationGrid && !revealed ? (
              <div className="trivia__observation-grid">
                {question.observationGrid.map((row, ri) => (
                  <div className="trivia__observation-row" key={ri}>
                    {row.map((cell, ci) => (
                      <span className="trivia__observation-cell" key={ci}>
                        {cell}
                      </span>
                    ))}
                  </div>
                ))}
                <p className="trivia__observation-hint">Memorize the grid…</p>
              </div>
            ) : (
              <>
                <p className="trivia__prompt">{question.prompt}</p>
                <div className="trivia__choices">
                  {question.choices.map((choice, i) => (
                    <button key={i} className="trivia__choice" onClick={() => answer(question.id, i)}>
                      {choice}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {phase === "idle" && (
          <Overlay>
            <h2>Brain Blitz Trivia</h2>
            <p className="overlay__lead">
              Answer fast, multiple-choice questions across math, logic,
              patterns, probability, observation, chess, and general
              knowledge. Difficulty climbs as you go.
            </p>
            <ul className="overlay__rules">
              <li>
                Correct answer: <b>+{POINTS_PER_CORRECT} points</b>
              </li>
              <li>
                Every <b>{BONUS_EVERY_CORRECT} correct</b>: an extra{" "}
                <b>+{BONUS_POINTS} bonus</b>
              </li>
              <li>Wrong answers cost nothing — just keep going</li>
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
              {state.correctCount} correct of {state.totalAnswered} · {accuracy(state)}% accuracy
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

function accuracy(state: TriviaState): number {
  if (state.totalAnswered === 0) return 0;
  return Math.round((state.correctCount / state.totalAnswered) * 100);
}

function TriviaHUD({ state, best }: { state: TriviaState; best: number }) {
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const pct = Math.max(0, Math.min(100, (state.timeLeftMs / TRIVIA_GAME_MS) * 100));
  const low = state.timeLeftMs <= 10_000 && state.phase === "playing";

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score" value={state.score.toLocaleString()} />
        <Stat label="Correct" value={`${state.correctCount}`} />
        <Stat label="Best" value={best.toLocaleString()} />
      </div>
      {state.phase === "playing" && (
        <p className="hud__sub">
          {BONUS_EVERY_CORRECT - (state.correctCount % BONUS_EVERY_CORRECT)} correct until bonus
        </p>
      )}
      <div className="hud__timer">
        <div className="hud__timer-row">
          <span className="hud__phase hud__phase--recall">
            {state.phase === "playing" ? "Answer" : state.phase === "over" ? "Time" : "Ready"}
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
