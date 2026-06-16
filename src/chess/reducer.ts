import type {
  AiDifficulty,
  AnnotatedMove,
  ChessGameState,
  ChessState,
  Color,
  Move,
  Piece,
  PuzzleRushState,
  Square,
} from "./types";
import {
  allLegalMoves,
  initialChessState,
  legalMoves,
  makeMove,
  toAlgebraic,
} from "./engine";
import { getPuzzleSequence } from "./puzzles";

// ---------------------------------------------------------------------------
// Full Chess Game
// ---------------------------------------------------------------------------

export type ChessAction =
  | { type: "SELECT_SQUARE"; square: Square }
  | { type: "MOVE"; move: Move }
  | { type: "PROMOTE"; piece: "Q" | "R" | "B" | "N" }
  | { type: "FLIP_BOARD" }
  | { type: "RESIGN" }
  | { type: "OFFER_DRAW" }
  | { type: "ACCEPT_DRAW" }
  | { type: "DECLINE_DRAW" }
  | { type: "AI_MOVE"; move: Move }
  | { type: "RESET"; playerColor: Color; difficulty: AiDifficulty };

export function initialChessGameState(
  playerColor: Color = "w",
  difficulty: AiDifficulty = "medium",
): ChessGameState {
  return {
    chess: initialChessState(),
    selectedSquare: null,
    legalMovesForSelected: [],
    promotionPending: null,
    playerColor,
    aiDifficulty: difficulty,
    aiThinking: false,
    moveHistory: [],
    capturedByWhite: [],
    capturedByBlack: [],
    flipped: playerColor === "b",
    drawOffered: false,
    resigned: false,
  };
}

function collectCaptures(
  state: ChessGameState,
  move: Move,
  chess: ChessState,
): { capturedByWhite: Piece[]; capturedByBlack: Piece[] } {
  const capturedByWhite = [...state.capturedByWhite];
  const capturedByBlack = [...state.capturedByBlack];
  const captured = chess.board[move.to];
  if (captured) {
    if (captured.color === "b") capturedByWhite.push(captured);
    else capturedByBlack.push(captured);
  }
  // En passant pawn
  if (chess.board[move.from]?.type === "P" && move.to === chess.enPassant && chess.enPassant !== null) {
    const pawn: Piece = { type: "P", color: chess.turn === "w" ? "b" : "w" };
    if (chess.turn === "w") capturedByWhite.push(pawn);
    else capturedByBlack.push(pawn);
  }
  return { capturedByWhite, capturedByBlack };
}

