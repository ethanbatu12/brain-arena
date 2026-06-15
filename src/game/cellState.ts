import type { GameState } from "./types";

export type CellVisual =
  | "lit" // shown during memorize (remember this one)
  | "idle" // clickable, unknown
  | "found" // correctly recalled
  | "missed" // was lit but the player never found it (feedback)
  | "wrong" // the bad click that ended the round (feedback)
  | "empty"; // nothing to show

/** Pure mapping from game state to how a single cell should render. */
export function cellVisual(index: number, state: GameState): CellVisual {
  const { phase, pattern, found, wrong } = state;
  switch (phase) {
    case "memorize":
      return pattern.has(index) ? "lit" : "empty";
    case "recall":
      return found.has(index) ? "found" : "idle";
    case "feedback":
      if (wrong === index) return "wrong";
      if (found.has(index)) return "found";
      if (pattern.has(index)) return "missed";
      return "empty";
    default:
      return "empty";
  }
}
