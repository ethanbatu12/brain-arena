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
    explanation: "Qxf7# is mate: the queen is protected by the bishop on c4 and the king has no escape.",
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
    fen: "6k1/8/6K1/8/8/8/8/7Q w - - 0 1",
    solution: [{ from: sq("h1"), to: sq("h7") }],
    difficulty: "beginner", puzzleType: "mate", theme: "queen-mate",
    description: "Deliver a forced checkmate.",
    explanation: "Qh7# — the king on g8 is boxed in by its own king's support on g6 and the queen.",
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
    id: 105, ratingMin: 0, ratingMax: 400,
    fen: "3k4/3Q4/3K4/8/8/8/8/8 w - - 0 1",
    solution: [{ from: sq("d7"), to: sq("c7") }],
    difficulty: "beginner", puzzleType: "mate", theme: "queen-mate",
    description: "Deliver a forced checkmate.",
    explanation: "Qc7# — the white king on d6 guards the escape squares while the queen mates.",
  },
  {
    id: 106, ratingMin: 0, ratingMax: 400,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solution: [{ from: sq("f3"), to: sq("e5") }],
    difficulty: "beginner", puzzleType: "material", theme: "free-piece",
    description: "Win material.",
    explanation: "Nxe5 wins the undefended e5 pawn for free.",
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
    fen: "k7/2K5/8/8/8/8/6Q1/8 w - - 0 1",
    solution: [{ from: sq("g2"), to: sq("a2") }],
    difficulty: "beginner", puzzleType: "mate", theme: "queen-mate",
    description: "Deliver a forced checkmate.",
    explanation: "Qa2# mates: the queen covers the a-file while the king on c7 guards b7 and b8.",
  },
  {
    id: 109, ratingMin: 0, ratingMax: 400,
    fen: "8/8/8/8/8/6k1/6p1/K7 b - - 0 1",
    solution: [{ from: sq("g2"), to: sq("g1"), promotion: "Q" }],
    difficulty: "beginner", puzzleType: "promotion", theme: "promotion",
    description: "Find the winning move.",
    explanation: "Promoting with g1=Q wins immediately — a new queen decides the game.",
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
    id: 112, ratingMin: 0, ratingMax: 400,
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    solution: [{ from: sq("f7"), to: sq("f8") }],
    difficulty: "beginner", puzzleType: "mate", theme: "queen-mate",
    description: "Deliver a forced checkmate.",
    explanation: "Qf8# — supported by the king on g6, the queen covers every escape square.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INTERMEDIATE  (401–800)  — Basic forks, pins, skewers, 2-move combos
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 201, ratingMin: 401, ratingMax: 800,
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: [{ from: sq("f3"), to: sq("g5") }],
    difficulty: "intermediate", puzzleType: "tactic", theme: "double-attack",
    description: "Find the strongest move.",
    explanation: "Ng5 hits f7 and threatens the queenside fork, creating a double threat.",
  },
  {
    id: 202, ratingMin: 401, ratingMax: 800,
    fen: "r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P3/2NP4/PPP2PPP/R2QK2R w KQkq - 0 7",
    solution: [{ from: sq("c4"), to: sq("f7") }],
    difficulty: "intermediate", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Bxf7+ forks the king and queen, winning decisive material.",
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
    id: 205, ratingMin: 401, ratingMax: 800,
    fen: "r5k1/5ppp/8/8/8/8/5PPP/3RK1R1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d8") }],
    difficulty: "intermediate", puzzleType: "skewer", theme: "skewer",
    description: "Find the move that wins material.",
    explanation: "Rd8+ skewers the king and the a8 rook, winning the rook.",
  },
  {
    id: 206, ratingMin: 401, ratingMax: 800,
    fen: "r1bq1rk1/pppp1ppp/2n2n2/2b5/3NP3/2P5/PP3PPP/RNBQKB1R w KQ - 0 7",
    solution: [{ from: sq("d4"), to: sq("c6") }],
    difficulty: "intermediate", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Nxc6 forks the queen and is hard to meet without losing material.",
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
    id: 210, ratingMin: 401, ratingMax: 800,
    fen: "r3k2r/pp1b1ppp/2p1pn2/q2p2B1/3P4/2NB1N2/PPP2PPP/R2QK2R w KQkq - 0 9",
    solution: [{ from: sq("g5"), to: sq("f6") }],
    difficulty: "intermediate", puzzleType: "discovered", theme: "discovered-attack",
    description: "There is a hidden tactic — find it.",
    explanation: "Bxf6 removes a key defender and opens lines against Black's position.",
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
  // ADVANCED  (801–1200)  — Multi-step tactics, early sacrifices
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 303, ratingMin: 801, ratingMax: 1200,
    fen: "4r1k1/pp3ppp/8/3q4/3P4/2PQ4/PP4PP/5RK1 b - - 0 1",
    solution: [{ from: sq("e8"), to: sq("e1") }],
    difficulty: "advanced", puzzleType: "tactic", theme: "back-rank",
    description: "Find the strongest move.",
    explanation: "Rxe1+ exploits the back rank before White can reorganize the defense.",
  },
  {
    id: 306, ratingMin: 801, ratingMax: 1200,
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 9",
    solution: [{ from: sq("d4"), to: sq("f5") }],
    difficulty: "advanced", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Nf5 sacrifices to rip open the lines toward Black's king.",
  },
  {
    id: 307, ratingMin: 801, ratingMax: 1200,
    fen: "r4rk1/pp3ppp/2p5/8/2B5/8/PP3PPP/3R2K1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d8") }],
    difficulty: "advanced", puzzleType: "tactic", theme: "back-rank",
    description: "Find the strongest move.",
    explanation: "Rd8 invades the back rank with decisive effect.",
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
    id: 310, ratingMin: 801, ratingMax: 1200,
    fen: "r3k2r/pp1n1ppp/2pb1n2/3pp1q1/3PP1b1/2NB1N2/PPP1QPPP/R1B1K2R w KQkq - 0 9",
    solution: [{ from: sq("f3"), to: sq("e5") }],
    difficulty: "advanced", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Nxe5 grabs a central pawn while hitting multiple targets.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EXPERT  (1201–1600)  — Deep calculation, hidden tactics, sacrifices
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 401, ratingMin: 1201, ratingMax: 1600,
    fen: "r4rk1/ppp2ppp/2nq1n2/3pp1B1/1b1PP1b1/2NQ1N2/PPP2PPP/R3R1K1 w - - 0 9",
    solution: [{ from: sq("g5"), to: sq("f6") }],
    difficulty: "expert", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Bxf6 shatters the king's shelter, opening decisive lines.",
  },
  {
    id: 402, ratingMin: 1201, ratingMax: 1600,
    fen: "3r2k1/pp3ppp/2b5/8/2B5/1P6/P4PPP/3R2K1 b - - 0 1",
    solution: [{ from: sq("d8"), to: sq("d1") }],
    difficulty: "expert", puzzleType: "endgame", theme: "conversion",
    description: "Find the best move to convert.",
    explanation: "Rxd1+ trades into a bishop endgame Black wins.",
  },
  {
    id: 403, ratingMin: 1201, ratingMax: 1600,
    fen: "2r3k1/1p3ppp/p7/8/8/1P6/P4PPP/3R2K1 w - - 0 1",
    solution: [{ from: sq("d1"), to: sq("d8") }],
    difficulty: "expert", puzzleType: "endgame", theme: "conversion",
    description: "Find the best move to convert.",
    explanation: "Rxd8+ simplifies into a winning rook endgame.",
  },
  {
    id: 404, ratingMin: 1201, ratingMax: 1600,
    fen: "r2q1rk1/1p1b1ppp/p2bpn2/3p4/3P4/1BNQBN2/PP3PPP/R3R1K1 w - - 0 12",
    solution: [{ from: sq("e3"), to: sq("g5") }],
    difficulty: "expert", puzzleType: "tactic", theme: "double-attack",
    description: "Find the strongest move.",
    explanation: "Bg5 creates multiple threats Black cannot meet at once.",
  },
  {
    id: 405, ratingMin: 1201, ratingMax: 1600,
    fen: "1rb2rk1/p4ppp/1pn1p3/3pP3/q2P1B2/2RQ2N1/PP3PPP/4RBK1 w - - 0 1",
    solution: [{ from: sq("g3"), to: sq("f5") }],
    difficulty: "expert", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Nf5 sacrifices to open dangerous lines against the king.",
  },
  {
    id: 407, ratingMin: 1201, ratingMax: 1600,
    fen: "3r1r1k/1p3ppp/p1n1p3/2q5/3P4/1BN1Q3/PP3PPP/R4RK1 w - - 0 1",
    solution: [{ from: sq("e3"), to: sq("h6") }],
    difficulty: "expert", puzzleType: "mate", theme: "mating-net",
    description: "Find the forced mate.",
    explanation: "Qh6 sets up a mating threat Black cannot neutralize.",
  },
  {
    id: 408, ratingMin: 1201, ratingMax: 1600,
    fen: "r4rk1/1bqn1ppp/pp2p3/2pp4/3P4/P1N1PN2/BP3PPP/R2Q1RK1 w - - 0 12",
    solution: [{ from: sq("c3"), to: sq("d5") }],
    difficulty: "expert", puzzleType: "fork", theme: "fork",
    description: "One move wins material.",
    explanation: "Nd5 forks the queen and the e7 square, winning material.",
  },
  {
    id: 409, ratingMin: 1201, ratingMax: 1600,
    fen: "2rq1rk1/1b2bppp/p2ppn2/1p6/3NP3/1BN1B3/PPP2PPP/R2Q1RK1 w - - 0 11",
    solution: [{ from: sq("d4"), to: sq("c6") }],
    difficulty: "expert", puzzleType: "sacrifice", theme: "sacrifice",
    description: "Find the strongest continuation.",
    explanation: "Nxc6 wrecks the structure and wins material on the follow-up.",
  },
  {
    // ── Verified multi-step puzzle: classic queen-sacrifice smothered mate ──
    // 1. Qg8+!! Rxg8 (forced) 2. Nf7# — the rook on g8 and pawns g7/h7 smother the king.
    id: 411, ratingMin: 1201, ratingMax: 1600,
    fen: "5r1k/6pp/7N/3Q4/8/8/6PP/6K1 w - - 0 1",
    solution: [
      { from: sq("d5"), to: sq("g8") },  // Qg8+  (defended by Nh6, so the king can't take)
      { from: sq("f8"), to: sq("g8") },  // Rxg8  (only legal reply)
      { from: sq("h6"), to: sq("f7") },  // Nf7#  (smothered mate)
    ],
    difficulty: "expert", puzzleType: "mate", theme: "smothered-mate",
    description: "There is a forced mate — find the whole sequence.",
    explanation: "Qg8+!! forces Rxg8, then Nf7# is a smothered mate: the king is boxed in by its own rook and pawns.",
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
    solution: [{ from: sq("g5"), to: sq("h6") }],
    difficulty: "grandmaster", puzzleType: "mate", theme: "mating-net",
    description: "Find the forced mate.",
    explanation: "Bh6 forces a mating net Black cannot survive.",
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

// ── PuzzleRush sequence (mixes tiers, ramps up over a 60-second run) ──────────
export function getPuzzleSequence(): ChessPuzzle[] {
  const order: ChessPuzzle["difficulty"][] = [
    "beginner", "intermediate", "beginner", "intermediate", "advanced",
    "intermediate", "advanced", "expert", "advanced", "expert",
    "master", "expert", "master", "grandmaster", "master",
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
