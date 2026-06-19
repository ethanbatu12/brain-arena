import { useState } from "react";
import { GAMES } from "../games";
import type { PlayerProfile } from "../player/types";
import { GAME_IDS } from "../player/types";
import { BalloonGame } from "./BalloonGame";
import { LogicGame } from "./LogicGame";
import { MathGame } from "./MathGame";
import { MemoryGame } from "./MemoryGame";
import { PatternGame } from "./PatternGame";

type StageId = (typeof GAME_IDS)[number];

const ALL_STAGES: StageId[] = [...GAME_IDS];
const TOTAL_STAGES = ALL_STAGES.length; // 5

const GAME_STAGES = {
  memory: MemoryGame,
  math: MathGame,
  logic: LogicGame,
  balloon: BalloonGame,
  pattern: PatternGame,
} as const;

function stageName(id: StageId): string {
  return GAMES.find((g) => g.id === id)?.name ?? id;
}

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

    if (stageIndex < TOTAL_STAGES - 1) {
      setStageIndex(stageIndex + 1);
    } else {
      const total = nextScores.reduce((sum, s) => sum + s, 0);
      recordCombinedResult(total);
      setStageIndex(TOTAL_STAGES);
    }
  };

  if (stageIndex === -1) {
    return (
      <div className="app__shell">
        <div className="overlay">
          <div className="overlay__card">
            <h2>All Games Challenge</h2>
            <p className="overlay__lead">
              Play all five 60-second games back-to-back. Your scores add up into
              one combined total — this is the ultimate test.
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

  if (stageIndex === TOTAL_STAGES) {
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
              {ALL_STAGES.map((id, i) => (
                <li key={id}>
                  {stageName(id)}: <b>{scores[i]?.toLocaleString() ?? 0}</b>
                </li>
              ))}
            </ul>
            <button className="btn btn--primary" onClick={onExit}>
              Back to hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stageId = ALL_STAGES[stageIndex];
  const Stage = GAME_STAGES[stageId];
  return (
    <div className="challenge">
      <p className="challenge__progress hud__sub">
        Game {stageIndex + 1} of {TOTAL_STAGES} · {stageName(stageId)}
      </p>
      <Stage key={stageIndex} mode="challenge" onExit={onExit} onRoundComplete={handleRoundComplete} />
    </div>
  );
}
