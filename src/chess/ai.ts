/**
 * Chess AI: minimax with alpha-beta pruning and a material + positional
 * evaluation function. Depth and randomness scale with difficulty.
 */

import type { AiDifficulty, ChessState, Color, Move } from "./types";
import { allLegalMoves, applyMove, isInCheck } from "./engine";

// ---------------------------------------------------------------------------
// Piece-square tables (from White's perspective; mirror for Black)
// ---------------------------------------------------------------------------

const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_MID_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

const PIECE_VALUE: Record<string, number> = {
  P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000,
};

const PST: Record<string, number[]> = {
  P: PAWN_TABLE, N: KNIGHT_TABLE, B: BISHOP_TABLE,
  R: ROOK_TABLE, Q: QUEEN_TABLE, K: KING_MID_TABLE,
};

function pstIndex(sq: number, color: Color): number {
  const f = sq % 8;
  const r = Math.floor(sq / 8);
  return color === "w" ? (7 - r) * 8 + f : r * 8 + f;
}

// ---------------------------------------------------------------------------
// Static evaluation
// ---------------------------------------------------------------------------

export function evaluate(state: ChessState): number {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = state.board[sq];
    if (!p) continue;
    const val = PIECE_VALUE[p.type] + PST[p.type][pstIndex(sq, p.color)];
    score += p.color === "w" ? val : -val;
  }
  return score;
}

// ---------------------------------------------------------------------------
// Minimax with alpha-beta
// ---------------------------------------------------------------------------

function minimax(
  state: ChessState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  if (depth === 0 || state.status === "checkmate" || state.status === "stalemate" || state.status === "draw") {
    if (state.status === "checkmate") return maximizing ? -100000 : 100000;
    if (state.status === "stalemate" || state.status === "draw") return 0;
    return evaluate(state);
  }

  const moves = allLegalMoves(state);
  if (moves.length === 0) return evaluate(state);

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const next = applyMove(state, move);
      const val = minimax(next, depth - 1, alpha, beta, false);
      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const next = applyMove(state, move);
      const val = minimax(next, depth - 1, alpha, beta, true);
      best = Math.min(best, val);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ---------------------------------------------------------------------------
// Difficulty configuration
// ---------------------------------------------------------------------------

interface AiConfig {
  depth: number;
  randomness: number; // 0-1: chance of picking a random move instead
  topN: number; // pick randomly from top N moves
}

const AI_CONFIG: Record<AiDifficulty, AiConfig> = {
  beginner: { depth: 1, randomness: 0.6, topN: 5 },
  easy:     { depth: 1, randomness: 0.3, topN: 3 },
  medium:   { depth: 2, randomness: 0.1, topN: 2 },
  hard:     { depth: 3, randomness: 0,   topN: 1 },
  expert:   { depth: 4, randomness: 0,   topN: 1 },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getBestMove(state: ChessState, difficulty: AiDifficulty): Move | null {
  const moves = allLegalMoves(state);
  if (moves.length === 0) return null;

  const config = AI_CONFIG[difficulty];
  const maximizing = state.turn === "w";

  // Random move for lower difficulties
  if (Math.random() < config.randomness) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Score all moves
  const scored = moves.map((move) => {
    const next = applyMove(state, move);
    const score = minimax(next, config.depth - 1, -Infinity, Infinity, !maximizing);
    return { move, score };
  });

  scored.sort((a, b) => maximizing ? b.score - a.score : a.score - b.score);

  // Pick from top N
  const pool = scored.slice(0, config.topN);
  return pool[Math.floor(Math.random() * pool.length)].move;
}

export function isCheckingMove(state: ChessState, move: Move): boolean {
  const next = applyMove(state, move);
  return isInCheck(next.board, next.turn);
}
