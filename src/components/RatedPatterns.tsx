import { useRatedPatternGame } from "../hooks/useRatedPatternGame";
import { ratingTier } from "../pattern/ratedPatternReducer";
import { usePlayerProfile } from "../player/PlayerContext";
import type { Pattern } from "../pattern/types";

interface RatedPatternsProps {
  onExit: () => void;
}

export function RatedPatterns({ onExit }: RatedPatternsProps) {
  const { state, start, reset, answer } = useRatedPatternGame();
  const { profile } = usePlayerProfile();
  const { phase } = state;

  const stats = profile?.ratedPatterns;
  const displayRating = phase === "idle" ? (stats?.rating ?? state.rating) : state.rating;

  return (
    <div className="app__shell">
      <div className="app__head">
        <button className="app__back" onClick={onExit} aria-label="Back to menu">
          ‹ Menu
        </button>
        <h1 className="app__logo">
          Rated<span>Patterns</span>
        </h1>
        <p className="app__tag">survive as long as you can</p>
      </div>

      <header className="hud">
        <div className="hud__stats">
          <Stat label="Rating" value={displayRating.toString()} />
          <Stat label="Tier" value={ratingTier(displayRating)} />
          {phase === "playing" && <Stat label="Solved" value={state.solved.toString()} />}
          {stats && <Stat label="Best" value={stats.highestRating.toString()} />}
        </div>
      </header>

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
            <h2>Rated Patterns</h2>
            <p className="overlay__lead">
              Answer pattern sequences correctly to gain rating. One wrong answer ends your run.
            </p>
            <ul className="overlay__rules">
              <li>Correct answer: <b>+15 rating</b></li>
              <li>Wrong answer: <b>−25 rating</b> (run ends)</li>
              <li>Harder patterns at higher ratings</li>
              <li>No time limit — think carefully!</li>
            </ul>
            {stats && (
              <p className="overlay__best">
                Current rating: <b>{stats.rating}</b> · {ratingTier(stats.rating)}
              </p>
            )}
            <button className="btn btn--primary" onClick={start}>
              Start Run
            </button>
          </Overlay>
        )}

        {phase === "over" && (
          <Overlay>
            <h2>{state.lastResult === "wrong" ? "Run Over!" : "Complete"}</h2>
            <div className="overlay__score">{state.rating}</div>
            <p className="overlay__lead">
              {state.lastResult === "wrong"
                ? `Solved ${state.solved} · wrong answer ended the run`
                : `Solved ${state.solved}`}
              {" "}· {ratingTier(state.rating)}
            </p>
            <div className="overlay__actions">
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
            </div>
          </Overlay>
        )}
      </main>
    </div>
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

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay">
      <div className="overlay__card">{children}</div>
    </div>
  );
}
