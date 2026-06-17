export type Color = "w" | "b";
export type PieceType = "P" | "R" | "N" | "B" | "Q" | "K";

export interface Piece {
  type: PieceType;
  color: Color;
}

/** 0-based index: 0 = a1, 7 = h1, 56 = a8, 63 = h8 */
export type Square = number;

export type Board = (Piece | null)[];

export interface CastlingRights {
  wKingSide: boolean;
  wQueenSide: boolean;
  bKingSide: boolean;
  bQueenSide: boolean;
}

export interface ChessState {
  board: Board;
  turn: Color;
  castling: CastlingRights;
  /** Square where en passant capture is possible, or null. */
  enPassant: Square | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  /** Position history as FEN strings (without move clocks) for repetition detection. */
  positionHistory: string[];
  status: "playing" | "check" | "checkmate" | "stalemate" | "draw";
  drawReason: string | null;
  winner: Color | null;
}

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
  /** Set by move generation for UI / notation. */
  flags?: MoveFlags;
}

export interface MoveFlags {
  capture?: Piece;
  enPassant?: boolean;
  castling?: "kingSide" | "queenSide";
  promotion?: boolean;
}

export type PromotionPiece = "Q" | "R" | "B" | "N";

/** High-level category used for display + database filtering. Never reveals the move. */
export type PuzzleType =
  | "mate"        // forced checkmate
  | "material"    // win decisive material
  | "fork"
  | "pin"
  | "skewer"
  | "discovered"  // discovered attack / check
  | "promotion"
  | "endgame"     // endgame conversion (K+P, rook endings, …)
  | "defensive"   // the only move that survives
  | "sacrifice"
  | "tactic";     // general combination

export interface ChessPuzzle {
  id: number;
  fen: string;
  /**
   * The forced best line as alternating moves: player, opponent reply, player, …
   * Player moves are at EVEN indices (0, 2, 4); forced opponent replies at ODD indices.
   * A single-element array is a one-move puzzle.
   */
  solution: Move[];
  difficulty: "beginner" | "intermediate" | "advanced" | "expert" | "master" | "grandmaster";
  ratingMin: number;
  ratingMax: number;
  /** Category for DB filtering / post-solve display. */
  puzzleType: PuzzleType;
  /** Short tactic tag (e.g. "fork"). Shown only AFTER the puzzle is over. */
  theme: string;
  /** Vague task shown BEFORE solving — must NOT name a piece, square, or direction. */
  description: string;
  /** Why the solution works. Shown ONLY after the puzzle ends; may name squares. */
  explanation: string;
}

export interface PuzzleRushState {
  phase: "idle" | "playing" | "over";
  timeLeftMs: number;
  score: number;
  solved: number;
  streak: number;
  bestStreak: number;
  currentPuzzle: ChessPuzzle | null;
  puzzleIndex: number;
  lastResult: "correct" | "wrong" | null;
  wrongCount: number;
}

export interface ChessGameState {
  chess: ChessState;
  selectedSquare: Square | null;
  legalMovesForSelected: Move[];
  promotionPending: { from: Square; to: Square } | null;
  playerColor: Color;
  aiDifficulty: AiDifficulty;
  aiThinking: boolean;
  moveHistory: AnnotatedMove[];
  capturedByWhite: Piece[];
  capturedByBlack: Piece[];
  flipped: boolean;
  drawOffered: boolean;
  resigned: boolean;
}

export interface AnnotatedMove extends Move {
  notation: string;
  pieceMoved: Piece;
}

export type AiDifficulty = "beginner" | "easy" | "medium" | "hard" | "expert";

export interface ChessStats {
  rating: number;
  highestRating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  puzzleBestScore: number;
  puzzleTotalScore: number;
  puzzleSolved: number;
  puzzleAttempted: number;
}
