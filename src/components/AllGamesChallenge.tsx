import { useState } from "react";
import { GAMES } from "../games";
import type { PlayerProfile } from "../player/types";
import { GAME_IDS } from "../player/types";
import { BalloonGame } from "./BalloonGame";
import { LogicGame } from "./LogicGame";
import { MathGame } from "./MathGame";
import { MemoryGame } from "./MemoryGame";
import { PatternGame } from "./PatternGame";

const STAGES = {
  memory: MemoryGame,
  math: MathGame,
  logic: LogicGame,
  balloon: BalloonGame,
  pattern: PatternGame,
};

interface AllGamesChallengeProps {
  profile: PlayerProfile;
  onExit: () => void;
  recordCombinedResult: (score: number) => void;
}

export function AllGamesChallenge({ profile, onExit, recordCombinedResult }: AllGamesChallengeProps) {
  const [stageIndex, setStageIndex] = useState(-1);
  const [scores, setScores] = useState<number[]>([]);

  const handleRoundComplete = (score: number) => {
    const nextScores = [...scores, score];
    setScores(nextScores);

    if (stageIndex < GAME_IDS.length - 1) {
      setStageIndex(stageIndex + 1);
    } else {
      const total = nextScores.reduce((sum, s) => sum + s, 0);
      recordCombinedResult(total);
      setStageIndex(GAME_IDS.length);
    }
  };

  if (stageIndex === -1) {
    return (
      <div className="app__shell">
        <div className="overlay">
          <div className="overlay__card">
            <h2>All Games Challenge</h2>
            <p className="overlay__lead">
              Play all four games back-to-back, one after another. Your scores from
              every game add up into one combined total — this is the ultimate test.
            </p>
            <button className="btn btn--primary" onClick={() => setStageIndex(0)}>
              Start Challenge
            </button>
            {profile.combinedBestScore > 0 && (
              <p className="overlay__best">Best combined score {profile.combinedBestScore.toLocaleString()}</p>
            )}
            <div className="overlay__actions" style={{ marginTop: 12 }}>
              <button className="btn btn--ghost" onClick={onExit}>
                Back to hub
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stageIndex === GAME_IDS.length) {
    const total = scores.reduce((sum, s) => sum + s, 0);
    const isNewBest = total >= profile.combinedBestScore;

    return (
      <div className="app__shell">
        <div className="overlay">
          <div className="overlay__card challenge__summary">
            <h2>Challenge Complete!</h2>
            <div className="overlay__score">{total.toLocaleString()}</div>
            {isNewBest && <p className="overlay__lead">New combined best!</p>}
            <ul className="overlay__rules">
              {GAME_IDS.map((id, i) => {
                const meta = GAMES.find((g) => g.id === id);
                return (
                  <li key={id}>
                    {meta?.name ?? id}: <b>{scores[i]?.toLocaleString() ?? 0}</b>
                  </li>
                );
              })}
            </ul>
            <button className="btn btn--primary" onClick={onExit}>
              Back to hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stageId = GAME_IDS[stageIndex];
  const Stage = STAGES[stageId];
  const meta = GAMES.find((g) => g.id === stageId);

  return (
    <div className="challenge">
      <p className="challenge__progress hud__sub">
        Game {stageIndex + 1} of {GAME_IDS.length} · {meta?.name ?? stageId}
      </p>
      <Stage key={stageIndex} mode="challenge" onExit={onExit} onRoundComplete={handleRoundComplete} />
    </div>
  );
}
