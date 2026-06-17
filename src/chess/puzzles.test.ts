import { describe, expect, it } from "vitest";
import { legalMoves, loadFen, makeMove, squareName } from "./engine";
import {
  PUZZLES,
  getPuzzleById,
  getPuzzleForRating,
  getPuzzlesByDifficulty,
  getPuzzlesByType,
  tierForRating,
} from "./puzzles";
import type { ChessPuzzle } from "./types";

/** Play one move on a state, asserting it is legal first. Returns the new state. */
function playLegal(puzzle: ChessPuzzle, state: ReturnType<typeof loadFen>, moveIdx: number) {
  const move = puzzle.solution[moveIdx];
  const legal = legalMoves(state, move.from);
  const match = legal.find(
    (m) => m.to === move.to && (!move.promotion || m.promotion === move.promotion),
  );
  expect(
    match,
    `puzzle ${puzzle.id}: move ${moveIdx} ${squareName(move.from)}→${squareName(move.to)} must be legal`,
  ).toBeTruthy();
  return makeMove(state, match!);
}

describe("puzzle bank integrity", () => {
  it("has unique ids and non-empty solutions", () => {
    const ids = new Set<number>();
    for (const p of PUZZLES) {
      expect(ids.has(p.id), `duplicate id ${p.id}`).toBe(false);
      ids.add(p.id);
      expect(p.solution.length, `puzzle ${p.id} has no solution`).toBeGreaterThan(0);
      expect(p.ratingMin).toBeLessThanOrEqual(p.ratingMax);
    }
  });

  it("plays every solution line legally through the engine", () => {
    const failures: string[] = [];
    for (const p of PUZZLES) {
      try {
        let state = loadFen(p.fen);
        const mover = state.board[p.solution[0].from];
        if (!mover) { failures.push(`#${p.id}: no piece on ${squareName(p.solution[0].from)}`); continue; }
        if (mover.color !== state.turn) { failures.push(`#${p.id}: first move not by side to move`); continue; }
        for (let i = 0; i < p.solution.length; i++) {
          const move = p.solution[i];
          const match = legalMoves(state, move.from).find(
            (m) => m.to === move.to && (!move.promotion || m.promotion === move.promotion),
          );
          if (!match) {
            failures.push(`#${p.id}: move ${i} ${squareName(move.from)}→${squareName(move.to)} illegal`);
            break;
          }
          state = makeMove(state, match);
        }
      } catch (e) {
        failures.push(`#${p.id}: threw ${(e as Error).message}`);
      }
    }
    expect(failures, `illegal solution lines:\n${failures.join("\n")}`).toEqual([]);
  });

  it("ends mate-typed multi-step puzzles in checkmate", () => {
    const multiMate = PUZZLES.filter((p) => p.puzzleType === "mate" && p.solution.length >= 3);
    expect(multiMate.length, "expected at least one verified multi-step mate").toBeGreaterThan(0);
    for (const p of multiMate) {
      let state = loadFen(p.fen);
      for (let i = 0; i < p.solution.length; i++) state = playLegal(p, state, i);
      expect(state.status, `puzzle ${p.id} should end in checkmate`).toBe("checkmate");
    }
  });
});

describe("answer handling (no leaks before solving)", () => {
  const SQUARE_RE = /\b[a-h][1-8]\b/i;
  const PIECE_RE = /\b(knight|bishop|rook|queen|king|pawn)\b/i;

  it("never names a square or piece in the pre-solve description", () => {
    for (const p of PUZZLES) {
      expect(SQUARE_RE.test(p.description), `puzzle ${p.id} description leaks a square: "${p.description}"`).toBe(false);
      expect(PIECE_RE.test(p.description), `puzzle ${p.id} description leaks a piece: "${p.description}"`).toBe(false);
    }
  });

  it("never names a square or piece in the theme tag", () => {
    for (const p of PUZZLES) {
      expect(SQUARE_RE.test(p.theme), `puzzle ${p.id} theme leaks a square: "${p.theme}"`).toBe(false);
    }
  });

  it("provides an explanation for every puzzle (revealed only after the puzzle ends)", () => {
    for (const p of PUZZLES) {
      expect(p.explanation.length, `puzzle ${p.id} missing explanation`).toBeGreaterThan(0);
    }
  });
});

describe("puzzle selection by rating", () => {
  it("maps ratings to the correct tier", () => {
    expect(tierForRating(0).difficulty).toBe("beginner");
    expect(tierForRating(400).difficulty).toBe("beginner");
    expect(tierForRating(401).difficulty).toBe("intermediate");
    expect(tierForRating(1000).difficulty).toBe("advanced");
    expect(tierForRating(1600).difficulty).toBe("expert");
    expect(tierForRating(2000).difficulty).toBe("master");
    expect(tierForRating(5000).difficulty).toBe("grandmaster");
  });

  it("returns a puzzle of the matching difficulty for a rating", () => {
    const p = getPuzzleForRating(1000);
    expect(p.difficulty).toBe("advanced");
  });

  it("avoids excluded ids when alternatives exist", () => {
    const beginner = getPuzzlesByDifficulty("beginner");
    const exclude = new Set(beginner.slice(0, -1).map((p) => p.id));
    const picked = getPuzzleForRating(0, exclude);
    expect(exclude.has(picked.id)).toBe(false);
  });

  it("filters by type and looks up by id", () => {
    const forks = getPuzzlesByType("fork");
    expect(forks.length).toBeGreaterThan(0);
    expect(forks.every((p) => p.puzzleType === "fork")).toBe(true);
    expect(getPuzzleById(411)?.theme).toBe("smothered-mate");
    expect(getPuzzleById(999999)).toBeUndefined();
  });
});