export function chessReduce(state: ChessGameState, action: ChessAction): ChessGameState {
  switch (action.type) {
    case "RESET":
      return initialChessGameState(action.playerColor, action.difficulty);

    case "FLIP_BOARD":
      return { ...state, flipped: !state.flipped };

    case "RESIGN":
      return {
        ...state,
        resigned: true,
        chess: {
          ...state.chess,
          status: "checkmate",
          winner: state.chess.turn === "w" ? "b" : "w",
        },
      };

    case "OFFER_DRAW":
      return { ...state, drawOffered: true };

    case "ACCEPT_DRAW":
      return {
        ...state,
        drawOffered: false,
        chess: { ...state.chess, status: "draw", drawReason: "draw by agreement" },
      };

    case "DECLINE_DRAW":
      return { ...state, drawOffered: false };

    case "SELECT_SQUARE": {
      const { square } = action;
      const chess = state.chess;
      const piece = chess.board[square];

      // If promotion is pending, ignore
      if (state.promotionPending) return state;

      // Game over
      if (chess.status === "checkmate" || chess.status === "stalemate" || chess.status === "draw") {
        return state;
      }

      // Not player's turn
      if (chess.turn !== state.playerColor) return state;

      // Clicking a legal move destination
      if (state.selectedSquare !== null && state.legalMovesForSelected.length > 0) {
        const move = state.legalMovesForSelected.find((m) => m.to === square);
        if (move) {
          // Promotion?
          if (move.promotion !== undefined || (chess.board[state.selectedSquare]?.type === "P" &&
            ((chess.turn === "w" && Math.floor(square / 8) === 7) ||
             (chess.turn === "b" && Math.floor(square / 8) === 0)))) {
            return {
              ...state,
              promotionPending: { from: state.selectedSquare, to: square },
              selectedSquare: null,
              legalMovesForSelected: [],
            };
          }
          return chessReduce(state, { type: "MOVE", move });
        }
      }

      // Select own piece
      if (piece && piece.color === chess.turn) {
        const legal = legalMoves(chess, square);
        return { ...state, selectedSquare: square, legalMovesForSelected: legal };
      }

      // Deselect
      return { ...state, selectedSquare: null, legalMovesForSelected: [] };
    }

    case "PROMOTE": {
      if (!state.promotionPending) return state;
      const { from, to } = state.promotionPending;
      const move: Move = { from, to, promotion: action.piece };
      return chessReduce({ ...state, promotionPending: null }, { type: "MOVE", move });
    }

    case "MOVE": {
      const { move } = action;
      const chess = state.chess;
      const legal = allLegalMoves(chess);
      const isLegal = legal.some((m) => m.from === move.from && m.to === move.to &&
        m.promotion === move.promotion);
      if (!isLegal) return state;

      const { capturedByWhite, capturedByBlack } = collectCaptures(state, move, chess);
      const notation = toAlgebraic(chess, move);
      const pieceMoved = chess.board[move.from]!;
      const nextChess = makeMove(chess, move);
      const annotated: AnnotatedMove = { ...move, notation, pieceMoved };

      return {
        ...state,
        chess: nextChess,
        selectedSquare: null,
        legalMovesForSelected: [],
        promotionPending: null,
        moveHistory: [...state.moveHistory, annotated],
        capturedByWhite,
        capturedByBlack,
        aiThinking: nextChess.turn !== state.playerColor &&
          nextChess.status === "playing" || nextChess.status === "check",
      };
    }

    case "AI_MOVE": {
      return chessReduce(
        { ...state, aiThinking: false },
        { type: "MOVE", move: action.move },
      );
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Puzzle Rush
// ---------------------------------------------------------------------------

export const PUZZLE_RUSH_MS = 60_000;
const POINTS_PER_PUZZLE: Record<string, number> = {
  beginner:     100,
  intermediate: 150,
  advanced:     200,
  expert:       300,
  master:       400,
  grandmaster:  500,
};
const STREAK_BONUS = 50;

export type PuzzleRushAction =
  | { type: "START" }
  | { type: "SUBMIT_MOVE"; move: Move }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };

const SEQUENCE = getPuzzleSequence();

export function puzzleRushInitialState(): PuzzleRushState {
  return {
    phase: "idle",
    timeLeftMs: PUZZLE_RUSH_MS,
    score: 0,
    solved: 0,
    streak: 0,
    bestStreak: 0,
    currentPuzzle: null,
    puzzleIndex: 0,
    lastResult: null,
    wrongCount: 0,
  };
}

export function puzzleRushReduce(state: PuzzleRushState, action: PuzzleRushAction): PuzzleRushState {
  switch (action.type) {
    case "RESET":
      return puzzleRushInitialState();

    case "START": {
      const puzzle = SEQUENCE[0] ?? null;
      return {
        ...puzzleRushInitialState(),
        phase: "playing",
        currentPuzzle: puzzle,
        puzzleIndex: 0,
      };
    }

    case "TICK": {
      if (state.phase !== "playing") return state;
      const timeLeftMs = Math.max(0, state.timeLeftMs - action.deltaMs);
      if (timeLeftMs === 0) return { ...state, timeLeftMs: 0, phase: "over" };
      return { ...state, timeLeftMs };
    }

    case "SUBMIT_MOVE": {
      if (state.phase !== "playing" || !state.currentPuzzle) return state;
      const { solution } = state.currentPuzzle;
      const correct =
        action.move.from === solution.from &&
        action.move.to === solution.to &&
        (!solution.promotion || action.move.promotion === solution.promotion);

      if (correct) {
        const streak = state.streak + 1;
        const base = POINTS_PER_PUZZLE[state.currentPuzzle.difficulty] ?? 100;
        const bonus = streak >= 3 ? STREAK_BONUS : 0;
        const score = state.score + base + bonus;
        const solved = state.solved + 1;
        const nextIndex = (state.puzzleIndex + 1) % SEQUENCE.length;
        return {
          ...state,
          score,
          solved,
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          lastResult: "correct",
          currentPuzzle: SEQUENCE[nextIndex] ?? null,
          puzzleIndex: nextIndex,
          wrongCount: 0,
        };
      } else {
        return {
          ...state,
          streak: 0,
          lastResult: "wrong",
          wrongCount: state.wrongCount + 1,
        };
      }
    }

    default:
      return state;
  }
}
