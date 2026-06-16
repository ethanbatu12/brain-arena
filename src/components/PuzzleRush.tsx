import { useEffect, useReducer, useRef } from "react";
import type { Move, Square } from "../chess/types";
import { legalMoves, loadFen } from "../chess/engine";
import { puzzleRushInitialState, puzzleRushReduce, PUZZLE_RUSH_MS } from "../chess/reducer";
import { ChessBoard } from "./ChessBoard";

interface PuzzleRushProps {
  onExit: () => void;
}

export function PuzzleRush({ onExit }: PuzzleRushProps) {
  const [state, dispatch] = useReducer(puzzleRushReduce, puzzleRushInitialState());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selected, setSelected] = useReducer(
    (_prev: { sq: Square | null; legal: Move[] }, a: { sq: Square | null; legal: Move[] }) => a,
    { sq: null, legal: [] },
  );

  const puzzleChess = state.currentPuzzle ? loadFen(state.currentPuzzle.fen) : null;

  // Tick timer
  useEffect(() => {
    if (state.phase === "playing") {
      tickRef.current = setInterval(() => dispatch({ type: "TICK", deltaMs: 100 }), 100);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [state.phase]);

  // Reset selection when puzzle changes
  useEffect(() => {
    setSelected({ sq: null, legal: [] });
  }, [state.currentPuzzle?.id]);

  function handleSquareClick(sq: Square) {
    if (state.phase !== "playing" || !puzzleChess || !state.currentPuzzle) return;

    const piece = puzzleChess.board[sq];
    const solutionColor = puzzleChess.turn;

    // Try to make a move
    if (selected.sq !== null) {
      const move = selected.legal.find((m) => m.to === sq);
      if (move) {
        dispatch({ type: "SUBMIT_MOVE", move });
        setSelected({ sq: null, legal: [] });
        return;
      }
    }

    // Select piece of the side to move
    if (piece && piece.color === solutionColor) {
      const legal = legalMoves(puzzleChess, sq);
      setSelected({ sq, legal });
    } else {
      setSelected({ sq: null, legal: [] });
    }
  }

  const pct = state.timeLeftMs / PUZZLE_RUSH_MS;
  const timeColor = pct > 0.5 ? "var(--good)" : pct > 0.25 ? "var(--warn, #f59e0b)" : "var(--bad)";

  if (state.phase === "idle") {
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Puzzle Rush<span>.</span></h1>
          <button className="app__back" onClick={onExit}>‹ Back</button>
        </div>
        <section className="profile__section">
          <h2 className="profile__section-title">How it works</h2>
          <ul className="overlay__rules">
            <li>60 seconds to solve as many chess puzzles as possible</li>
            <li>Find the best move — checkmates, winning tactics, forks, pins, skewers</li>
            <li>Puzzles get harder as you progress</li>
            <li>Streaks of 3+ correct in a row earn a bonus</li>
          </ul>
          <button className="btn btn--primary" style={{ marginTop: "1.5rem" }}
            onClick={() => dispatch({ type: "START" })}>
            Start · 60 seconds
          </button>
        </section>
      </div>
    );
  }

  if (state.phase === "over") {
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Puzzle Rush<span>.</span></h1>
          <button className="app__back" onClick={onExit}>‹ Back</button>
        </div>
        <section className="profile__section">
          <h2 className="profile__section-title">Time's up!</h2>
          <div className="hud">
            <div className="hud__stats">
              <div className="stat"><span className="stat__value">{state.score}</span><span className="stat__label">Score</span></div>
              <div className="stat"><span className="stat__value">{state.solved}</span><span className="stat__label">Solved</span></div>
              <div className="stat"><span className="stat__value">{state.bestStreak}</span><span className="stat__label">Best streak</span></div>
            </div>
          </div>
          <button className="btn btn--primary" style={{ marginTop: "1.5rem" }}
            onClick={() => dispatch({ type: "RESET" })}>
            Play Again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="app__shell chess-puzzle">
      <div className="app__head">
        <h1 className="app__logo">Puzzle Rush<span>.</span></h1>
        <button className="app__back" onClick={onExit}>‹ Back</button>
      </div>

      <div className="chess-puzzle__hud">
        <div className="stat"><span className="stat__value">{state.score}</span><span className="stat__label">Score</span></div>
        <div className="chess-puzzle__timer">
          <div className="chess-puzzle__timer-bar" style={{ width: `${pct * 100}%`, background: timeColor }} />
          <span className="chess-puzzle__timer-text">{Math.ceil(state.timeLeftMs / 1000)}s</span>
        </div>
        <div className="stat"><span className="stat__value">{state.solved}</span><span className="stat__label">Solved</span></div>
      </div>

      {state.currentPuzzle && puzzleChess && (
        <>
          <p className="chess-puzzle__prompt">
            {puzzleChess.turn === "w" ? "White" : "Black"} to move —{" "}
            <em>{state.currentPuzzle.description}</em>
          </p>
          {state.lastResult && (
            <p className={`chess-puzzle__result chess-puzzle__result--${state.lastResult}`}>
              {state.lastResult === "correct" ? "✓ Correct!" : "✗ Wrong — try again"}
            </p>
          )}
          <ChessBoard
            board={puzzleChess.board}
            flipped={puzzleChess.turn === "b"}
            selectedSquare={selected.sq}
            legalMoves={selected.legal}
            lastMove={null}
            onSquareClick={handleSquareClick}
            inCheck={puzzleChess.status === "check"}
            turn={puzzleChess.turn}
          />
          <p className="chess-puzzle__theme">Theme: {state.currentPuzzle.theme} · {state.currentPuzzle.difficulty}</p>
        </>
      )}
    </div>
  );
}
