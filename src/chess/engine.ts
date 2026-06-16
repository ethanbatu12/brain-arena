/**
 * Chess engine: move generation, validation, and game state transitions.
 * Pure functions — no side effects, fully deterministic, unit-testable.
 */

import type {
  Board,
  CastlingRights,
  ChessState,
  Color,
  Move,
  Piece,
  PieceType,
  Square,
} from "./types";

// ---------------------------------------------------------------------------
// Board helpers
// ---------------------------------------------------------------------------

export const FILE = (sq: Square) => sq % 8;
export const RANK = (sq: Square) => Math.floor(sq / 8);
export const SQ = (file: number, rank: number): Square => rank * 8 + file;

export function squareName(sq: Square): string {
  return String.fromCharCode(97 + FILE(sq)) + (RANK(sq) + 1);
}

export function parseSquare(name: string): Square {
  return SQ(name.charCodeAt(0) - 97, parseInt(name[1]) - 1);
}

export function inBounds(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

export function opponent(color: Color): Color {
  return color === "w" ? "b" : "w";
}

export function emptyBoard(): Board {
  return Array(64).fill(null);
}

export function cloneBoard(board: Board): Board {
  return [...board];
}

// ---------------------------------------------------------------------------
// FEN parsing / serialisation
// ---------------------------------------------------------------------------

export const INITIAL_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const PIECE_FROM_CHAR: Record<string, Piece> = {
  P: { type: "P", color: "w" },
  R: { type: "R", color: "w" },
  N: { type: "N", color: "w" },
  B: { type: "B", color: "w" },
  Q: { type: "Q", color: "w" },
  K: { type: "K", color: "w" },
  p: { type: "P", color: "b" },
  r: { type: "R", color: "b" },
  n: { type: "N", color: "b" },
  b: { type: "B", color: "b" },
  q: { type: "Q", color: "b" },
  k: { type: "K", color: "b" },
};

const CHAR_FROM_PIECE: Record<string, string> = {
  wP: "P", wR: "R", wN: "N", wB: "B", wQ: "Q", wK: "K",
  bP: "p", bR: "r", bN: "n", bB: "b", bQ: "q", bK: "k",
};

export function pieceChar(piece: Piece): string {
  return CHAR_FROM_PIECE[piece.color + piece.type];
}

export function parseFen(fen: string): ChessState {
  const parts = fen.split(" ");
  const ranks = parts[0].split("/");
  const board: Board = emptyBoard();

  for (let r = 7; r >= 0; r--) {
    const row = ranks[7 - r];
    let file = 0;
    for (const ch of row) {
      if (ch >= "1" && ch <= "8") {
        file += parseInt(ch);
      } else {
        board[SQ(file, r)] = PIECE_FROM_CHAR[ch] ?? null;
        file++;
      }
    }
  }

  const turn: Color = parts[1] === "b" ? "b" : "w";
  const castleStr = parts[2] ?? "-";
  const castling: CastlingRights = {
    wKingSide: castleStr.includes("K"),
    wQueenSide: castleStr.includes("Q"),
    bKingSide: castleStr.includes("k"),
    bQueenSide: castleStr.includes("q"),
  };

  const epStr = parts[3] ?? "-";
  const enPassant: Square | null = epStr !== "-" ? parseSquare(epStr) : null;
  const halfMoveClock = parseInt(parts[4] ?? "0");
  const fullMoveNumber = parseInt(parts[5] ?? "1");

  const state: ChessState = {
    board,
    turn,
    castling,
    enPassant,
    halfMoveClock,
    fullMoveNumber,
    positionHistory: [],
    status: "playing",
    drawReason: null,
    winner: null,
  };

  return state;
}

/** Recompute status for a freshly-parsed FEN (called after all helpers are defined). */
export function computeInitialStatus(state: ChessState): ChessState {
  const s = { ...state };
  if (hasInsufficientMaterial(s.board)) {
    s.status = "draw"; s.drawReason = "insufficient material"; return s;
  }
  const movesAvail = allLegalMoves(s);
  const inCk = isInCheck(s.board, s.turn);
  if (movesAvail.length === 0) {
    if (inCk) { s.status = "checkmate"; s.winner = opponent(s.turn); }
    else { s.status = "stalemate"; s.drawReason = "stalemate"; }
  } else if (inCk) {
    s.status = "check";
  }
  return s;
}

export function boardToFenPieces(board: Board): string {
  const ranks: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = "";
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[SQ(f, r)];
      if (p) {
        if (empty) { row += empty; empty = 0; }
        row += pieceChar(p);
      } else {
        empty++;
      }
    }
    if (empty) row += empty;
    ranks.push(row);
  }
  return ranks.join("/");
}

