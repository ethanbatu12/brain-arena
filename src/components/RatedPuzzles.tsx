import { useCallback, useEffect, useRef, useState } from "react";
import type { Move, Square } from "../chess/types";
import { legalMoves, loadFen } from "../chess/engine";
import { PUZZLES } from "../chess/puzzles";
import { ratingGainForTime } from "../player/storage";
import type { RatedPuzzleStats } from "../player/types";

interface RatedPuzzlesProps {
  ratedPuzzles: RatedPuzzleStats;
  onExit: () => void;
  onResult: (correct: boolean, elapsedMs: number) => void;
}

type Phase = "idle" | "solving" | "result";

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}


export function RatedPuzzles({ ratedPuzzles, onExit, onResult }: RatedPuzzlesProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [selected, setSelected] = useState<{ sq: Square | null; legal: Move[] }>({ sq: null, legal: [] });
  const [lastResult, setLastResult] = useState<{ correct: boolean; gain: number; elapsedMs: number } | null>(null);
  const startTimeRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const puzzle = PUZZLES[puzzleIndex % PUZZLES.length];
  const puzzleChess = phase !== "idle" ? loadFen(puzzle.fen) : null;

  // Live timer during solving
  useEffect(() => {
    if (phase === "solving") {
      startTimeRef.current = Date.now();
      setElapsed(0);
      tickRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 500);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase, puzzleIndex]);

  // Reset selection when puzzle changes
  useEffect(() => {
    setSelected({ sq: null, legal: [] });
  }, [puzzleIndex]);

  const startPuzzle = useCallback(() => {
    setLastResult(null);
    setPhase("solving");
  }, []);

  const nextPuzzle = useCallback(() => {
    setPuzzleIndex((i) => i + 1);
    setLastResult(null);
    setPhase("solving");
  }, []);

  function handleSquareClick(sq: Square) {
    if (phase !== "solving" || !puzzleChess) return;

    // Try to complete a move
    if (selected.sq !== null) {
      const move = selected.legal.find((m) => m.to === sq);
      if (move) {
        const elapsedMs = Date.now() - startTimeRef.current;
        const { solution } = puzzle;
        const correct =
          move.from === solution.from &&
          move.to === solution.to &&
          (!solution.promotion || move.promotion === solution.promotion);

        const gain = correct ? ratingGainForTime(elapsedMs) : -10;
        setLastResult({ correct, gain, elapsedMs });
        setSelected({ sq: null, legal: [] });
        setPhase("result");
        onResult(correct, elapsedMs);
        return;
      }
    }

    // Select own piece
    const piece = puzzleChess.board[sq];
    if (piece && piece.color === puzzleChess.turn) {
      setSelected({ sq, legal: legalMoves(puzzleChess, sq) });
    } else {
      setSelected({ sq: null, legal: [] });
    }
  }

  const previewGain = ratingGainForTime(elapsed);

  // ── Idle / lobby ──────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Rated Puzzles<span>.</span></h1>
          <button className="app__back" onClick={onExit}>‹ Back</button>
        </div>

        <section className="profile__section">
          <h2 className="profile__section-title">Your Rating</h2>
          <div className="hud">
            <div className="hud__stats">
              <div className="stat">
                <span className="stat__value rated__rating">{ratedPuzzles.rating}</span>
                <span className="stat__label">Current rating</span>
              </div>
              <div className="stat">
                <span className="stat__value">{ratedPuzzles.highestRating}</span>
                <span className="stat__label">Peak rating</span>
              </div>
              <div className="stat">
                <span className="stat__value">{ratedPuzzles.totalCorrect}</span>
                <span className="stat__label">Solved</span>
              </div>
            </div>
          </div>
        </section>

        <section className="profile__section">
          <h2 className="profile__section-title">Rating Gains</h2>
          <ul className="overlay__rules">
            <li>Solve within <b>1 minute</b>: <span className="rated__gain">+20</span> points</li>
            <li>Solve within <b>2 minutes</b>: <span className="rated__gain">+15</span> points</li>
            <li>Solve after <b>2 minutes</b>: <span className="rated__gain">+10</span> points</li>
            <li>Wrong answer: <span className="rated__loss">−10</span> points (rating cannot go below 0)</li>
          </ul>
          <button className="btn btn--primary" style={{ marginTop: "1.5rem" }} onClick={startPuzzle}>
            Start Solving
          </button>
        </section>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (phase === "result" && lastResult) {
    const { correct, gain, elapsedMs } = lastResult;
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Rated Puzzles<span>.</span></h1>
          <button className="app__back" onClick={onExit}>‹ Back</button>
        </div>

        <section className="profile__section">
          <div className={`rated__result-banner rated__result-banner--${correct ? "correct" : "wrong"}`}>
            {correct ? "✓ Correct!" : "✗ Incorrect"}
          </div>

          <div className="hud" style={{ marginTop: "1rem" }}>
            <div className="hud__stats">
              <div className="stat">
                <span className={`stat__value ${gain >= 0 ? "rated__gain" : "rated__loss"}`}>
                  {gain >= 0 ? "+" : ""}{gain}
                </span>
                <span className="stat__label">Rating change</span>
              </div>
              <div className="stat">
                <span className="stat__value">{ratedPuzzles.rating}</span>
                <span className="stat__label">New rating</span>
              </div>
              <div className="stat">
                <span className="stat__value">{formatTime(elapsedMs)}</span>
                <span className="stat__label">Time taken</span>
              </div>
              <div className="stat">
                <span className="stat__value">{ratedPuzzles.totalCompleted}</span>
                <span className="stat__label">Completed</span>
              </div>
            </div>
          </div>

          <p className="chess-puzzle__theme" style={{ marginTop: "1rem" }}>
            Theme: {puzzle.theme} · {puzzle.difficulty}
          </p>
          <p className="chess-puzzle__prompt">{puzzle.description}</p>
          {correct && (
            <p className="chess-puzzle__prompt" style={{ color: "var(--good)" }}>
              Solution: {String.fromCharCode(97 + puzzle.solution.from % 8)}{Math.floor(puzzle.solution.from / 8) + 1}
              {" → "}
              {String.fromCharCode(97 + puzzle.solution.to % 8)}{Math.floor(puzzle.solution.to / 8) + 1}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button className="btn btn--primary" onClick={nextPuzzle}>Next Puzzle</button>
            <button className="btn btn--ghost" onClick={onExit}>Back to Chess</button>
          </div>
        </section>
      </div>
    );
  }

  // ── Solving ────────────────────────────────────────────────────────────────
  const legalTargets = new Set(selected.legal.map((m) => m.to));
  const legalCaptures = new Set(
    selected.legal.filter((m) => puzzleChess!.board[m.to] !== null).map((m) => m.to),
  );
  const ranks = puzzleChess!.turn === "b" ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const files = puzzleChess!.turn === "b" ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  const PIECE_UNICODE: Record<string, string> = {
    wK:"♔",wQ:"♕",wR:"♖",wB:"♗",wN:"♘",wP:"♙",
    bK:"♚",bQ:"♛",bR:"♜",bB:"♝",bN:"♞",bP:"♟",
  };

  return (
    <div className="app__shell chess-puzzle">
      <div className="app__head">
        <h1 className="app__logo">Rated Puzzles<span>.</span></h1>
        <button className="app__back" onClick={onExit}>‹ Back</button>
      </div>

      <div className="rated__header">
        <div className="stat">
          <span className="stat__value rated__rating">{ratedPuzzles.rating}</span>
          <span className="stat__label">Rating</span>
        </div>
        <div className="rated__timer-block">
          <span className="rated__elapsed">{formatTime(elapsed)}</span>
          <span className="rated__potential">
            Solving now: <span className="rated__gain">+{previewGain}</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat__value">{ratedPuzzles.totalCompleted}</span>
          <span className="stat__label">Completed</span>
        </div>
      </div>

      <p className="chess-puzzle__prompt">
        {puzzleChess!.turn === "w" ? "White" : "Black"} to move — <em>{puzzle.description}</em>
      </p>

      {/* Inline board (reusing chess-board styles) */}
      <div className="chess-board" role="grid" aria-label="Chess board">
        {ranks.map((r) => (
          <div key={r} className="chess-board__rank" role="row">
            {files.map((f) => {
              const sqIdx = r * 8 + f;
              const piece = puzzleChess!.board[sqIdx];
              const isLight = (f + r) % 2 === 1;
              const isSelected = sqIdx === selected.sq;
              const isLegal = legalTargets.has(sqIdx);
              const isCapture = legalCaptures.has(sqIdx);
              const classes = [
                "chess-board__sq",
                isLight ? "chess-board__sq--light" : "chess-board__sq--dark",
                isSelected ? "chess-board__sq--selected" : "",
              ].filter(Boolean).join(" ");
              return (
                <div key={sqIdx} className={classes} onClick={() => handleSquareClick(sqIdx)} role="gridcell">
                  {isLegal && !isCapture && <div className="chess-board__dot" />}
                  {isCapture && <div className="chess-board__capture-ring" />}
                  {piece && (
                    <span className={`chess-board__piece chess-board__piece--${piece.color}`} aria-hidden>
                      {PIECE_UNICODE[piece.color + piece.type]}
                    </span>
                  )}
                  {f === (puzzleChess!.turn === "b" ? 7 : 0) && (
                    <span className="chess-board__coord chess-board__coord--rank">{r + 1}</span>
                  )}
                  {r === (puzzleChess!.turn === "b" ? 7 : 0) && (
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

      <p className="chess-puzzle__theme">
        Puzzle #{(puzzleIndex % PUZZLES.length) + 1} · {puzzle.theme} · {puzzle.difficulty}
      </p>
    </div>
  );
}
