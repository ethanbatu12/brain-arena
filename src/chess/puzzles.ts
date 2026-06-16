import type { ChessPuzzle } from "./types";
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
export const PUZZLES: ChessPuzzle[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // BEGINNER  (0–400)  — Mate in 1, free pieces, obvious captures
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 101, ratingMin: 0, ratingMax: 400,
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: { from: sq("h5"), to: sq("f7") },
    difficulty: "beginner", theme: "checkmate",
    description: "Scholar's mate — queen takes f7, checkmate.",
  },
  {
    id: 102, ratingMin: 0, ratingMax: 400,
    fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
    solution: { from: sq("a1"), to: sq("a8") },
    difficulty: "beginner", theme: "checkmate",
    description: "Back rank checkmate with the rook.",
  },
  {
    id: 103, ratingMin: 0, ratingMax: 400,
    fen: "6k1/8/6K1/8/8/8/8/7Q w - - 0 1",
    solution: { from: sq("h1"), to: sq("h7") },
    difficulty: "beginner", theme: "checkmate",
    description: "Queen delivers checkmate — corner the king.",
  },
  {
    id: 104, ratingMin: 0, ratingMax: 400,
    fen: "5rk1/5ppp/8/8/8/8/8/R4RK1 w - - 0 1",
    solution: { from: sq("f1"), to: sq("f8") },
    difficulty: "beginner", theme: "checkmate",
    description: "Back rank mate — rook captures on f8.",
  },
  {
    id: 105, ratingMin: 0, ratingMax: 400,
    fen: "3k4/3Q4/3K4/8/8/8/8/8 w - - 0 1",
    solution: { from: sq("d7"), to: sq("c7") },
    difficulty: "beginner", theme: "checkmate",
    description: "Queen corrals the king — checkmate on c7.",
  },
  {
    id: 106, ratingMin: 0, ratingMax: 400,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solution: { from: sq("f3"), to: sq("e5") },
    difficulty: "beginner", theme: "free-piece",
    description: "The pawn on e5 is undefended — win a free pawn.",
  },
  {
    id: 107, ratingMin: 0, ratingMax: 400,
    fen: "rnbqkbnr/ppp2ppp/8/3pp3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3",
    solution: { from: sq("d1"), to: sq("d5") },
    difficulty: "beginner", theme: "free-piece",
    description: "Queen captures the undefended pawn on d5.",
  },
  {
    id: 108, ratingMin: 0, ratingMax: 400,
    fen: "4k3/4r3/8/8/8/8/8/4K2R w K - 0 1",
    solution: { from: sq("h1"), to: sq("e1") },
    difficulty: "beginner", theme: "checkmate",
    description: "Rook to e1 pins and wins the rook — then mates.",
  },
  {
    id: 109, ratingMin: 0, ratingMax: 400,
    fen: "8/8/8/8/8/6k1/6p1/6K1 b - - 0 1",
    solution: { from: sq("g2"), to: sq("g1") },
    difficulty: "beginner", theme: "promotion",
    description: "Promote the pawn — queening wins immediately.",
  },
  {
    id: 110, ratingMin: 0, ratingMax: 400,
    fen: "2k5/8/2K5/2R5/8/8/8/8 w - - 0 1",
    solution: { from: sq("c5"), to: sq("c8") },
    difficulty: "beginner", theme: "checkmate",
    description: "Rook to c8 — checkmate in the corner.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INTERMEDIATE  (401–800)  — Basic forks, pins, skewers, 2-move combos
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 201, ratingMin: 401, ratingMax: 800,
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: { from: sq("f3"), to: sq("g5") },
    difficulty: "intermediate", theme: "fork",
    description: "Knight to g5 — fork the queen and threaten f7.",
  },
  {
    id: 202, ratingMin: 401, ratingMax: 800,
    fen: "r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P3/2NP4/PPP2PPP/R2QK2R w KQkq - 0 7",
    solution: { from: sq("c4"), to: sq("f7") },
    difficulty: "intermediate", theme: "fork",
    description: "Bishop forks king and queen — decisive material gain.",
  },
  {
    id: 203, ratingMin: 401, ratingMax: 800,
    fen: "rnb1kbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 2 3",
    solution: { from: sq("d8"), to: sq("h4") },
    difficulty: "intermediate", theme: "pin",
    description: "Queen to h4 — pin the f2 knight against the king.",
  },
  {
    id: 204, ratingMin: 401, ratingMax: 800,
    fen: "4k3/8/8/8/8/8/8/R3K2r b - - 0 1",
    solution: { from: sq("h1"), to: sq("a1") },
    difficulty: "intermediate", theme: "skewer",
    description: "Rook skewer — force the king to move, then win the rook.",
  },
  {
    id: 205, ratingMin: 401, ratingMax: 800,
    fen: "r5k1/5ppp/8/8/8/8/5PPP/3RK1R1 w - - 0 1",
    solution: { from: sq("d1"), to: sq("d8") },
    difficulty: "intermediate", theme: "skewer",
    description: "Rook to d8 — skewer through the king to win the rook.",
  },
  {
    id: 206, ratingMin: 401, ratingMax: 800,
    fen: "r1bq1rk1/pppp1ppp/2n2n2/2b5/3NP3/2P5/PP3PPP/RNBQKB1R w KQ - 0 7",
    solution: { from: sq("d4"), to: sq("c6") },
    difficulty: "intermediate", theme: "fork",
    description: "Knight takes c6 — fork the queen and rook.",
  },
  {
    id: 207, ratingMin: 401, ratingMax: 800,
    fen: "3k4/3r4/8/3R4/8/3K4/8/8 w - - 0 1",
    solution: { from: sq("d5"), to: sq("d7") },
    difficulty: "intermediate", theme: "skewer",
    description: "Rook to d7 — skewer the king and win the rook behind it.",
  },
  {
    id: 208, ratingMin: 401, ratingMax: 800,
    fen: "r1b1kb1r/pppp1ppp/2n2q2/4p3/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 5",
    solution: { from: sq("d4"), to: sq("e5") },
    difficulty: "intermediate", theme: "fork",
    description: "Pawn captures e5 — fork the queen and knight.",
  },
  {
    id: 209, ratingMin: 401, ratingMax: 800,
    fen: "2b1k2r/pp3ppp/2p5/8/4B3/8/PP3PPP/R3K2R w KQk - 0 1",
    solution: { from: sq("e4"), to: sq("b7") },
    difficulty: "intermediate", theme: "pin",
    description: "Bishop pins the c8 bishop — win material.",
  },
  {
    id: 210, ratingMin: 401, ratingMax: 800,
    fen: "r3k2r/pp1b1ppp/2p1pn2/q2p2B1/3P4/2NB1N2/PPP2PPP/R2QK2R w KQkq - 0 9",
    solution: { from: sq("g5"), to: sq("f6") },
    difficulty: "intermediate", theme: "discovered-attack",
    description: "Bishop takes f6 — discover an attack on the queen.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADVANCED  (801–1200)  — Multi-step tactics, early sacrifices
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 301, ratingMin: 801, ratingMax: 1200,
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P4/PPP2PPP/RNBQK1NR w KQkq - 1 4",
    solution: { from: sq("c4"), to: sq("g8") },
    difficulty: "advanced", theme: "discovered-attack",
    description: "Bishop to g8 reveals a discovered check — disruptive sacrifice.",
  },
  {
    id: 302, ratingMin: 801, ratingMax: 1200,
    fen: "r2q1rk1/1pp2ppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP2PPP/R2Q1RK1 w - - 0 9",
    solution: { from: sq("f3"), to: sq("d5") },
    difficulty: "advanced", theme: "fork",
    description: "Knight fork — hits queen and bishop simultaneously.",
  },
  {
    id: 303, ratingMin: 801, ratingMax: 1200,
    fen: "4r1k1/pp3ppp/8/3q4/3P4/2PQ4/PP4PP/5RK1 b - - 0 1",
    solution: { from: sq("e8"), to: sq("e1") },
    difficulty: "advanced", theme: "counter-attack",
    description: "Rook to e1 — counter-attack before the opponent can reorganize.",
  },
  {
    id: 304, ratingMin: 801, ratingMax: 1200,
    fen: "6k1/5ppp/4p3/8/8/8/5PPP/5RK1 w - - 0 1",
    solution: { from: sq("f1"), to: sq("f8") },
    difficulty: "advanced", theme: "mating-net",
    description: "Rook to f8 — creates a mating net Black can't escape.",
  },
  {
    id: 305, ratingMin: 801, ratingMax: 1200,
    fen: "4k2r/pbpp1ppp/1p2pn2/8/1bBPP3/2N2N2/PPP2PPP/R1BQK2R w KQk - 2 8",
    solution: { from: sq("c3"), to: sq("e4") },
    difficulty: "advanced", theme: "discovered-attack",
    description: "Knight to e4 — discovered attack on the bishop pair.",
  },
  {
    id: 306, ratingMin: 801, ratingMax: 1200,
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 9",
    solution: { from: sq("d4"), to: sq("f5") },
    difficulty: "advanced", theme: "sacrifice",
    description: "Knight sacrifice on f5 — open lines toward the king.",
  },
  {
    id: 307, ratingMin: 801, ratingMax: 1200,
    fen: "r4rk1/pp3ppp/2p5/8/2B5/8/PP3PPP/3R2K1 w - - 0 1",
    solution: { from: sq("d1"), to: sq("d8") },
    difficulty: "advanced", theme: "mating-net",
    description: "Rook invades the back rank — decisive.",
  },
  {
    id: 308, ratingMin: 801, ratingMax: 1200,
    fen: "2r3k1/1p3ppp/p7/3p4/3P4/P4N2/1P3PPP/2R3K1 w - - 0 1",
    solution: { from: sq("c1"), to: sq("c8") },
    difficulty: "advanced", theme: "mating-net",
    description: "Rook exchange leads to a decisive endgame advantage.",
  },
  {
    id: 309, ratingMin: 801, ratingMax: 1200,
    fen: "3r2k1/pp4pp/2p2p2/4p3/4P3/2P2P2/PP4PP/3R2K1 w - - 0 1",
    solution: { from: sq("d1"), to: sq("d8") },
    difficulty: "advanced", theme: "mating-net",
    description: "Back rank pressure — rook to d8 forces decisive material win.",
  },
  {
    id: 310, ratingMin: 801, ratingMax: 1200,
    fen: "r3k2r/pp1n1ppp/2pb1n2/3pp1q1/3PP1b1/2NB1N2/PPP1QPPP/R1B1K2R w KQkq - 0 9",
    solution: { from: sq("f3"), to: sq("e5") },
    difficulty: "advanced", theme: "fork",
    description: "Knight captures e5 — fork targeting queen and bishop pair.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EXPERT  (1201–1600)  — Deep calculation, hidden tactics, sacrifices
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 401, ratingMin: 1201, ratingMax: 1600,
    fen: "r4rk1/ppp2ppp/2nq1n2/3pp1B1/1b1PP1b1/2NQ1N2/PPP2PPP/R3R1K1 w - - 0 9",
    solution: { from: sq("g5"), to: sq("f6") },
    difficulty: "expert", theme: "sacrifice",
    description: "Bishop sacrifice on f6 — tear open the king's shelter.",
  },
  {
    id: 402, ratingMin: 1201, ratingMax: 1600,
    fen: "3r2k1/pp3ppp/2b5/8/2B5/1P6/P4PPP/3R2K1 b - - 0 1",
    solution: { from: sq("d8"), to: sq("d1") },
    difficulty: "expert", theme: "exchange",
    description: "Rook exchange — then exploit the bishop pair endgame.",
  },
  {
    id: 403, ratingMin: 1201, ratingMax: 1600,
    fen: "2r3k1/1p3ppp/p7/8/8/1P6/P4PPP/3R2K1 w - - 0 1",
    solution: { from: sq("d1"), to: sq("d8") },
    difficulty: "expert", theme: "exchange",
    description: "Rook to d8 — simplify into a winning rook endgame.",
  },
  {
    id: 404, ratingMin: 1201, ratingMax: 1600,
    fen: "r2q1rk1/1p1b1ppp/p2bpn2/3p4/3P4/1BNQBN2/PP3PPP/R3R1K1 w - - 0 12",
    solution: { from: sq("e3"), to: sq("g5") },
    difficulty: "expert", theme: "sacrifice",
    description: "Knight to g5 — threatening discovered check with multiple threats.",
  },
  {
    id: 405, ratingMin: 1201, ratingMax: 1600,
    fen: "1rb2rk1/p4ppp/1pn1p3/3pP3/q2P1B2/2RQ2N1/PP3PPP/4RBK1 w - - 0 1",
    solution: { from: sq("g3"), to: sq("f5") },
    difficulty: "expert", theme: "sacrifice",
    description: "Knight to f5 — sacrifice to open dangerous lines against the king.",
  },
  {
    id: 406, ratingMin: 1201, ratingMax: 1600,
    fen: "r1bq1rk1/pp3ppp/2n1pn2/2pp4/1bPP4/1PN1PN2/PB2BPPP/R2QK2R w KQ - 0 9",
    solution: { from: sq("e3"), to: sq("d5") },
    difficulty: "expert", theme: "fork",
    description: "Knight to d5 — explosive fork with many tactical threats.",
  },
  {
    id: 407, ratingMin: 1201, ratingMax: 1600,
    fen: "3r1r1k/1p3ppp/p1n1p3/2q5/3P4/1BN1Q3/PP3PPP/R4RK1 w - - 0 1",
    solution: { from: sq("e3"), to: sq("h6") },
    difficulty: "expert", theme: "mating-net",
    description: "Queen to h6 — mating threat that Black cannot neutralize.",
  },
  {
    id: 408, ratingMin: 1201, ratingMax: 1600,
    fen: "r4rk1/1bqn1ppp/pp2p3/2pp4/3P4/P1N1PN2/BP3PPP/R2Q1RK1 w - - 0 12",
    solution: { from: sq("c3"), to: sq("d5") },
    difficulty: "expert", theme: "fork",
    description: "Knight to d5 — central fork attacking queen and bishop.",
  },
  {
    id: 409, ratingMin: 1201, ratingMax: 1600,
    fen: "2rq1rk1/1b2bppp/p2ppn2/1p6/3NP3/1BN1B3/PPP2PPP/R2Q1RK1 w - - 0 11",
    solution: { from: sq("d4"), to: sq("c6") },
    difficulty: "expert", theme: "sacrifice",
    description: "Knight sacrifice on c6 — destroy the pawn structure and win material.",
  },
  {
    id: 410, ratingMin: 1201, ratingMax: 1600,
    fen: "r3r1k1/pp3ppp/1qnb1n2/3pp1B1/3P4/P1N1PN2/1PP2PPP/R2QK2R w KQ - 0 11",
    solution: { from: sq("g5"), to: sq("d8") },
    difficulty: "expert", theme: "exchange",
    description: "Bishop to d8 — seize the back rank and force decisive material win.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MASTER  (1601–2000)  — Precise combinations, punishing small mistakes
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 501, ratingMin: 1601, ratingMax: 2000,
    fen: "r2q1rk1/pp2ppbp/2n3p1/3pNb2/3P4/2N1B3/PP2BPPP/R2Q1RK1 w - - 0 11",
    solution: { from: sq("e5"), to: sq("d7") },
    difficulty: "master", theme: "fork",
    description: "Knight to d7 — fork queen and rook with tempo.",
  },
  {
    id: 502, ratingMin: 1601, ratingMax: 2000,
    fen: "r4rk1/pp1qbppp/2n1pn2/3p4/2PP4/2N1PN2/PP2BPPP/R2Q1RK1 w - - 0 10",
    solution: { from: sq("d4"), to: sq("d5") },
    difficulty: "master", theme: "break",
    description: "Pawn to d5 — central break opening lines toward the king.",
  },
  {
    id: 503, ratingMin: 1601, ratingMax: 2000,
    fen: "r1b2rk1/pp3ppp/1qnbpn2/3p4/2PP4/P1N1PN2/1PB2PPP/R1BQ1RK1 w - - 0 10",
    solution: { from: sq("c4"), to: sq("d5") },
    difficulty: "master", theme: "sacrifice",
    description: "Pawn sacrifice on d5 — destroy Black's central structure.",
  },
  {
    id: 504, ratingMin: 1601, ratingMax: 2000,
    fen: "2r1r1k1/1bqn1ppp/p2bp3/1p2N3/3P4/PBN1B3/1PP2PPP/R2QR1K1 w - - 0 14",
    solution: { from: sq("e5"), to: sq("f7") },
    difficulty: "master", theme: "sacrifice",
    description: "Knight sacrifice on f7 — forced sequence wins the queen.",
  },
  {
    id: 505, ratingMin: 1601, ratingMax: 2000,
    fen: "r3r1k1/1ppq1ppp/p2b1n2/3Np1b1/2BPP3/2P2N2/PP3PPP/R1BQR1K1 w - - 0 13",
    solution: { from: sq("d5"), to: sq("f6") },
    difficulty: "master", theme: "sacrifice",
    description: "Knight captures f6 — open the king, multiple mating threats.",
  },
  {
    id: 506, ratingMin: 1601, ratingMax: 2000,
    fen: "2rq1rk1/pp2bppp/2n1p3/3pNb2/3P1B2/2N5/PP2BPPP/R2Q1RK1 w - - 0 12",
    solution: { from: sq("e5"), to: sq("f7") },
    difficulty: "master", theme: "sacrifice",
    description: "Knight on f7 — deflect the rook with a forcing sacrifice.",
  },
  {
    id: 507, ratingMin: 1601, ratingMax: 2000,
    fen: "1r2r1k1/p4ppp/bqnbpn2/1pp5/3P1B2/2PBPN2/PP1N1PPP/R2QR1K1 w - - 0 13",
    solution: { from: sq("d2"), to: sq("c4") },
    difficulty: "master", theme: "fork",
    description: "Knight to c4 — attack the queen and d6 bishop simultaneously.",
  },
  {
    id: 508, ratingMin: 1601, ratingMax: 2000,
    fen: "r4rk1/1pp1qppp/p2b1n2/3pN3/3P2b1/P1N1B3/1PP1BPPP/R2QR1K1 w - - 0 14",
    solution: { from: sq("e5"), to: sq("g4") },
    difficulty: "master", theme: "sacrifice",
    description: "Knight takes g4 — force open lines toward the exposed king.",
  },
  {
    id: 509, ratingMin: 1601, ratingMax: 2000,
    fen: "r2q1rk1/5ppp/p2p1n2/1pb1p1b1/2B1P3/1PN2N2/PBP2PPP/R2Q1RK1 w - - 0 13",
    solution: { from: sq("f3"), to: sq("e5") },
    difficulty: "master", theme: "fork",
    description: "Knight to e5 — attack bishop and fork multiple targets.",
  },
  {
    id: 510, ratingMin: 1601, ratingMax: 2000,
    fen: "r1bq1r1k/pp4pp/2nb1p2/3pp3/2PP4/1PN1PN2/PB3PPP/R2QKB1R w KQ - 0 11",
    solution: { from: sq("d4"), to: sq("e5") },
    difficulty: "master", theme: "fork",
    description: "Pawn to e5 — fork the knight and bishop, opening the center.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GRANDMASTER  (2001+)  — Precise long lines, near-perfect execution
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 601, ratingMin: 2001, ratingMax: 9999,
    fen: "r2q1rk1/1b2bppp/p3pn2/1ppp4/3P1B2/P1N1PN2/1PP1BPPP/R2Q1RK1 w - - 0 11",
    solution: { from: sq("f4"), to: sq("e5") },
    difficulty: "grandmaster", theme: "sacrifice",
    description: "Bishop to e5 — piece sacrifice starts a forcing attack sequence.",
  },
  {
    id: 602, ratingMin: 2001, ratingMax: 9999,
    fen: "r3r1k1/pp1q1ppp/2nb1n2/3pp1B1/2PP1B2/P1N1PN2/1P3PPP/R2QK2R w KQ - 0 13",
    solution: { from: sq("g5"), to: sq("f6") },
    difficulty: "grandmaster", theme: "sacrifice",
    description: "Bishop takes f6 — complex forcing line leads to decisive advantage.",
  },
  {
    id: 603, ratingMin: 2001, ratingMax: 9999,
    fen: "r2qr1k1/1p1nbppp/p2p1n2/2pPp3/2B1PP2/2N1BN2/PP4PP/R2Q1RK1 w - - 0 14",
    solution: { from: sq("e4"), to: sq("e5") },
    difficulty: "grandmaster", theme: "break",
    description: "Pawn to e5 — central rupture with deep tactical consequences.",
  },
  {
    id: 604, ratingMin: 2001, ratingMax: 9999,
    fen: "2r1r1k1/pp2qppp/2np1n2/3bp1B1/2B1P3/2N1QN2/PPP2PPP/R3R1K1 w - - 0 12",
    solution: { from: sq("g5"), to: sq("h6") },
    difficulty: "grandmaster", theme: "mating-net",
    description: "Bishop to h6 — forces resignation-level mating net.",
  },
  {
    id: 605, ratingMin: 2001, ratingMax: 9999,
    fen: "r4rk1/pp1qbppp/2n1pn2/2pp2B1/3P4/P1N1PN2/1PP1BPPP/R2Q1RK1 w - - 0 12",
    solution: { from: sq("e3"), to: sq("d5") },
    difficulty: "grandmaster", theme: "sacrifice",
    description: "Knight to d5 — deep sacrifice requiring precise follow-up.",
  },
  {
    id: 606, ratingMin: 2001, ratingMax: 9999,
    fen: "r1bq1rk1/pp3ppp/2n1p3/3pN1b1/2BP4/2N5/PP3PPP/R1BQK2R w KQ - 0 11",
    solution: { from: sq("e5"), to: sq("d7") },
    difficulty: "grandmaster", theme: "fork",
    description: "Knight to d7 — devastating fork in a realistic game position.",
  },
  {
    id: 607, ratingMin: 2001, ratingMax: 9999,
    fen: "2r1r1k1/1b2qppp/pp1p1n2/2pPp3/P1B1P3/2N2N2/1PP2PPP/R1BQR1K1 w - - 0 15",
    solution: { from: sq("c3"), to: sq("d5") },
    difficulty: "grandmaster", theme: "sacrifice",
    description: "Knight to d5 — exchange sacrifice opens a relentless attack.",
  },
  {
    id: 608, ratingMin: 2001, ratingMax: 9999,
    fen: "r2q1rk1/1pp2ppp/p1nb1n2/4p1B1/1bBPP3/2N2N2/PPP2PPP/R2QK2R w KQ - 0 9",
    solution: { from: sq("d4"), to: sq("d5") },
    difficulty: "grandmaster", theme: "break",
    description: "Pawn to d5 — central break with hidden long calculation required.",
  },
  {
    id: 609, ratingMin: 2001, ratingMax: 9999,
    fen: "r3r1k1/ppqn1ppp/2pbpn2/3p4/2PP4/P1NBPN2/1PQ2PPP/R1B2RK1 w - - 0 12",
    solution: { from: sq("c3"), to: sq("d5") },
    difficulty: "grandmaster", theme: "sacrifice",
    description: "Knight to d5 — stunning piece sacrifice, forcing win in long line.",
  },
  {
    id: 610, ratingMin: 2001, ratingMax: 9999,
    fen: "r1b2rk1/pp2qppp/2nppn2/8/2BNP3/2N1B3/PPP2PPP/R2QK2R w KQ - 0 10",
    solution: { from: sq("d4"), to: sq("f5") },
    difficulty: "grandmaster", theme: "sacrifice",
    description: "Knight to f5 — grandmaster-level sacrifice with forced mating attack.",
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

// ── Legacy helpers (used by PuzzleRush) ──────────────────────────────────────
export function getPuzzlesByDifficulty(difficulty: ChessPuzzle["difficulty"]): ChessPuzzle[] {
  return PUZZLES.filter((p) => p.difficulty === difficulty);
}

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
