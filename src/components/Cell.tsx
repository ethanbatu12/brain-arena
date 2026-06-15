import { memo } from "react";
import type { CellVisual } from "../game/cellState";

interface CellProps {
  index: number;
  visual: CellVisual;
  clickable: boolean;
  onPick: (index: number) => void;
}

/**
 * A single tile. Uses onPointerDown (not click) so recall taps register on the
 * very first contact — important for fast play on touch and mouse alike.
 */
function CellBase({ index, visual, clickable, onPick }: CellProps) {
  const handle = () => {
    if (clickable) onPick(index);
  };
  return (
    <button
      type="button"
      className={`cell cell--${visual}`}
      data-visual={visual}
      disabled={!clickable}
      aria-label={`Cell ${index + 1}`}
      onPointerDown={clickable ? handle : undefined}
    />
  );
}

export const Cell = memo(CellBase);
