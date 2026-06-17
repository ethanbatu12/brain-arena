import { ratingTier } from "../pattern/ratedPatternReducer";
import type { RatedPatternStats } from "../player/types";

interface PatternLobbyProps {
  ratedPatterns: RatedPatternStats;
  onTimed: () => void;
  onRated: () => void;
  onBack: () => void;
}

export function PatternLobby({ ratedPatterns, onTimed, onRated, onBack }: PatternLobbyProps) {
  return (
    <div className="app__shell">
      <div className="app__head">
        <button className="app__back" onClick={onBack} aria-label="Back to hub">
          ‹ Hub
        </button>
        <h1 className="app__logo">
          Pattern<span>Games</span>
        </h1>
        <p className="app__tag">choose your mode</p>
      </div>

      <main className="app__stage">
        <div className="overlay">
          <div className="overlay__card">
            <div className="chess-lobby__modes">
              <button className="chess-lobby__mode btn btn--primary" onClick={onTimed}>
                <span className="chess-lobby__mode-title">Timed Sprint</span>
                <span className="chess-lobby__mode-desc">
                  Race the clock · 60 seconds · 75+ pts per answer · bonus every 5 correct
                </span>
              </button>

              <button className="chess-lobby__mode btn btn--ghost" onClick={onRated}>
                <span className="chess-lobby__mode-title">Rated Patterns</span>
                <span className="chess-lobby__mode-desc">
                  No timer · one wrong ends the run · current rating{" "}
                  <b>{ratedPatterns.rating}</b> ({ratingTier(ratedPatterns.rating)})
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