export function positionKey(state: ChessState): string {
  const castleStr = [
    state.castling.wKingSide ? "K" : "",
    state.castling.wQueenSide ? "Q" : "",
    state.castling.bKingSide ? "k" : "",
    state.castling.bQueenSide ? "q" : "",
  ].join("") || "-";
  const ep = state.enPassant !== null ? squareName(state.enPassant) : "-";
  return `${boardToFenPieces(state.board)} ${state.turn} ${castleStr} ${ep}`;
}

// ---------------------------------------------------------------------------
// Attack detection
// ---------------------------------------------------------------------------

export function isAttackedBy(board: Board, sq: Square, attacker: Color): boolean {
  const f = FILE(sq);
  const r = RANK(sq);

  // Pawns
  const pDir = attacker === "w" ? -1 : 1;
  for (const df of [-1, 1]) {
    const af = f + df;
    const ar = r + pDir;
    if (inBounds(af, ar)) {
      const p = board[SQ(af, ar)];
      if (p && p.color === attacker && p.type === "P") return true;
    }
  }

  // Knights
  for (const [df, dr] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]) {
    const af = f + df, ar = r + dr;
    if (inBounds(af, ar)) {
      const p = board[SQ(af, ar)];
      if (p && p.color === attacker && p.type === "N") return true;
    }
  }

  // Sliding: rook / queen (straight lines)
  for (const [df, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    let cf = f + df, cr = r + dr;
    while (inBounds(cf, cr)) {
      const p = board[SQ(cf, cr)];
      if (p) {
        if (p.color === attacker && (p.type === "R" || p.type === "Q")) return true;
        break;
      }
      cf += df; cr += dr;
    }
  }

  // Sliding: bishop / queen (diagonals)
  for (const [df, dr] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
    let cf = f + df, cr = r + dr;
    while (inBounds(cf, cr)) {
      const p = board[SQ(cf, cr)];
      if (p) {
        if (p.color === attacker && (p.type === "B" || p.type === "Q")) return true;
        break;
      }
      cf += df; cr += dr;
    }
  }

  // King
  for (const [df, dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
    const af = f + df, ar = r + dr;
    if (inBounds(af, ar)) {
      const p = board[SQ(af, ar)];
      if (p && p.color === attacker && p.type === "K") return true;
    }
  }

  return false;
}

export function findKing(board: Board, color: Color): Square {
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (p && p.type === "K" && p.color === color) return sq;
  }
  return -1;
}

export function isInCheck(board: Board, color: Color): boolean {
  const kSq = findKing(board, color);
  if (kSq === -1) return false;
  return isAttackedBy(board, kSq, opponent(color));
}

// ---------------------------------------------------------------------------
// Move application (returns new board, doesn't mutate)
// ---------------------------------------------------------------------------

