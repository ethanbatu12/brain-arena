import { useCallback, useEffect, useReducer, useRef } from "react";
import type { AiDifficulty, Color } from "../chess/types";
import { getBestMove } from "../chess/ai";
import { chessReduce, initialChessGameState } from "../chess/reducer";
import { ChessBoard } from "./ChessBoard";

const PIECE_UNICODE: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

interface FullChessGameProps {
  onExit: () => void;
}

export function FullChessGame({ onExit }: FullChessGameProps) {
  const [setup, setSetup] = useReducer(
    (s: { phase: "setup" | "playing"; color: Color; difficulty: AiDifficulty },
     a: Partial<typeof s>) => ({ ...s, ...a }),
    { phase: "setup", color: "w", difficulty: "medium" },
  );

  const [game, dispatch] = useReducer(
    chessReduce,
    initialChessGameState("w", "medium"),
  );

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = useCallback(() => {
    dispatch({ type: "RESET", playerColor: setup.color, difficulty: setup.difficulty });
    setSetup({ phase: "playing" });
  }, [setup.color, setup.difficulty]);

  // AI move trigger
  useEffect(() => {
    if (setup.phase !== "playing") return;
    const { chess, playerColor, aiDifficulty } = game;
    if (chess.turn === playerColor) return;
    if (chess.status === "checkmate" || chess.status === "stalemate" || chess.status === "draw") return;

    aiTimerRef.current = setTimeout(() => {
      const move = getBestMove(chess, aiDifficulty);
      if (move) dispatch({ type: "AI_MOVE", move });
    }, 400);

    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [game.chess, game.playerColor, game.aiDifficulty, setup.phase]);

  if (setup.phase === "setup") {
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Full Chess<span>.</span></h1>
          <button className="app__back" onClick={onExit}>‹ Back</button>
        </div>
        <section className="profile__section">
          <h2 className="profile__section-title">Choose your color</h2>
          <div className="chess-setup__colors">
            {(["w", "b", "r"] as const).map((c) => (
              <button
                key={c}
                className={`chess-setup__color-btn ${setup.color === c ? "chess-setup__color-btn--active" : ""}`}
                onClick={() => setSetup({ color: c === "r" ? (Math.random() < 0.5 ? "w" : "b") : c })}
              >
                {c === "w" ? "♔ White" : c === "b" ? "♚ Black" : "⚄ Random"}
              </button>
            ))}
          </div>
        </section>
        <section className="profile__section">
          <h2 className="profile__section-title">Difficulty</h2>
          <div className="chess-setup__difficulties">
            {(["beginner","easy","medium","hard","expert"] as AiDifficulty[]).map((d) => (
              <button
                key={d}
                className={`chess-setup__diff-btn ${setup.difficulty === d ? "chess-setup__diff-btn--active" : ""}`}
                onClick={() => setSetup({ difficulty: d })}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </section>
        <button className="btn btn--primary" style={{ marginTop: "1.5rem" }} onClick={startGame}>
          Start Game
        </button>
      </div>
    );
  }

  const { chess, selectedSquare, legalMovesForSelected, promotionPending,
    moveHistory, capturedByWhite, capturedByBlack, flipped, drawOffered } = game;
  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;
  const isOver = chess.status === "checkmate" || chess.status === "stalemate" || chess.status === "draw";
  const isPlayerTurn = chess.turn === game.playerColor;

  function statusText() {
    if (chess.status === "checkmate") {
      return chess.winner === game.playerColor ? "You win! Checkmate! 🎉" : "You lose. Checkmate.";
    }
    if (chess.status === "stalemate") return "Draw — Stalemate.";
    if (chess.status === "draw") return `Draw — ${chess.drawReason}.`;
    if (game.resigned) return "You resigned.";
    if (chess.status === "check") return isPlayerTurn ? "You are in check!" : "Opponent in check!";
    return isPlayerTurn ? "Your turn" : "AI thinking…";
  }

  return (
    <div className="app__shell chess-game">
      <div className="app__head">
        <h1 className="app__logo">Chess<span>.</span></h1>
        <button className="app__back" onClick={onExit}>‹ Back</button>
      </div>

      <div className="chess-game__layout">
        {/* Left: captured + board */}
        <div className="chess-game__board-col">
          <div className="chess-game__captured">
            {(flipped ? capturedByWhite : capturedByBlack).map((p, i) => (
              <span key={i} className="chess-game__cap-piece">
                {PIECE_UNICODE[p.color + p.type]}
              </span>
            ))}
          </div>

          <ChessBoard
            board={chess.board}
            flipped={flipped}
            selectedSquare={selectedSquare}
            legalMoves={legalMovesForSelected}
            lastMove={lastMove}
            onSquareClick={(sq) => dispatch({ type: "SELECT_SQUARE", square: sq })}
            inCheck={chess.status === "check"}
            turn={chess.turn}
          />

          <div className="chess-game__captured">
            {(flipped ? capturedByBlack : capturedByWhite).map((p, i) => (
              <span key={i} className="chess-game__cap-piece">
                {PIECE_UNICODE[p.color + p.type]}
              </span>
            ))}
          </div>

          <p className="chess-game__status">{statusText()}</p>
        </div>

        {/* Right: controls + move history */}
        <div className="chess-game__sidebar">
          <div className="chess-game__controls">
            <button className="btn btn--ghost" onClick={() => dispatch({ type: "FLIP_BOARD" })}>
              ⇅ Flip
            </button>
            {!isOver && (
              <>
                <button className="btn btn--ghost" onClick={() => {
                  if (confirm("Resign the game?")) dispatch({ type: "RESIGN" });
                }}>
                  🏳 Resign
                </button>
                <button className="btn btn--ghost" onClick={() => dispatch({ type: "OFFER_DRAW" })}>
                  🤝 Draw
                </button>
              </>
            )}
            <button className="btn btn--ghost" onClick={startGame}>↺ New Game</button>
          </div>

          {drawOffered && (
            <div className="chess-game__draw-offer">
              <p>Draw offered — accept?</p>
              <button className="btn btn--primary" onClick={() => dispatch({ type: "ACCEPT_DRAW" })}>Accept</button>
              <button className="btn btn--ghost" onClick={() => dispatch({ type: "DECLINE_DRAW" })}>Decline</button>
            </div>
          )}

          <div className="chess-game__history">
            <h3 className="chess-game__history-title">Moves</h3>
            <div className="chess-game__history-list">
              {moveHistory.map((m, i) => (
                i % 2 === 0 ? (
                  <div key={i} className="chess-game__history-row">
                    <span className="chess-game__history-num">{Math.floor(i / 2) + 1}.</span>
                    <span>{m.notation}</span>
                    {moveHistory[i + 1] && <span>{moveHistory[i + 1].notation}</span>}
                  </div>
                ) : null
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Promotion modal */}
      {promotionPending && (
        <div className="chess-promo__overlay">
          <div className="chess-promo__modal">
            <p>Promote pawn to:</p>
            <div className="chess-promo__choices">
              {(["Q","R","B","N"] as const).map((p) => (
                <button
                  key={p}
                  className="chess-promo__btn"
                  onClick={() => dispatch({ type: "PROMOTE", piece: p })}
                >
                  {PIECE_UNICODE[game.playerColor + p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
