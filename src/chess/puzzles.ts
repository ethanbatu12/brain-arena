import type { ChessPuzzle, PuzzleType } from "./types";
import { parseSquare } from "./engine";

function sq(name: string) { return parseSquare(name); }

// ── Rating bands ─────────────────────────────────────────────────────────────
export const RATING_TIERS = [
  { difficulty: "beginner"    as const, min: 0,    max: 400  },
  { difficulty: "intermediate"as const, min: 401,  max: 800  },
  { difficulty: "advanced"    as const, min: 801,  max: 1200 },
  { difficulty: "expert"      as const, min: 1201, max: 1600 },
  { difficulty: "master"      as const, min: 1601, max: 2000 },
  { difficulty: "grandmaster" as const, min: 2001, max: 9999 },
] as const;

export function tierForRating(rating: number): typeof RATING_TIERS[number] {
  return RATING_TIERS.find((t) => rating <= t.max) ?? RATING_TIERS[RATING_TIERS.length - 1];
}

// ── Puzzle bank ───────────────────────────────────────────────────────────────
// IMPORTANT (answer handling): `description` is shown BEFORE solving and must NEVER
// name a piece, square, or direction. `explanation` is shown only AFTER the puzzle
// ends and may freely reference the moves. `solution` is the forced best line:
// player moves at even indices, forced opponent replies at odd indices.
export const PUZZLES: ChessPuzzle[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // BEGINNER  (0–400)  — Mate in 1, free pieces, obvious captures
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 101, ratingMin: 0, ratingMax: 400,
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: [{ from: sq("h5"), to: sq("f7") }],
    difficulty: "beginner", puzzleType: "mate", theme: "checkmate",
    description: "There is a forced checkmate — find it.",
    explanation: "Qxf7# is Scholar's Mate: the queen is protected by the bishop on c4 and the king has no escape.",
  },
  {
    id: 102, ratingMin: 0, ratingMax: 400,
    fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    solution: [{ from: sq("a1"), to: sq("a8") }],
    difficulty: "beginner", puzzleType: "mate", theme: "back-rank",
    description: "There is a forced checkmate — find it.",
    explanation: "Ra8# is a back-rank mate; the king is trapped behind its own f7/g7/h7 pawns.",
  },
  {
    id: 103, ratingMin: 0, ratingMax: 400,
    fen: "6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d8") }],
    difficulty: "beginner", puzzleType: "mate", theme: "back-rank",
    description: "Deliver a forced checkmate.",
    explanation: "Rd8# is a back-rank mate; the king is trapped behind its own f7/g7/h7 pawns.",
  },
  {
    id: 104, ratingMin: 0, ratingMax: 400,
    fen: "6k1/R7/8/8/8/8/8/1R4K1 w - - 0 1",
    solution: [{ from: sq("b1"), to: sq("b8") }],
    difficulty: "beginner", puzzleType: "mate", theme: "ladder-mate",
    description: "Mate is available — find it.",
    explanation: "Rb8# is a two-rook ladder mate: one rook seals the 7th rank, the other mates on the 8th.",
  },
  {
    // Qg6# — White King f5, White Queen g4, Black King h6.
    id: 105, ratingMin: 0, ratingMax: 400,
    fen: "8/8/7k/5K2/6Q1/8/8/8 w - - 0 1",
    solution: [{ from: sq("g4"), to: sq("g6") }],
    difficulty: "beginner", puzzleType: "mate", theme: "queen-mate",
    description: "Deliver a forced checkmate.",
    explanation: "Qg6# — the queen covers every escape square while the king guards the rest.",
  },
  {
    // Rd8# — King f8 blocked by own knight on e7 and pawns f7/g7/h7.
    id: 106, ratingMin: 0, ratingMax: 400,
    fen: "5k2/4nppp/8/8/8/8/8/3R2K1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d8") }],
    difficulty: "beginner", puzzleType: "mate", theme: "back-rank",
    description: "There is a forced checkmate — find it.",
    explanation: "Rd8# — the king is smothered by its own pieces on the back rank.",
  },
  {
    id: 107, ratingMin: 0, ratingMax: 400,
    fen: "rnb1kbnr/pppp1ppp/8/4p3/6q1/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 1",
    solution: [{ from: sq("f3"), to: sq("g4") }],
    difficulty: "beginner", puzzleType: "material", theme: "winning-queen",
    description: "Win material.",
    explanation: "fxg4 wins the black queen for free — it strayed into the pawn's reach undefended.",
  },
  {
    id: 108, ratingMin: 0, ratingMax: 400,
    // Rc8# — White King b6, White Rook c6, Black King a8.
    fen: "k7/8/1KR5/8/8/8/8/8 w - - 0 1",
    solution: [{ from: sq("c6"), to: sq("c8") }],
    difficulty: "beginner", puzzleType: "mate", theme: "rook-mate",
    description: "Deliver a forced checkmate.",
    explanation: "Rc8# — the rook mates on the back rank while the king covers a7 and b7.",
  },
  {
    id: 109, ratingMin: 0, ratingMax: 400,
    fen: "8/8/8/8/8/6k1/6p1/K7 b - - 0 1",
    solution: [{ from: sq("g2"), to: sq("g1"), promotion: "Q" }],
    difficulty: "beginner", puzzleType: "promotion", theme: "promotion",
    description: "Find the winning move.",
    explanation: "g1=Q promotes and wins immediately — a new queen decides the game.",
  },
  {
    id: 110, ratingMin: 0, ratingMax: 400,
    fen: "2k5/8/2K5/R7/8/8/8/8 w - - 0 1",
    solution: [{ from: sq("a5"), to: sq("a8") }],
    difficulty: "beginner", puzzleType: "mate", theme: "rook-mate",
    description: "Deliver a forced checkmate.",
    explanation: "Ra8# — with the kings in opposition, the rook mates along the back rank.",
  },
  {
    id: 111, ratingMin: 0, ratingMax: 400,
    fen: "8/P5k1/8/8/8/8/8/6K1 w - - 0 1",
    solution: [{ from: sq("a7"), to: sq("a8"), promotion: "Q" }],
    difficulty: "beginner", puzzleType: "promotion", theme: "promotion",
    description: "Find the winning move.",
    explanation: "a8=Q queens the pawn; the black king is too far away to stop it.",
  },
  {
    // Fixed: Qg7# (not Qf8 which allows escape to h7).
    id: 112, ratingMin: 0, ratingMax: 400,
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    solution: [{ from: sq("f7"), to: sq("g7") }],
    difficulty: "beginner", puzzleType: "mate", theme: "queen-mate",
    description: "Deliver a forced checkmate.",
    explanation: "Qg7# — the queen on g7 covers all escape squares with the king's help on g6.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INTERMEDIATE  (401–800)  — Basic forks, pins, skewers, 2-move combos
  // ══════════════════════════════════════════════════════════════════════════
  {
    // Nf6+ royal fork — knight attacks king and queen simultaneously.
    id: 201, ratingMin: 401, ratingMax: 800,
    fen: "4k3/3q4/8/8/6N1/8/8/4K3 w - - 0 1",
    solution: [{ from: sq("g4"), to: sq("f6") }],
    difficulty: "intermediate", puzzleType: "fork", theme: "royal-fork",
    description: "One move wins material.",
    explanation: "Nf6+ is a royal fork: it checks the king and attacks the queen, winning it next move.",
  },
  {
    // Rxe6+ — rook captures pinned queen giving check (queen defended by rook on e7 but can't recapture due to check).
    id: 202, ratingMin: 401, ratingMax: 800,
    fen: "4k3/4r3/4q3/8/8/4R3/8/4K3 w - - 0 1",
    solution: [{ from: sq("e3"), to: sq("e6") }],
    difficulty: "intermediate", puzzleType: "tactic", theme: "pin",
    description: "Find the strongest move.",
    explanation: "Rxe6+ captures the queen with check; the rook on e7 cannot recapture because the king is in check.",
  },
  {
    id: 203, ratingMin: 401, ratingMax: 800,
    fen: "4k3/8/8/8/8/8/4q3/4R1K1 w - - 0 1",
    solution: [{ from: sq("e1"), to: sq("e2") }],
    difficulty: "intermediate", puzzleType: "pin", theme: "pin",
    description: "Find the strongest move.",
    explanation: "Rxe2+ wins the queen, which is pinned to its king on the e-file.",
  },
  {
    // Rxe7 — skewer: rook takes queen, king must recapture, net +4 points.
    id: 205, ratingMin: 401, ratingMax: 800,
    fen: "5k2/4q3/8/8/8/4R3/8/4K3 w - - 0 1",
    solution: [{ from: sq("e3"), to: sq("e7") }],
    difficulty: "intermediate", puzzleType: "skewer", theme: "skewer",
    description: "Find the move that wins material.",
    explanation: "Rxe7+ — the rook takes the queen with check. After the king recaptures, White is up decisive material.",
  },
  {
    // Nc2 fork — Black knight forks White King on e1 and Rook on a1.
    id: 206, ratingMin: 401, ratingMax: 800,
    fen: "r2qk3/5ppp/8/8/3n4/8/5PPP/R3K3 b - - 0 1",
    solution: [{ from: sq("d4"), to: sq("c2") }],
    difficulty: "intermediate", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Nc2+ forks the white king and rook, winning the rook on the next move.",
  },
  {
    id: 207, ratingMin: 401, ratingMax: 800,
    fen: "3k4/3r4/8/3R4/8/3K4/8/8 w - - 0 1",
    solution: [{ from: sq("d5"), to: sq("d7") }],
    difficulty: "intermediate", puzzleType: "skewer", theme: "skewer",
    description: "Find the move that wins material.",
    explanation: "Rxd7+ wins the rook; the pieces are lined up on the d-file with the king behind.",
  },
  {
    id: 208, ratingMin: 401, ratingMax: 800,
    fen: "r1b1kb1r/pppp1ppp/2n2q2/4p3/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 5",
    solution: [{ from: sq("d4"), to: sq("e5") }],
    difficulty: "intermediate", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "dxe5 attacks the queen and the knight at once, netting a piece.",
  },
  {
    // Rxe4 — Black rook captures undefended white queen.
    id: 210, ratingMin: 401, ratingMax: 800,
    fen: "4k3/8/4r3/8/4Q3/8/8/6K1 b - - 0 1",
    solution: [{ from: sq("e6"), to: sq("e4") }],
    difficulty: "intermediate", puzzleType: "material", theme: "winning-queen",
    description: "Win material.",
    explanation: "Rxe4 captures the undefended queen — with White's king too far away to recapture, Black wins a queen for free.",
  },
  {
    id: 211, ratingMin: 401, ratingMax: 800,
    fen: "4k3/8/8/3q4/4N3/8/8/4K3 w - - 0 1",
    solution: [{ from: sq("e4"), to: sq("f6") }],
    difficulty: "intermediate", puzzleType: "fork", theme: "royal-fork",
    description: "One move wins material.",
    explanation: "Nf6+ is a royal fork: it checks the king and attacks the queen, winning it next move.",
  },
  {
    id: 212, ratingMin: 401, ratingMax: 800,
    fen: "8/3P1k2/3K4/8/8/8/8/8 w - - 0 1",
    solution: [{ from: sq("d7"), to: sq("d8"), promotion: "Q" }],
    difficulty: "intermediate", puzzleType: "endgame", theme: "conversion",
    description: "Find the best move to convert.",
    explanation: "d8=Q safely queens with the king's support, converting to an easy win.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADVANCED  (801–1200)  — Multi-step tactics, back-rank invasions
  // ══════════════════════════════════════════════════════════════════════════
  {
    // Rxd8+ — open d-file, back-rank invasion wins the rook.
    id: 303, ratingMin: 801, ratingMax: 1200,
    fen: "3r2k1/pp3ppp/2p5/8/8/2P5/PP3PPP/3R2K1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d8") }],
    difficulty: "advanced", puzzleType: "tactic", theme: "back-rank",
    description: "Find the strongest move.",
    explanation: "Rxd8+ invades the back rank; after Rxd8 the rooks are traded and White's superior endgame is decisive.",
  },
  {
    // Smothered mate: Qg8+! Rxg8 Nf7#
    id: 306, ratingMin: 801, ratingMax: 1200,
    fen: "5r1k/6pp/7N/3Q4/8/8/6PP/6K1 w - - 0 1",
    solution: [
      { from: sq("d5"), to: sq("g8") },
      { from: sq("f8"), to: sq("g8") },
      { from: sq("h6"), to: sq("f7") },
    ],
    difficulty: "advanced", puzzleType: "mate", theme: "smothered-mate",
    description: "Find the forced mate.",
    explanation: "Qg8+!! forces Rxg8, then Nf7# is a smothered mate — the king is boxed in by its own rook and pawns.",
  },
  {
    id: 307, ratingMin: 801, ratingMax: 1200,
    fen: "r4rk1/pp3ppp/2p5/8/2B5/8/PP3PPP/3R2K1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d7") }],
    difficulty: "advanced", puzzleType: "tactic", theme: "seventh-rank",
    description: "Find the strongest move.",
    explanation: "Rd7 invades the seventh rank, attacking multiple pawns with decisive effect.",
  },
  {
    id: 308, ratingMin: 801, ratingMax: 1200,
    fen: "2r3k1/1p3ppp/p7/3p4/3P4/P4N2/1P3PPP/2R3K1 w - - 0 1",
    solution: [{ from: sq("c1"), to: sq("c8") }],
    difficulty: "advanced", puzzleType: "endgame", theme: "conversion",
    description: "Find the best move to convert.",
    explanation: "Rxc8+ trades into a winning endgame advantage.",
  },
  {
    id: 309, ratingMin: 801, ratingMax: 1200,
    fen: "3r2k1/pp4pp/2p2p2/4p3/4P3/2P2P2/PP4PP/3R2K1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d8") }],
    difficulty: "advanced", puzzleType: "endgame", theme: "conversion",
    description: "Find the best move to convert.",
    explanation: "Rxd8+ uses the open file to force a decisive material gain.",
  },
  {
    // Clearance + back-rank: Rxd8+ wins the rook.
    id: 310, ratingMin: 801, ratingMax: 1200,
    fen: "r4rk1/pp3ppp/8/8/8/8/PP3PPP/3R1RK1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d8") }],
    difficulty: "advanced", puzzleType: "tactic", theme: "back-rank",
    description: "Find the strongest move.",
    explanation: "Rd8 invades the back rank, winning the rook and gaining a decisive advantage.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EXPERT  (1201–1600)  — Deep calculation, hidden tactics, sacrifices
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 402, ratingMin: 1201, ratingMax: 1600,
    fen: "3r2k1/pp3ppp/2b5/8/2B5/1P6/P4PPP/3R2K1 b - - 0 1",
    solution: [{ from: sq("d8"), to: sq("d1") }],
    difficulty: "expert", puzzleType: "endgame", theme: "conversion",
    description: "Find the best move to convert.",
    explanation: "Rxd1+ trades into a bishop endgame Black wins.",
  },
  {
    // Smothered mate: Qg8+! Rxg8 Nf7# (same pattern, different puzzle id for rated mode)
    id: 411, ratingMin: 1201, ratingMax: 1600,
    fen: "5r1k/6pp/7N/3Q4/8/8/6PP/6K1 w - - 0 1",
    solution: [
      { from: sq("d5"), to: sq("g8") },
      { from: sq("f8"), to: sq("g8") },
      { from: sq("h6"), to: sq("f7") },
    ],
    difficulty: "expert", puzzleType: "mate", theme: "smothered-mate",
    description: "There is a forced mate — find the whole sequence.",
    explanation: "Qg8+!! forces Rxg8, then Nf7# is a smothered mate: the king is boxed in by its own rook and pawns.",
  },

  {
    id: 420, ratingMin: 1201, ratingMax: 1600,
    fen: "r3k2r/1p2bppp/n1p2n2/p3p1B1/N7/PP5b/3qPP1P/2R1Q1KR b kq - 1 15",
    solution: [{ from: sq("d2"), to: sq("g5") }],
    difficulty: "expert", puzzleType: "mate", theme: "mating-net",
    description: "There is a forced checkmate — find it.",
    explanation: "This delivers forced checkmate within 1 move — there is no defense.",
  },
  {
    id: 421, ratingMin: 1201, ratingMax: 1600,
    fen: "r3kbnr/p3p3/1p1p2p1/5p1p/qpP2P2/5NPP/3PP1BR/RNB1K3 w k - 0 17",
    solution: [{ from: sq("a1"), to: sq("a4") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The rook captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 422, ratingMin: 1201, ratingMax: 1600,
    fen: "4kbnr/p2qppp1/P2p4/2p5/7r/1P4R1/P2PP1K1/RNB1QBN1 b k - 1 17",
    solution: [{ from: sq("h4"), to: sq("h2") }],
    difficulty: "expert", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "This rook move creates a decisive threat the opponent has no good answer to.",
  },
  {
    id: 423, ratingMin: 1201, ratingMax: 1600,
    fen: "r1bq1bnr/p1p1ppp1/n2k3p/1p1P4/1Pp2P2/1Q6/PB1KP1PP/RN3BNR b - f3 0 8",
    solution: [{ from: sq("c4"), to: sq("b3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 424, ratingMin: 1201, ratingMax: 1600,
    fen: "rnb1kb1r/pp1pn1p1/7p/4pp2/P2QPPP1/7N/1q5P/RNB1KB1R w KQkq - 0 12",
    solution: [{ from: sq("d4"), to: sq("b2") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 425, ratingMin: 1201, ratingMax: 1600,
    fen: "r1bq1knr/pppp2pp/2n1p1p1/8/4P3/bP6/1BPP1P1P/RN1QKBNR b KQ e3 0 7",
    solution: [{ from: sq("a3"), to: sq("b2") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The bishop captures the undefended bishop, winning material outright with no way to recapture favorably.",
  },
  {
    id: 426, ratingMin: 1201, ratingMax: 1600,
    fen: "r1b1k1nr/p1qpp2p/np4pb/2p2p2/3B1PP1/1P6/P1PPP2P/RN1QKBNR w KQkq - 2 8",
    solution: [{ from: sq("d4"), to: sq("h8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The bishop captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 427, ratingMin: 1201, ratingMax: 1600,
    fen: "r1bqkb2/Qp1pp2r/n4p1n/8/P4P1p/2N5/1PP1P1PP/R1B1KB1R b KQq - 0 10",
    solution: [{ from: sq("a8"), to: sq("a7") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The rook captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 428, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbq4/p2kp1b1/3r3n/1pP2p2/8/2P1P3/PP3P1P/RNBQK1NR w KQ - 1 12",
    solution: [{ from: sq("c5"), to: sq("d6") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 429, ratingMin: 1201, ratingMax: 1600,
    fen: "r1b1k1nr/pp1ppp2/1q4pb/2p4p/P2B3P/nP2P1PN/3PKP1R/R2Q1B2 b kq - 3 13",
    solution: [{ from: sq("c5"), to: sq("d4") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended bishop, winning material outright with no way to recapture favorably.",
  },
  {
    id: 430, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbqkbn1/p2pp1pr/8/1pp2Q1p/7P/2P1P3/PP1P1PP1/RNB1KBNR w KQq - 1 7",
    solution: [{ from: sq("f5"), to: sq("g6") }],
    difficulty: "expert", puzzleType: "mate", theme: "mating-net",
    description: "There is a forced checkmate — find it.",
    explanation: "This delivers forced checkmate within 1 move — there is no defense.",
  },
  {
    id: 431, ratingMin: 1201, ratingMax: 1600,
    fen: "rn1qkbnr/2ppp1pp/5p2/p7/2bPP3/7N/P1P1QPPP/RNB1K2R b KQkq - 1 7",
    solution: [{ from: sq("c4"), to: sq("e2") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The bishop captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 432, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbk2nr/3pp1bp/p4p2/1pq5/3P4/2P5/3BP1PP/1N1QKBNR w K - 0 13",
    solution: [{ from: sq("d4"), to: sq("c5") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 433, ratingMin: 1201, ratingMax: 1600,
    fen: "r1b4r/pp2kpbp/n1p5/4p3/P1PQ2p1/8/1P2P2P/2KR1BNR w - - 2 15",
    solution: [{ from: sq("d4"), to: sq("d6") }],
    difficulty: "expert", puzzleType: "tactic", theme: "double-attack",
    description: "Find the strongest move — it wins material outright.",
    explanation: "This queen move creates a decisive threat the opponent has no good answer to.",
  },
  {
    id: 434, ratingMin: 1201, ratingMax: 1600,
    fen: "2bq3r/1ppp1k2/1Qn1pp2/6p1/2P1P2p/1P5P/4NPP1/1R2KB1R b K - 0 17",
    solution: [{ from: sq("c7"), to: sq("b6") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 435, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbqkbnr/1pp2pp1/3p4/p3N2p/2P4P/N7/PPQPPPP1/1RB1KB1R b Kkq - 0 7",
    solution: [{ from: sq("d6"), to: sq("e5") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended knight, winning material outright with no way to recapture favorably.",
  },
  {
    id: 436, ratingMin: 1201, ratingMax: 1600,
    fen: "rnb3nr/pp1p1kpp/8/2p1p3/8/5Q2/2PKPqPP/1NB2B1R b - - 3 12",
    solution: [{ from: sq("f2"), to: sq("f3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 437, ratingMin: 1201, ratingMax: 1600,
    fen: "3qkb1r/3Rp2p/bp3pp1/2pn2Bn/1PPP4/2N1P3/5PPP/3K1BNR w k - 1 16",
    solution: [{ from: sq("d7"), to: sq("d8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The rook captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 438, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbq1b1r/1p1pn2p/2N1p1p1/3k4/1P6/8/P1PPPPPP/R1BQKBNR w KQ - 1 10",
    solution: [{ from: sq("c6"), to: sq("d8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The knight captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 439, ratingMin: 1201, ratingMax: 1600,
    fen: "r1b1kb2/p1p1np2/6pr/8/1PQ4p/2P4P/P3P1q1/2RK1BNR w q - 0 16",
    solution: [{ from: sq("f1"), to: sq("g2") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The bishop captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 440, ratingMin: 1201, ratingMax: 1600,
    fen: "rn1qkbnr/1p1bpp1p/p2p2p1/8/1pP4P/1Q6/PB1PPPP1/RN2KBNR w KQkq - 0 7",
    solution: [{ from: sq("b2"), to: sq("h8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The bishop captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 441, ratingMin: 1201, ratingMax: 1600,
    fen: "1rbk1bnr/1p1pp2p/p4pp1/2n5/1P1p4/P1P2P1P/4P1P1/RNBK1BNR w - - 0 13",
    solution: [{ from: sq("b4"), to: sq("c5") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended knight, winning material outright with no way to recapture favorably.",
  },
  {
    id: 442, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2kbn1/3ppppr/bp6/p6p/P1p1PP2/RPq4N/2PP2PP/2BQKB1R w Kq - 2 11",
    solution: [{ from: sq("d2"), to: sq("c3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 443, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbk3r/pppp1ppp/3bpn2/8/2Pq4/PP3P1P/RB1PP1P1/1N1QKBNR b K - 4 8",
    solution: [{ from: sq("d6"), to: sq("g3") }],
    difficulty: "expert", puzzleType: "mate", theme: "mating-net",
    description: "There is a forced checkmate — find it.",
    explanation: "This delivers forced checkmate within 1 move — there is no defense.",
  },
  {
    id: 444, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbqr3/pp1pkppp/7n/2p5/4P1Q1/6P1/PPPNKP1b/R1B2B1R b - - 0 10",
    solution: [{ from: sq("h6"), to: sq("g4") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The knight captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 445, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2kb1r/pp3p1p/3p4/2p2b2/4pP1R/NPP1q3/P2PP3/R1BQKB2 w kq - 0 13",
    solution: [{ from: sq("d2"), to: sq("e3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 446, ratingMin: 1201, ratingMax: 1600,
    fen: "r1b5/p2kp3/2p3q1/1pP5/3p4/2P2P2/P2BP1P1/RN1QKBR1 b Q - 0 16",
    solution: [{ from: sq("g6"), to: sq("g3") }],
    difficulty: "expert", puzzleType: "mate", theme: "mating-net",
    description: "There is a forced checkmate — find it.",
    explanation: "This delivers forced checkmate within 1 move — there is no defense.",
  },
  {
    id: 447, ratingMin: 1201, ratingMax: 1600,
    fen: "bn2kb2/2p2pR1/1P1p1n2/2P1p3/8/1Q2P2r/1P1P4/1NBK1BN1 w - - 3 17",
    solution: [{ from: sq("b3"), to: sq("f7") }],
    difficulty: "expert", puzzleType: "tactic", theme: "double-attack",
    description: "Find the strongest move — it wins material outright.",
    explanation: "The queen captures the undefended pawn, winning material outright with no way to recapture favorably.",
  },
  {
    id: 448, ratingMin: 1201, ratingMax: 1600,
    fen: "r3k2r/3p1p1p/3q1npb/1Pnp4/1K5P/6PB/PP2P3/RN4Nb b kq - 3 17",
    solution: [{ from: sq("a8"), to: sq("a4") }],
    difficulty: "expert", puzzleType: "tactic", theme: "double-attack",
    description: "Find the strongest move — it wins material outright.",
    explanation: "This rook move creates a decisive threat the opponent has no good answer to.",
  },
  {
    id: 449, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2k2r/pp2p1Qp/7n/2PP1p2/8/2P3P1/P2K4/RbB5 w kq f6 0 16",
    solution: [{ from: sq("g7"), to: sq("h8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 450, ratingMin: 1201, ratingMax: 1600,
    fen: "r2qkb2/pb1ppppr/p1p5/7p/4n3/2N4N/PPPPKPPP/1RB1Q1R1 w q - 0 9",
    solution: [{ from: sq("c3"), to: sq("e4") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The knight captures the undefended knight, winning material outright with no way to recapture favorably.",
  },
  {
    id: 451, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2kbnr/p3pppp/4b3/1p1p2B1/1p1P2PP/2N2q2/P1P1PN2/R2QKBR1 b Qkq g3 0 11",
    solution: [{ from: sq("f3"), to: sq("c3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended knight, winning material outright with no way to recapture favorably.",
  },
  {
    id: 452, ratingMin: 1201, ratingMax: 1600,
    fen: "2b1k2r/R1pp1ppR/1r3n2/1p6/1P6/1Q1p4/4PPP1/1NB1KBN1 w k - 1 12",
    solution: [{ from: sq("h7"), to: sq("h8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The rook captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 453, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2k1n1/p2p1p1p/1pp1p3/6p1/1Pb5/2B1P2B/PRPP4/3QK1Nq b q - 1 15",
    solution: [{ from: sq("h1"), to: sq("g1") }],
    difficulty: "expert", puzzleType: "tactic", theme: "double-attack",
    description: "Find the strongest move — it wins material outright.",
    explanation: "The queen captures the undefended knight, winning material outright with no way to recapture favorably.",
  },
  {
    id: 454, ratingMin: 1201, ratingMax: 1600,
    fen: "rnb1kb2/1p1pppp1/5n1r/p7/8/3P1P2/PPq1P1PP/R2QKBNR w KQq - 0 7",
    solution: [{ from: sq("d1"), to: sq("c2") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 455, ratingMin: 1201, ratingMax: 1600,
    fen: "rnb1kbnr/pp1pp1p1/2Q5/2p2p1p/2P4P/q3P2N/P2P1PP1/R1B1KB1R w KQkq - 0 8",
    solution: [{ from: sq("c6"), to: sq("c8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended bishop, winning material outright with no way to recapture favorably.",
  },
  {
    id: 456, ratingMin: 1201, ratingMax: 1600,
    fen: "r1b1k1nr/1ppn1ppp/4p3/8/1P5P/4P2R/P2PBPq1/R1BQK1N1 b Qkq - 1 10",
    solution: [{ from: sq("g2"), to: sq("g1") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended knight, winning material outright with no way to recapture favorably.",
  },
  {
    id: 457, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2kbnr/p2p4/4N1p1/1qp2p1p/7P/4PP2/PP1PQ1P1/RNB1K2R b KQkq - 0 11",
    solution: [{ from: sq("b5"), to: sq("e2") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 458, ratingMin: 1201, ratingMax: 1600,
    fen: "1n4nr/1p6/r1kb4/2p1q3/p3pNp1/P1PP4/1P4P1/RNBQKB2 b Q - 0 17",
    solution: [{ from: sq("e4"), to: sq("d3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended pawn, winning material outright with no way to recapture favorably.",
  },
  {
    id: 459, ratingMin: 1201, ratingMax: 1600,
    fen: "r1b2bn1/p3pk1r/p2P4/6pp/4P3/P4N2/R1qP1PPP/1NB1K2R w K - 0 11",
    solution: [{ from: sq("a2"), to: sq("c2") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The rook captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 460, ratingMin: 1201, ratingMax: 1600,
    fen: "r1bqkb2/p1pp1R2/4p3/np6/P3P2Q/8/1PPB1P2/RN2K3 b Qq - 1 12",
    solution: [{ from: sq("d8"), to: sq("h4") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 461, ratingMin: 1201, ratingMax: 1600,
    fen: "rQb2bnr/p2kp1pp/n1pp3B/q7/P2Pp3/1PN2N2/2P2PPP/1R2KB1R w K - 2 13",
    solution: [{ from: sq("b8"), to: sq("a8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 462, ratingMin: 1201, ratingMax: 1600,
    fen: "4kbr1/r3ppp1/B1np3B/5Pn1/8/NqP5/P4PPP/R3K1NR w KQ - 2 15",
    solution: [{ from: sq("a2"), to: sq("b3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 463, ratingMin: 1201, ratingMax: 1600,
    fen: "r1bqkb1r/pppp2pp/2n5/5n2/2BBP3/P7/1PP2PPP/RN1QK1NR b KQkq - 2 8",
    solution: [{ from: sq("f5"), to: sq("d4") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The knight captures the undefended bishop, winning material outright with no way to recapture favorably.",
  },
  {
    id: 464, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbqkbnr/1pp1p3/6p1/p2p3p/2P1P1QP/3B4/PP1P1P2/RNB1K1NR w KQkq d6 0 7",
    solution: [{ from: sq("g4"), to: sq("g6") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended pawn, winning material outright with no way to recapture favorably.",
  },
  {
    id: 465, ratingMin: 1201, ratingMax: 1600,
    fen: "rn1qkbnr/pp2pp2/2p4p/3P2p1/2P2Nb1/3B2PP/PP1P1P2/RNBQK2R b KQkq c3 0 10",
    solution: [{ from: sq("g4"), to: sq("d1") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The bishop captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 466, ratingMin: 1201, ratingMax: 1600,
    fen: "rn1qkb1r/1bBpp1p1/5p2/1p5p/1P1P4/8/P1P1PPPR/R2QKBN1 w Qkq - 2 10",
    solution: [{ from: sq("c7"), to: sq("d8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The bishop captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 467, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2k1nr/pbpp1ppp/3bp3/1P2q3/5P2/1P6/P2PP2P/RNBQKBNR w KQkq - 1 7",
    solution: [{ from: sq("f4"), to: sq("e5") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 468, ratingMin: 1201, ratingMax: 1600,
    fen: "B1bq1k2/p3pp2/4p3/7P/5n2/P7/1Pr4P/R4KNR b - - 0 16",
    solution: [{ from: sq("d8"), to: sq("d3") }],
    difficulty: "expert", puzzleType: "tactic", theme: "double-attack",
    description: "Find the strongest move — it wins material outright.",
    explanation: "This queen move creates a decisive threat the opponent has no good answer to.",
  },
  {
    id: 469, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbqkb1r/2pppppp/8/pp6/5PP1/2PP3P/PP2P2R/RNBQKnN1 b Qkq - 1 7",
    solution: [{ from: sq("f1"), to: sq("h2") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The knight captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 470, ratingMin: 1201, ratingMax: 1600,
    fen: "1rbk1b1r/pppp4/B3Q1Pn/8/P3P3/q4P2/2PP4/RNB1K1N1 w Q - 1 13",
    solution: [{ from: sq("e6"), to: sq("f6") }],
    difficulty: "expert", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "This queen move creates a decisive threat the opponent has no good answer to.",
  },
  {
    id: 471, ratingMin: 1201, ratingMax: 1600,
    fen: "rnb1nk2/1p1pppp1/1qp5/p7/5P2/1P1P2P1/P3Q3/RNBK1BR1 b - - 2 15",
    solution: [{ from: sq("b6"), to: sq("g1") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 472, ratingMin: 1201, ratingMax: 1600,
    fen: "r3kbnr/pp2pppp/n3b3/2P5/P7/4q3/1P1KP2P/RNBQ1B1R w kq - 5 11",
    solution: [{ from: sq("d2"), to: sq("e3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The king captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 473, ratingMin: 1201, ratingMax: 1600,
    fen: "r4b1r/2k1p2p/Q2q3p/5p2/P1B5/7N/1PP2P1P/1RK4R b - - 2 17",
    solution: [{ from: sq("a8"), to: sq("a6") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The rook captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 474, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2kbnr/pp3R2/8/3pp1p1/6b1/1P1P4/P1q1PPP1/RNQ1KBN1 b Qkq - 1 9",
    solution: [{ from: sq("c2"), to: sq("c1") }],
    difficulty: "expert", puzzleType: "mate", theme: "mating-net",
    description: "There is a forced checkmate — find it.",
    explanation: "This delivers forced checkmate within 1 move — there is no defense.",
  },
  {
    id: 475, ratingMin: 1201, ratingMax: 1600,
    fen: "rnb2bnr/1p1kp3/p4p2/q1pp2pQ/8/N1P2P1P/PP1PP1P1/R1B1KBNR w KQ - 2 10",
    solution: [{ from: sq("h5"), to: sq("h8") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended rook, winning material outright with no way to recapture favorably.",
  },
  {
    id: 476, ratingMin: 1201, ratingMax: 1600,
    fen: "rn2kb1r/Q4p2/2bp1npp/8/2q1P3/1PN4N/P4PPP/R3KB1R b KQkq e3 0 14",
    solution: [{ from: sq("c4"), to: sq("c3") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The queen captures the undefended knight, winning material outright with no way to recapture favorably.",
  },
  {
    id: 477, ratingMin: 1201, ratingMax: 1600,
    fen: "r1b3nr/p1pk1ppp/np6/4p1q1/5P2/b3P1P1/1PPP3P/RNBQK1NR w KQ - 0 7",
    solution: [{ from: sq("f4"), to: sq("g5") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended queen, winning material outright with no way to recapture favorably.",
  },
  {
    id: 478, ratingMin: 1201, ratingMax: 1600,
    fen: "rnbqkbnr/p2pp1pp/2p2p2/1B6/8/1PP1P2P/P2P1PPN/RNBQK2R b KQkq - 0 7",
    solution: [{ from: sq("c6"), to: sq("b5") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "The pawn captures the undefended bishop, winning material outright with no way to recapture favorably.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MASTER  (1601–2000)  — Precise combinations, punishing small mistakes
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 501, ratingMin: 1601, ratingMax: 2000,
    fen: "r2q1rk1/pp2ppbp/2n3p1/3pNb2/3P4/2N1B3/PP2BPPP/R2Q1RK1 w - - 0 11",
    solution: [{ from: sq("e5"), to: sq("d7") }],
    difficulty: "master", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Nxd7 forks the queen and rook, winning the exchange with tempo.",
  },
  {
    id: 503, ratingMin: 1601, ratingMax: 2000,
    fen: "r1b2rk1/pp3ppp/1qnbpn2/3p4/2PP4/P1N1PN2/1PB2PPP/R1BQ1RK1 w - - 0 10",
    solution: [{ from: sq("c4"), to: sq("d5") }],
    difficulty: "master", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "cxd5 cracks Black's center, leaving the pieces overextended.",
  },
  {
    id: 504, ratingMin: 1601, ratingMax: 2000,
    fen: "2r1r1k1/1bqn1ppp/p2bp3/1p2N3/3P4/PBN1B3/1PP2PPP/R2QR1K1 w - - 0 14",
    solution: [{ from: sq("e5"), to: sq("f7") }],
    difficulty: "master", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Nxf7 begins a forcing sequence that nets the queen.",
  },
  {
    id: 505, ratingMin: 1601, ratingMax: 2000,
    fen: "r3r1k1/1ppq1ppp/p2b1n2/3Np1b1/2BPP3/2P2N2/PP3PPP/R1BQR1K1 w - - 0 13",
    solution: [{ from: sq("d5"), to: sq("f6") }],
    difficulty: "master", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Nxf6+ tears open the king with multiple mating threats.",
  },
  {
    id: 506, ratingMin: 1601, ratingMax: 2000,
    fen: "2rq1rk1/pp2bppp/2n1p3/3pNb2/3P1B2/2N5/PP2BPPP/R2Q1RK1 w - - 0 12",
    solution: [{ from: sq("e5"), to: sq("f7") }],
    difficulty: "master", puzzleType: "sacrifice", theme: "deflection",
    description: "Find the strongest continuation.",
    explanation: "Nxf7 deflects the rook with a forcing sacrifice.",
  },
  {
    id: 507, ratingMin: 1601, ratingMax: 2000,
    fen: "1r2r1k1/p4ppp/bqnbpn2/1pp5/3P1B2/2PBPN2/PP1N1PPP/R2QR1K1 w - - 0 13",
    solution: [{ from: sq("d2"), to: sq("c4") }],
    difficulty: "master", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Nc4 attacks the queen and the d6 bishop simultaneously.",
  },
  {
    id: 508, ratingMin: 1601, ratingMax: 2000,
    fen: "r4rk1/1pp1qppp/p2b1n2/3pN3/3P2b1/P1N1B3/1PP1BPPP/R2QR1K1 w - - 0 14",
    solution: [{ from: sq("e5"), to: sq("g4") }],
    difficulty: "master", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Nxg4 forces open the lines toward the exposed king.",
  },
  {
    id: 509, ratingMin: 1601, ratingMax: 2000,
    fen: "r2q1rk1/5ppp/p2p1n2/1pb1p1b1/2B1P3/1PN2N2/PBP2PPP/R2Q1RK1 w - - 0 13",
    solution: [{ from: sq("f3"), to: sq("e5") }],
    difficulty: "master", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Nxe5 hits several pieces and wins material by force.",
  },
  {
    id: 510, ratingMin: 1601, ratingMax: 2000,
    fen: "r1bq1r1k/pp4pp/2nb1p2/3pp3/2PP4/1PN1PN2/PB3PPP/R2QKB1R w KQ - 0 11",
    solution: [{ from: sq("d4"), to: sq("e5") }],
    difficulty: "master", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "dxe5 forks the knight and bishop while opening the center.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GRANDMASTER  (2001+)  — Precise long lines, near-perfect execution
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 601, ratingMin: 2001, ratingMax: 9999,
    fen: "r2q1rk1/1b2bppp/p3pn2/1ppp4/3P1B2/P1N1PN2/1PP1BPPP/R2Q1RK1 w - - 0 11",
    solution: [{ from: sq("f4"), to: sq("e5") }],
    difficulty: "grandmaster", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Bxe5 begins a forcing attacking sequence worth the material.",
  },
  {
    id: 602, ratingMin: 2001, ratingMax: 9999,
    fen: "r3r1k1/pp1q1ppp/2nb1n2/3pp1B1/2PP1B2/P1N1PN2/1P3PPP/R2QK2R w KQ - 0 13",
    solution: [{ from: sq("g5"), to: sq("f6") }],
    difficulty: "grandmaster", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Bxf6 leads by force to a decisive advantage.",
  },
  {
    id: 604, ratingMin: 2001, ratingMax: 9999,
    fen: "2r1r1k1/pp2qppp/2np1n2/3bp1B1/2B1P3/2N1QN2/PPP2PPP/R3R1K1 w - - 0 12",
    solution: [{ from: sq("c3"), to: sq("d5") }],
    difficulty: "grandmaster", puzzleType: "tactic", theme: "double-attack",
    description: "Find the strongest move — it wins material outright.",
    explanation: "Nxd5 captures the undefended bishop, winning material outright with no way to recapture favorably.",
  },
  {
    id: 606, ratingMin: 2001, ratingMax: 9999,
    fen: "r1bq1rk1/pp3ppp/2n1p3/3pN1b1/2BP4/2N5/PP3PPP/R1BQK2R w KQ - 0 11",
    solution: [{ from: sq("e5"), to: sq("d7") }],
    difficulty: "grandmaster", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Nxd7 forks the queen and rook in a realistic middlegame.",
  },
  {
    id: 608, ratingMin: 2001, ratingMax: 9999,
    fen: "r2q1rk1/1pp2ppp/p1nb1n2/4p1B1/1bBPP3/2N2N2/PPP2PPP/R2QK2R w KQ - 0 9",
    solution: [{ from: sq("d4"), to: sq("d5") }],
    difficulty: "grandmaster", puzzleType: "tactic", theme: "central-break",
    description: "Find the strongest move.",
    explanation: "d5 is a central break requiring long, accurate calculation to justify.",
  },
  {
    id: 609, ratingMin: 2001, ratingMax: 9999,
    fen: "r3r1k1/ppqn1ppp/2pbpn2/3p4/2PP4/P1NBPN2/1PQ2PPP/R1B2RK1 w - - 0 12",
    solution: [{ from: sq("c3"), to: sq("d5") }],
    difficulty: "grandmaster", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Nd5 is a piece sacrifice forcing a win deep in the resulting lines.",
  },
  {
    id: 610, ratingMin: 2001, ratingMax: 9999,
    fen: "r1b2rk1/pp2qppp/2nppn2/8/2BNP3/2N1B3/PPP2PPP/R2QK2R w KQ - 0 10",
    solution: [{ from: sq("d4"), to: sq("f5") }],
    difficulty: "grandmaster", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Nf5 launches a sacrifice with a forced mating attack to follow.",
  },
];

// ── Puzzle selection by rating ────────────────────────────────────────────────
export function getPuzzleForRating(rating: number, excludeIds: Set<number> = new Set()): ChessPuzzle {
  const tier = tierForRating(rating);
  const pool = PUZZLES.filter(
    (p) => p.difficulty === tier.difficulty && !excludeIds.has(p.id),
  );
  // Fall back to any not-excluded puzzle of this difficulty if pool is exhausted
  const fallback = PUZZLES.filter((p) => p.difficulty === tier.difficulty);
  const candidates = pool.length > 0 ? pool : fallback;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Filtering helpers (database-style queries over the puzzle bank) ───────────
export function getPuzzlesByDifficulty(difficulty: ChessPuzzle["difficulty"]): ChessPuzzle[] {
  return PUZZLES.filter((p) => p.difficulty === difficulty);
}

export function getPuzzlesByType(type: PuzzleType): ChessPuzzle[] {
  return PUZZLES.filter((p) => p.puzzleType === type);
}

export function getPuzzlesByRatingRange(min: number, max: number): ChessPuzzle[] {
  return PUZZLES.filter((p) => p.ratingMax >= min && p.ratingMin <= max);
}

export function getPuzzleById(id: number): ChessPuzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

// ── PuzzleRush sequence — starts intermediate, ramps quickly to master/grandmaster ──
export function getPuzzleSequence(): ChessPuzzle[] {
  const order: ChessPuzzle["difficulty"][] = [
    "intermediate", "intermediate", "advanced", "intermediate", "advanced",
    "expert", "advanced", "expert", "master", "expert",
    "master", "grandmaster", "master", "grandmaster", "grandmaster",
  ];
  const byDiff: Record<string, ChessPuzzle[]> = {};
  for (const p of PUZZLES) {
    if (!byDiff[p.difficulty]) byDiff[p.difficulty] = [];
    byDiff[p.difficulty].push(p);
  }
  const counters: Record<string, number> = {};
  return order.map((d) => {
    counters[d] = counters[d] ?? 0;
    const pool = byDiff[d] ?? [];
    const puzzle = pool[counters[d] % pool.length];
    counters[d]++;
    return puzzle;
  }).filter(Boolean);
}
