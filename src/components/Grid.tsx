import { cellVisual } from "../game/cellState";
import type { GameState } from "../game/types";
import { Cell } from "./Cell";

interface GridProps {
  state: GameState;
  onPick: (index: number) => void;
}

/**
 * The board. A square CSS grid of gridSize×gridSize tiles that scales to fit
 * the viewport. Only interactive during the recall phase.
 */
export function Grid({ state, onPick }: GridProps) {
  const { gridSize, phase } = state;
  const total = gridSize * gridSize;
  // Tappable during the reveal too, so players can start answering early.
  const clickable = phase === "recall" || phase === "memorize";

  return (
    <div
      className="grid"
      role="grid"
      aria-label={`${gridSize} by ${gridSize} memory board`}
      style={{ ["--size" as string]: gridSize }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Cell
          key={i}
          index={i}
          visual={cellVisual(i, state)}
          clickable={clickable}
          onPick={onPick}
        />
      ))}
    </div>
  );
}