export function applyMove(state: ChessState, move: Move): ChessState {
  const board = cloneBoard(state.board);
  const piece = board[move.from]!;
  const captured = board[move.to];

  let castling = { ...state.castling };
  let enPassant: Square | null = null;
  let halfMoveClock = state.halfMoveClock + 1;

  // En passant capture
  if (piece.type === "P" && move.to === state.enPassant && state.enPassant !== null) {
    const epCaptureRank = piece.color === "w" ? RANK(move.to) - 1 : RANK(move.to) + 1;
    board[SQ(FILE(move.to), epCaptureRank)] = null;
    halfMoveClock = 0;
  }

  // Castling rook move
  if (piece.type === "K") {
    const df = FILE(move.to) - FILE(move.from);
    if (Math.abs(df) === 2) {
      // King-side
      if (df > 0) {
        const rookFrom = SQ(7, RANK(move.from));
        const rookTo = SQ(5, RANK(move.from));
        board[rookTo] = board[rookFrom];
        board[rookFrom] = null;
      } else {
        const rookFrom = SQ(0, RANK(move.from));
        const rookTo = SQ(3, RANK(move.from));
        board[rookTo] = board[rookFrom];
        board[rookFrom] = null;
      }
    }
    // Revoke castling rights
    if (piece.color === "w") { castling.wKingSide = false; castling.wQueenSide = false; }
    else { castling.bKingSide = false; castling.bQueenSide = false; }
  }

  // Rook moves revoke castling
  if (piece.type === "R") {
    if (move.from === SQ(0, 0)) castling.wQueenSide = false;
    if (move.from === SQ(7, 0)) castling.wKingSide = false;
    if (move.from === SQ(0, 7)) castling.bQueenSide = false;
    if (move.from === SQ(7, 7)) castling.bKingSide = false;
  }

  // Rook captured revokes castling
  if (move.to === SQ(0, 0)) castling.wQueenSide = false;
  if (move.to === SQ(7, 0)) castling.wKingSide = false;
  if (move.to === SQ(0, 7)) castling.bQueenSide = false;
  if (move.to === SQ(7, 7)) castling.bKingSide = false;

  // Pawn double push sets en passant
  if (piece.type === "P") {
    halfMoveClock = 0;
    const dr = RANK(move.to) - RANK(move.from);
    if (Math.abs(dr) === 2) {
      enPassant = SQ(FILE(move.from), RANK(move.from) + dr / 2);
    }
  }

  if (captured) halfMoveClock = 0;

  // Move the piece
  board[move.to] = move.promotion
    ? { type: move.promotion, color: piece.color }
    : piece;
  board[move.from] = null;

  const newTurn = opponent(state.turn);
  const newState: ChessState = {
    board,
    turn: newTurn,
    castling,
    enPassant,
    halfMoveClock,
    fullMoveNumber: state.turn === "b" ? state.fullMoveNumber + 1 : state.fullMoveNumber,
    positionHistory: [...state.positionHistory],
    status: "playing",
    drawReason: null,
    winner: null,
  };

  return newState;
}

// ---------------------------------------------------------------------------
// Pseudo-legal move generation
// ---------------------------------------------------------------------------

function slidingMoves(
  board: Board,
  from: Square,
  color: Color,
  dirs: [number, number][],
): Move[] {
  const moves: Move[] = [];
  const f = FILE(from), r = RANK(from);
  for (const [df, dr] of dirs) {
    let cf = f + df, cr = r + dr;
    while (inBounds(cf, cr)) {
      const sq = SQ(cf, cr);
      const target = board[sq];
      if (target) {
        if (target.color !== color) moves.push({ from, to: sq });
        break;
      }
      moves.push({ from, to: sq });
      cf += df; cr += dr;
    }
  }
  return moves;
}

function pawnMoves(board: Board, from: Square, color: Color, enPassant: Square | null): Move[] {
  const moves: Move[] = [];
  const f = FILE(from), r = RANK(from);
  const dir = color === "w" ? 1 : -1;
  const startRank = color === "w" ? 1 : 6;
  const promoRank = color === "w" ? 7 : 0;
  const promoTypes: PieceType[] = ["Q", "R", "B", "N"];

  function addPawnMove(to: Square) {
    if (RANK(to) === promoRank) {
      for (const promotion of promoTypes) moves.push({ from, to, promotion });
    } else {
      moves.push({ from, to });
    }
  }

  // Forward 1
  const fwd = SQ(f, r + dir);
  if (inBounds(f, r + dir) && !board[fwd]) {
    addPawnMove(fwd);
    // Forward 2 from start
    if (r === startRank) {
      const fwd2 = SQ(f, r + 2 * dir);
      if (!board[fwd2]) addPawnMove(fwd2);
    }
  }

  // Captures
  for (const df of [-1, 1]) {
    const cf = f + df, cr = r + dir;
    if (!inBounds(cf, cr)) continue;
    const sq = SQ(cf, cr);
    if (board[sq] && board[sq]!.color !== color) addPawnMove(sq);
    // En passant
    if (sq === enPassant) moves.push({ from, to: sq });
  }

  return moves;
}

