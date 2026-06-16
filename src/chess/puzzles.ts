/**
 * Puzzle bank for Chess Puzzle Rush.
 * Each puzzle has a FEN position and the single best move as the solution.
 * Puzzles are ordered by difficulty.
 */

import type { ChessPuzzle } from "./types";
import { parseSquare } from "./engine";

function sq(name: string) { return parseSquare(name); }

export const PUZZLES: ChessPuzzle[] = [
  // ── Beginner: Checkmate in 1 ─────────────────────────────────────────────
  {
    id: 1,
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: { from: sq("h5"), to: sq("f7") },
    difficulty: "beginner",
    theme: "checkmate",
    description: "Scholar's mate — deliver checkmate with the queen.",
  },
  {
    id: 2,
    fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    solution: { from: sq("a1"), to: sq("a8") },
    difficulty: "beginner",
    theme: "checkmate",
    description: "Back rank checkmate with the rook.",
  },
  {
    id: 3,
    fen: "6k1/8/6K1/8/8/8/8/7Q w - - 0 1",
    solution: { from: sq("h1"), to: sq("h7") },
    difficulty: "beginner",
    theme: "checkmate",
    description: "Queen checkmate — corner the king.",
  },
  {
    id: 4,
    fen: "5rk1/5ppp/8/8/8/8/8/R4RK1 w - - 0 1",
    solution: { from: sq("f1"), to: sq("f8") },
    difficulty: "beginner",
    theme: "checkmate",
    description: "Back rank mate with rooks.",
  },
  {
    id: 5,
    fen: "3k4/3Q4/3K4/8/8/8/8/8 w - - 0 1",
    solution: { from: sq("d7"), to: sq("c7") },
    difficulty: "beginner",
    theme: "checkmate",
    description: "Queen restricts the king — checkmate.",
  },

  // ── Beginner: Win a free piece ───────────────────────────────────────────
  {
    id: 6,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solution: { from: sq("f3"), to: sq("e5") },
    difficulty: "beginner",
    theme: "free-piece",
    description: "The pawn on e5 is undefended — take it.",
  },
  {
    id: 7,
    fen: "rnbqkbnr/ppp2ppp/8/3pp3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3",
    solution: { from: sq("d1"), to: sq("d5") },
    difficulty: "beginner",
    theme: "free-piece",
    description: "Capture the undefended pawn on d5 with the queen.",
  },

  // ── Easy: Forks ───────────────────────────────────────────────────────────
  {
    id: 8,
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: { from: sq("f3"), to: sq("g5") },
    difficulty: "easy",
    theme: "fork",
    description: "Knight fork — attack the queen and the f7 pawn simultaneously.",
  },
  {
    id: 9,
    fen: "r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P3/2NP4/PPP2PPP/R2QK2R w KQkq - 0 7",
    solution: { from: sq("c4"), to: sq("f7") },
    difficulty: "easy",
    theme: "fork",
    description: "Bishop fork — check the king and attack the queen.",
  },
  {
    id: 10,
    fen: "rnbqkbnr/ppp2ppp/8/3pp3/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 4",
    solution: { from: sq("d1"), to: sq("h5") },
    difficulty: "easy",
    theme: "fork",
    description: "Queen attacks f7 and e5 simultaneously.",
  },

  // ── Easy: Pins ────────────────────────────────────────────────────────────
  {
    id: 11,
    fen: "rnb1kbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 2 3",
    solution: { from: sq("d8"), to: sq("h4") },
    difficulty: "easy",
    theme: "pin",
    description: "Pin the knight on f2 against the king with the queen.",
  },
  {
    id: 12,
    fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: { from: sq("c4"), to: sq("f7") },
    difficulty: "easy",
    theme: "pin",
    description: "Discover the pin on the e-file while checking the king.",
  },

  // ── Medium: Skewers ───────────────────────────────────────────────────────
  {
    id: 13,
    fen: "4k3/8/8/8/8/8/8/R3K2r b - - 0 1",
    solution: { from: sq("h1"), to: sq("a1") },
    difficulty: "medium",
    theme: "skewer",
    description: "Skewer the rook behind the king — force the exchange.",
  },
  {
    id: 14,
    fen: "r5k1/5ppp/8/8/8/8/5PPP/3RK1R1 w - - 0 1",
    solution: { from: sq("d1"), to: sq("d8") },
    difficulty: "medium",
    theme: "skewer",
    description: "Rook skewer — check the king and win the rook.",
  },

  // ── Medium: Discovered attacks ────────────────────────────────────────────
  {
    id: 15,
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P4/PPP2PPP/RNBQK1NR w KQkq - 1 4",
    solution: { from: sq("c4"), to: sq("g8") },
    difficulty: "medium",
    theme: "discovered-attack",
    description: "Move the bishop to reveal a discovered check on the e-file.",
  },
  {
    id: 16,
    fen: "4k2r/pbpp1ppp/1p2pn2/8/1bBPP3/2N2N2/PPP2PPP/R1BQK2R w KQk - 2 8",
    solution: { from: sq("c3"), to: sq("e4") },
    difficulty: "medium",
    theme: "discovered-attack",
    description: "Knight move discovers a bishop attack on the queen.",
  },

  // ── Hard: Mating nets ─────────────────────────────────────────────────────
  {
    id: 17,
    fen: "6k1/5ppp/4p3/8/8/8/5PPP/5RK1 w - - 0 1",
    solution: { from: sq("f1"), to: sq("f8") },
    difficulty: "hard",
    theme: "mating-net",
    description: "Rook to f8 starts a mating net — black has no escape.",
  },
  {
    id: 18,
    fen: "5rk1/1p3ppp/p7/8/8/1P6/P4PPP/3R2K1 w - - 0 1",
    solution: { from: sq("d1"), to: sq("d8") },
    difficulty: "hard",
    theme: "mating-net",
    description: "Trade rooks and create a mating net.",
  },
  {
    id: 19,
    fen: "r4rk1/pp3ppp/2p5/8/2B5/8/PP3PPP/3R2K1 w - - 0 1",
    solution: { from: sq("d1"), to: sq("d8") },
    difficulty: "hard",
    theme: "mating-net",
    description: "Rook invades the back rank with decisive effect.",
  },

  // ── Hard: Defensive resources ─────────────────────────────────────────────
  {
    id: 20,
    fen: "4r1k1/pp3ppp/8/3q4/3P4/2PQ4/PP4PP/5RK1 b - - 0 1",
    solution: { from: sq("e8"), to: sq("e1") },
    difficulty: "hard",
    theme: "defensive",
    description: "Counter-attack — win the exchange before the opponent can mate.",
  },

  // ── Expert: Complex tactics ────────────────────────────────────────────────
  {
    id: 21,
    fen: "r2q1rk1/1pp2ppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP2PPP/R2Q1RK1 w - - 0 9",
    solution: { from: sq("f3"), to: sq("d5") },
    difficulty: "expert",
    theme: "fork",
    description: "Knight fork hitting the queen and bishop — material gain.",
  },
  {
    id: 22,
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 9",
    solution: { from: sq("d4"), to: sq("f5") },
    difficulty: "expert",
    theme: "sacrifice",
    description: "Knight sacrifice opens lines toward the king.",
  },
  {
    id: 23,
    fen: "2r3k1/1p3ppp/p7/3p4/3P4/P4N2/1P3PPP/2R3K1 w - - 0 1",
    solution: { from: sq("c1"), to: sq("c8") },
    difficulty: "expert",
    theme: "mating-net",
    description: "Rook trades lead to a decisive endgame advantage.",
  },
  {
    id: 24,
    fen: "r4rk1/ppp2ppp/2nq1n2/3pp1B1/1b1PP1b1/2NQ1N2/PPP2PPP/R3R1K1 w - - 0 9",
    solution: { from: sq("g5"), to: sq("f6") },
    difficulty: "expert",
    theme: "sacrifice",
    description: "Bishop sacrifice breaks open the king's defenses.",
  },
  {
    id: 25,
    fen: "3r2k1/pp3ppp/2b5/8/2B5/1P6/P4PPP/3R2K1 b - - 0 1",
    solution: { from: sq("d8"), to: sq("d1") },
    difficulty: "expert",
    theme: "discovered-attack",
    description: "Trade rooks then use the bishop pair for the win.",
  },
];

export function getPuzzlesByDifficulty(difficulty: ChessPuzzle["difficulty"]): ChessPuzzle[] {
  return PUZZLES.filter((p) => p.difficulty === difficulty);
}

export function getPuzzleSequence(): ChessPuzzle[] {
  const order: ChessPuzzle["difficulty"][] = [
    "beginner", "beginner", "easy", "beginner", "easy",
    "medium", "easy", "medium", "hard", "medium",
    "hard", "expert", "hard", "expert", "expert",
  ];
  const byDiff: Record<string, ChessPuzzle[]> = {};
  for (const p of PUZZLES) {
    if (!byDiff[p.difficulty]) byDiff[p.difficulty] = [];
    byDiff[p.difficulty].push(p);
  }
  const counters: Record<string, number> = {};
  return order.map((d) => {
    counters[d] = (counters[d] ?? 0);
    const pool = byDiff[d] ?? [];
    const puzzle = pool[counters[d] % pool.length];
    counters[d]++;
    return puzzle;
  }).filter(Boolean);
}
