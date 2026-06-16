import type { Board, Color, Move, Piece, Square } from "../chess/types";
import { SQ, squareName } from "../chess/engine";

interface ChessBoardProps {
  board: Board;
  flipped: boolean;
  selectedSquare: Square | null;
  legalMoves: Move[];
  lastMove: Move | null;
  onSquareClick: (sq: Square) => void;
  inCheck: boolean;
  turn: Color;
}

const PIECE_UNICODE: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

function pieceSymbol(piece: Piece): string {
  return PIECE_UNICODE[piece.color + piece.type] ?? "";
}

export function ChessBoard({
  board,
  flipped,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
  inCheck,
  turn,
}: ChessBoardProps) {
  const legalTargets = new Set(legalMoves.map((m) => m.to));
  const legalCaptures = new Set(
    legalMoves
      .filter((m) => board[m.to] !== null)
      .map((m) => m.to),
  );

  const kingSquare = (() => {
    if (!inCheck) return -1;
    for (let sq = 0; sq < 64; sq++) {
      const p = board[sq];
      if (p && p.type === "K" && p.color === turn) return sq;
    }
    return -1;
  })();

  const ranks = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const files = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  return (
    <div className="chess-board" role="grid" aria-label="Chess board">
      {ranks.map((r) => (
        <div key={r} className="chess-board__rank" role="row">
          {files.map((f) => {
            const sq = SQ(f, r);
            const piece = board[sq];
            const isLight = (f + r) % 2 === 1;
            const isSelected = sq === selectedSquare;
            const isLegal = legalTargets.has(sq);
            const isCapture = legalCaptures.has(sq);
            const isLastFrom = lastMove?.from === sq;
            const isLastTo = lastMove?.to === sq;
            const isCheck = sq === kingSquare;

            const classes = [
              "chess-board__sq",
              isLight ? "chess-board__sq--light" : "chess-board__sq--dark",
              isSelected ? "chess-board__sq--selected" : "",
              (isLastFrom || isLastTo) ? "chess-board__sq--last" : "",
              isCheck ? "chess-board__sq--check" : "",
            ].filter(Boolean).join(" ");

            return (
              <div
                key={sq}
                className={classes}
                role="gridcell"
                aria-label={squareName(sq) + (piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : "")}
                onClick={() => onSquareClick(sq)}
              >
                {isLegal && !isCapture && <div className="chess-board__dot" />}
                {isCapture && <div className="chess-board__capture-ring" />}
                {piece && (
                  <span
                    className={`chess-board__piece chess-board__piece--${piece.color}`}
                    aria-hidden
                  >
                    {pieceSymbol(piece)}
                  </span>
                )}
                {f === (flipped ? 7 : 0) && (
                  <span className="chess-board__coord chess-board__coord--rank">{r + 1}</span>
                )}
                {r === (flipped ? 7 : 0) && (
                  <span className="chess-board__coord chess-board__coord--file">
                    {String.fromCharCode(97 + f)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