export function pseudoLegalMoves(state: ChessState, from: Square): Move[] {
  const piece = state.board[from];
  if (!piece || piece.color !== state.turn) return [];

  const { board, turn, castling, enPassant } = state;
  const f = FILE(from), r = RANK(from);
  const moves: Move[] = [];

  switch (piece.type) {
    case "P":
      return pawnMoves(board, from, turn, enPassant);

    case "R":
      return slidingMoves(board, from, turn, [[1,0],[-1,0],[0,1],[0,-1]]);

    case "B":
      return slidingMoves(board, from, turn, [[1,1],[1,-1],[-1,1],[-1,-1]]);

    case "Q":
      return slidingMoves(board, from, turn, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);

    case "N": {
      for (const [df, dr] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]) {
        const cf = f + df, cr = r + dr;
        if (inBounds(cf, cr)) {
          const sq = SQ(cf, cr);
          if (!board[sq] || board[sq]!.color !== turn) moves.push({ from, to: sq });
        }
      }
      return moves;
    }

    case "K": {
      for (const [df, dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const cf = f + df, cr = r + dr;
        if (inBounds(cf, cr)) {
          const sq = SQ(cf, cr);
          if (!board[sq] || board[sq]!.color !== turn) moves.push({ from, to: sq });
        }
      }
      // Castling
      const backRank = turn === "w" ? 0 : 7;
      if (r === backRank && f === 4) {
        // King-side
        const ks = turn === "w" ? castling.wKingSide : castling.bKingSide;
        if (ks && !board[SQ(5, backRank)] && !board[SQ(6, backRank)]) {
          moves.push({ from, to: SQ(6, backRank) });
        }
        // Queen-side
        const qs = turn === "w" ? castling.wQueenSide : castling.bQueenSide;
        if (qs && !board[SQ(3, backRank)] && !board[SQ(2, backRank)] && !board[SQ(1, backRank)]) {
          moves.push({ from, to: SQ(2, backRank) });
        }
      }
      return moves;
    }
  }
}

// ---------------------------------------------------------------------------
// Legal move generation (filters moves that leave king in check)
// ---------------------------------------------------------------------------

export function isMoveLegal(state: ChessState, move: Move): boolean {
  const piece = state.board[move.from];
  if (!piece) return false;

  // Castling extra checks
  if (piece.type === "K") {
    const df = FILE(move.to) - FILE(move.from);
    if (Math.abs(df) === 2) {
      const backRank = piece.color === "w" ? 0 : 7;
      const opp = opponent(piece.color);
      // Cannot castle while in check
      if (isInCheck(state.board, piece.color)) return false;
      // Cannot pass through attacked square
      const passSq = SQ(FILE(move.from) + (df > 0 ? 1 : -1), backRank);
      if (isAttackedBy(state.board, passSq, opp)) return false;
    }
  }

  const next = applyMove(state, move);
  return !isInCheck(next.board, piece.color);
}

export function legalMoves(state: ChessState, from: Square): Move[] {
  return pseudoLegalMoves(state, from).filter((m) => isMoveLegal(state, m));
}

export function allLegalMoves(state: ChessState): Move[] {
  const moves: Move[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = state.board[sq];
    if (p && p.color === state.turn) {
      moves.push(...legalMoves(state, sq));
    }
  }
  return moves;
}

// ---------------------------------------------------------------------------
// Draw detection
// ---------------------------------------------------------------------------

