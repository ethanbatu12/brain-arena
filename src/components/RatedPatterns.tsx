import { useRatedPatternGame } from "../hooks/useRatedPatternGame";
import { RATED_PATTERN_GAIN, RATED_PATTERN_LOSS } from "../pattern/constants";
import { ratingTier } from "../pattern/ratedPatternReducer";
import { usePlayerProfile } from "../player/PlayerContext";
import type { Pattern } from "../pattern/types";

interface RatedPatternsProps {
  onExit: () => void;
}

export function RatedPatterns({ onExit }: RatedPatternsProps) {
  const { state, start, reset, answer, next, quit } = useRatedPatternGame();
  const { profile } = usePlayerProfile();
  const { phase } = state;

  const storedRating = profile?.ratedPatterns.rating ?? state.rating;

  // ── Idle ─────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Rated <span>Patterns</span></h1>
          <button className="app__back" onClick={onExit}>‹ Back</button>
        </div>

        <section className="profile__section">
          <h2 className="profile__section-title">Your Rating</h2>
          <div className="hud">
            <div className="hud__stats">
              <div className="stat">
                <span className="stat__value rated__rating">{storedRating}</span>
                <span className="stat__label">Current rating</span>
              </div>
              <div className="stat">
                <span className="stat__value">{ratingTier(storedRating)}</span>
                <span className="stat__label">Tier</span>
              </div>
              <div className="stat">
                <span className="stat__value">{profile?.ratedPatterns.highestRating ?? storedRating}</span>
                <span className="stat__label">Peak rating</span>
              </div>
              <div className="stat">
                <span className="stat__value">{profile?.ratedPatterns.totalSolved ?? 0}</span>
                <span className="stat__label">Total solved</span>
              </div>
            </div>
          </div>
        </section>

        <section className="profile__section">
          <h2 className="profile__section-title">How it works</h2>
          <ul className="overlay__rules">
            <li>Each puzzle adjusts your rating — no run-ending wrong answers</li>
            <li>Correct answer: <b>+{RATED_PATTERN_GAIN} rating</b></li>
            <li>Wrong answer: <b>−{RATED_PATTERN_LOSS} rating</b></li>
            <li>Harder patterns appear at higher ratings</li>
            <li>No time limit — think carefully!</li>
            <li>End your session any time with the Quit button</li>
          </ul>
          <button className="btn btn--primary" style={{ marginTop: "1.5rem" }} onClick={start}>
            Start Session
          </button>
        </section>
      </div>
    );
  }

  // ── Session over ─────────────────────────────────────────────────────────
  if (phase === "over") {
    const delta = state.rating - state.startRating;
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Rated <span>Patterns</span></h1>
        </div>

        <section className="profile__section">
          <h2 className="profile__section-title">Session Complete</h2>
          <div className="hud">
            <div className="hud__stats">
              <div className="stat">
                <span className={`stat__value ${delta >= 0 ? "rated__gain" : "rated__loss"}`}>
                  {delta >= 0 ? "+" : ""}{delta}
                </span>
                <span className="stat__label">Rating change</span>
              </div>
              <div className="stat">
                <span className="stat__value rated__rating">{state.rating}</span>
                <span className="stat__label">New rating</span>
              </div>
              <div className="stat">
                <span className="stat__value">{state.solved}</span>
                <span className="stat__label">Solved</span>
              </div>
              <div className="stat">
                <span className="stat__value">{state.attempted}</span>
                <span className="stat__label">Attempted</span>
              </div>
            </div>
          </div>
          <p style={{ marginTop: "1rem", color: "var(--text-dim)" }}>
            {ratingTier(state.rating)} · {state.attempted > 0 ? Math.round((state.solved / state.attempted) * 100) : 0}% accuracy
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button className="btn btn--primary" onClick={start}>New Session</button>
            <button className="btn btn--ghost" onClick={() => { reset(); onExit(); }}>Menu</button>
          </div>
        </section>
      </div>
    );
  }

  // ── Feedback (result of last answer) ─────────────────────────────────────
  if (phase === "feedback" && state.current) {
    const correct = state.lastResult === "correct";
    const ratingChange = correct ? RATED_PATTERN_GAIN : -RATED_PATTERN_LOSS;
    const sessionDelta = state.rating - state.startRating;

    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Rated <span>Patterns</span></h1>
          <button className="app__back" onClick={quit}>Quit</button>
        </div>

        <section className="profile__section">
          <div className={`rated__result-banner rated__result-banner--${correct ? "correct" : "wrong"}`}>
            {correct ? "✓ Correct!" : "✗ Wrong"}
          </div>

          {!correct && (
            <div className="rated-pattern__answer-reveal">
              <span className="rated-pattern__answer-label">The correct answer was</span>
              <span className="rated-pattern__answer-value">{state.current.answer}</span>
            </div>
          )}

          <div className="hud" style={{ marginTop: "1rem" }}>
            <div className="hud__stats">
              <div className="stat">
                <span className={`stat__value ${ratingChange >= 0 ? "rated__gain" : "rated__loss"}`}>
                  {ratingChange >= 0 ? "+" : ""}{ratingChange}
                </span>
                <span className="stat__label">Rating change</span>
              </div>
              <div className="stat">
                <span className="stat__value rated__rating">{state.rating}</span>
                <span className="stat__label">Rating</span>
              </div>
              <div className="stat">
                <span className={`stat__value ${sessionDelta >= 0 ? "rated__gain" : "rated__loss"}`}>
                  {sessionDelta >= 0 ? "+" : ""}{sessionDelta}
                </span>
                <span className="stat__label">Session Δ</span>
              </div>
              <div className="stat">
                <span className="stat__value">{state.solved}/{state.attempted}</span>
                <span className="stat__label">Solved</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button className="btn btn--primary" onClick={next}>Next Pattern</button>
            <button className="btn btn--ghost" onClick={quit}>End Session</button>
          </div>
        </section>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  if (phase === "playing" && state.current) {
    const sessionDelta = state.rating - state.startRating;
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Rated <span>Patterns</span></h1>
          <button className="app__back" onClick={quit}>Quit</button>
        </div>

        <div className="rated__header">
          <div className="stat">
            <span className="stat__value rated__rating">{state.rating}</span>
            <span className="stat__label">{ratingTier(state.rating)}</span>
          </div>
          <div className="stat">
            <span className={`stat__value ${sessionDelta >= 0 ? "rated__gain" : "rated__loss"}`}>
              {sessionDelta >= 0 ? "+" : ""}{sessionDelta}
            </span>
            <span className="stat__label">Session Δ</span>
          </div>
          <div className="stat">
            <span className="stat__value">{state.solved}/{state.attempted}</span>
            <span className="stat__label">Solved</span>
          </div>
        </div>

        <main className="app__stage">
          <PatternCard
            pattern={state.current}
            flashId={state.flashId}
            lastResult={state.lastResult}
            onAnswer={answer}
          />
        </main>
      </div>
    );
  }

  return null;
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

  const options = shuffleOptions([pattern.answer, ...pattern.distractors], flashId);

  return (
    <div className={`pattern__card ${flashClass}`} key={flashId}>
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
    </div>
  );
}

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
