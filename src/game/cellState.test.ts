import { describe, expect, it } from "vitest";
import { cellVisual } from "./cellState";
import { initialState } from "./reducer";
import type { GameState } from "./types";

const base = (over: Partial<GameState>): GameState => ({ ...initialState(), ...over });

describe("cellVisual", () => {
  it("shows lit pattern cells while memorizing, empty otherwise", () => {
    const s = base({ phase: "memorize", pattern: new Set([1, 4]) });
    expect(cellVisual(1, s)).toBe("lit");
    expect(cellVisual(0, s)).toBe("empty");
  });

  it("shows found cells and idle cells during recall", () => {
    const s = base({ phase: "recall", pattern: new Set([1, 4]), found: new Set([1]) });
    expect(cellVisual(1, s)).toBe("found");
    expect(cellVisual(4, s)).toBe("idle"); // not yet found -> hidden as idle
    expect(cellVisual(2, s)).toBe("idle");
  });

  it("reveals the full answer during feedback", () => {
    const s = base({
      phase: "feedback",
      pattern: new Set([1, 4]),
      found: new Set([1]),
      wrong: 7,
    });
    expect(cellVisual(7, s)).toBe("wrong");
    expect(cellVisual(1, s)).toBe("found");
    expect(cellVisual(4, s)).toBe("missed");
    expect(cellVisual(0, s)).toBe("empty");
  });

  it("renders everything empty while idle or over", () => {
    const idle = base({ phase: "idle", pattern: new Set([1]) });
    const over = base({ phase: "over", pattern: new Set([1]) });
    expect(cellVisual(1, idle)).toBe("empty");
    expect(cellVisual(1, over)).toBe("empty");
  });
});