export function hasInsufficientMaterial(board: Board): boolean {
  const pieces: Piece[] = board.filter(Boolean) as Piece[];
  const wPieces = pieces.filter((p) => p.color === "w");
  const bPieces = pieces.filter((p) => p.color === "b");

  function isKingOnly(ps: Piece[]) { return ps.length === 1 && ps[0].type === "K"; }
  function isKingPlusMinor(ps: Piece[]) {
    if (ps.length !== 2) return false;
    const nonKing = ps.find((p) => p.type !== "K");
    return nonKing && (nonKing.type === "N" || nonKing.type === "B");
  }

  if (isKingOnly(wPieces) && isKingOnly(bPieces)) return true;
  if (isKingPlusMinor(wPieces) && isKingOnly(bPieces)) return true;
  if (isKingOnly(wPieces) && isKingPlusMinor(bPieces)) return true;
  return false;
}

export function countRepetitions(history: string[], key: string): number {
  return history.filter((k) => k === key).length;
}

// ---------------------------------------------------------------------------
// Game state update after a move
// ---------------------------------------------------------------------------

export function makeMove(state: ChessState, move: Move): ChessState {
  if (!isMoveLegal(state, move)) return state;

  const next = applyMove(state, move);
  const key = positionKey(next);
  next.positionHistory = [...state.positionHistory, key];

  // Check draw conditions
  if (next.halfMoveClock >= 100) {
    next.status = "draw";
    next.drawReason = "fifty-move rule";
    return next;
  }

  if (hasInsufficientMaterial(next.board)) {
    next.status = "draw";
    next.drawReason = "insufficient material";
    return next;
  }

  if (countRepetitions(next.positionHistory, key) >= 3) {
    next.status = "draw";
    next.drawReason = "threefold repetition";
    return next;
  }

  // Check / checkmate / stalemate
  const moves = allLegalMoves(next);
  const inCheck = isInCheck(next.board, next.turn);

  if (moves.length === 0) {
    if (inCheck) {
      next.status = "checkmate";
      next.winner = state.turn;
    } else {
      next.status = "stalemate";
      next.drawReason = "stalemate";
    }
  } else {
    next.status = inCheck ? "check" : "playing";
  }

  return next;
}

export function initialChessState(): ChessState {
  return computeInitialStatus(parseFen(INITIAL_FEN));
}

export function loadFen(fen: string): ChessState {
  return computeInitialStatus(parseFen(fen));
}

// ---------------------------------------------------------------------------
// Move notation (algebraic)
// ---------------------------------------------------------------------------

export function toAlgebraic(state: ChessState, move: Move): string {
  const piece = state.board[move.from]!;
  const next = applyMove(state, move);
  const inCheck = isInCheck(next.board, next.turn);
  const allMovesNext = allLegalMoves(next);
  const suffix = allMovesNext.length === 0 && inCheck ? "#" : inCheck ? "+" : "";

  // Castling
  if (piece.type === "K") {
    const df = FILE(move.to) - FILE(move.from);
    if (df === 2) return "O-O" + suffix;
    if (df === -2) return "O-O-O" + suffix;
  }

  const capture = state.board[move.to] !== null ||
    (piece.type === "P" && move.to === state.enPassant);
  const toName = squareName(move.to);
  const promo = move.promotion ? "=" + move.promotion : "";

  if (piece.type === "P") {
    if (capture) return FILE(move.from) + "x" + toName + promo + suffix;
    return toName + promo + suffix;
  }

  // Disambiguation
  let ambig = false;
  let fileAmbig = false;
  let rankAmbig = false;
  for (let sq = 0; sq < 64; sq++) {
    if (sq === move.from) continue;
    const p = state.board[sq];
    if (!p || p.type !== piece.type || p.color !== piece.color) continue;
    const otherMoves = legalMoves(state, sq);
    if (otherMoves.some((m) => m.to === move.to)) {
      ambig = true;
      if (FILE(sq) === FILE(move.from)) rankAmbig = true;
      else fileAmbig = true;
    }
  }

  let disambig = "";
  if (ambig) {
    if (fileAmbig && rankAmbig) disambig = squareName(move.from);
    else if (rankAmbig) disambig = String(RANK(move.from) + 1);
    else disambig = String.fromCharCode(97 + FILE(move.from));
  }

  const cap = capture ? "x" : "";
  return piece.type + disambig + cap + toName + promo + suffix;
}
