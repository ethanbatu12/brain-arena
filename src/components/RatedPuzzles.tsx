import { useCallback, useEffect, useRef, useState } from "react";
import type { ChessPuzzle, Move, Square } from "../chess/types";
import { legalMoves, loadFen } from "../chess/engine";
import { getPuzzleForRating, tierForRating } from "../chess/puzzles";
import { ratingGainForTime } from "../player/storage";
import type { RatedPuzzleStats } from "../player/types";

interface RatedPuzzlesProps {
  ratedPuzzles: RatedPuzzleStats;
  onExit: () => void;
  onResult: (correct: boolean, elapsedMs: number) => void;
}

type Phase = "idle" | "solving" | "result";

const TIER_LABELS: Record<string, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
  expert:       "Expert",
  master:       "Master",
  grandmaster:  "Grandmaster",
};

const TIER_COLORS: Record<string, string> = {
  beginner:     "#22c55e",
  intermediate: "#84cc16",
  advanced:     "#eab308",
  expert:       "#f97316",
  master:       "#ef4444",
  grandmaster:  "#a855f7",
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  beginner:     "Simple checkmates and free pieces — 1–2 move tactics.",
  intermediate: "Forks, pins, and skewers — light 2–3 move combinations.",
  advanced:     "Multi-step tactics, sacrifices, and defensive awareness.",
  expert:       "Deep calculation — 3–6 move combinations and hidden tactics.",
  master:       "Precise combinations punishing every small inaccuracy.",
  grandmaster:  "Long forcing lines requiring near-perfect foresight.",
};

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function squareName(idx: number): string {
  return String.fromCharCode(97 + (idx % 8)) + (Math.floor(idx / 8) + 1);
}

const PIECE_UNICODE: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

export function RatedPuzzles({ ratedPuzzles, onExit, onResult }: RatedPuzzlesProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle | null>(null);
  const [selected, setSelected] = useState<{ sq: Square | null; legal: Move[] }>({ sq: null, legal: [] });
  const [lastResult, setLastResult] = useState<{ correct: boolean; gain: number; elapsedMs: number } | null>(null);
  const startTimeRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usedIdsRef = useRef<Set<number>>(new Set());

  const puzzleChess = phase === "solving" && currentPuzzle ? loadFen(currentPuzzle.fen) : null;

  // Pick a puzzle appropriate for the current rating, avoiding recent repeats
  const pickPuzzle = useCallback((rating: number): ChessPuzzle => {
    const puzzle = getPuzzleForRating(rating, usedIdsRef.current);
    usedIdsRef.current.add(puzzle.id);
    // Reset used set when it grows large so puzzles can repeat after a long session
    if (usedIdsRef.current.size >= 8) usedIdsRef.current.clear();
    return puzzle;
  }, []);

  // Live timer
  useEffect(() => {
    if (phase === "solving") {
      startTimeRef.current = Date.now();
      setElapsed(0);
      tickRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 500);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase, currentPuzzle]);

  // Reset selection when puzzle changes
  useEffect(() => {
    setSelected({ sq: null, legal: [] });
  }, [currentPuzzle]);

  const startPuzzle = useCallback(() => {
    setCurrentPuzzle(pickPuzzle(ratedPuzzles.rating));
    setLastResult(null);
    setPhase("solving");
  }, [pickPuzzle, ratedPuzzles.rating]);

  // Rating is already updated in ratedPuzzles prop by the time user clicks Next
  const nextPuzzle = useCallback(() => {
    setCurrentPuzzle(pickPuzzle(ratedPuzzles.rating));
    setLastResult(null);
    setPhase("solving");
  }, [pickPuzzle, ratedPuzzles.rating]);

  function handleSquareClick(sq: Square) {
    if (phase !== "solving" || !puzzleChess || !currentPuzzle) return;

    if (selected.sq !== null) {
      const move = selected.legal.find((m) => m.to === sq);
      if (move) {
        const elapsedMs = Date.now() - startTimeRef.current;
        const { solution } = currentPuzzle;
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

    const piece = puzzleChess.board[sq];
    if (piece && piece.color === puzzleChess.turn) {
      setSelected({ sq, legal: legalMoves(puzzleChess, sq) });
    } else {
      setSelected({ sq: null, legal: [] });
    }
  }

  const tier = tierForRating(ratedPuzzles.rating);
  const tierLabel = TIER_LABELS[tier.difficulty];
  const tierColor = TIER_COLORS[tier.difficulty];
  const previewGain = ratingGainForTime(elapsed);

  // ── Idle ─────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="app__shell">
        <div className="app__head">
          <h1 className="app__logo">Rated Puzzles<span>.</span></h1>
          <button className="app__back" onClick={onExit}>‹ Back</button>
        </div>

        <section className="profile__section">
          <h2 className="profile__section-title">Your Rating</h2>
          <div className="rated__idle-hero">
            <div className="rated__tier-badge" style={{ borderColor: tierColor, color: tierColor }}>
              {tierLabel}
            </div>
            <div className="hud__stats" style={{ justifyContent: "center" }}>
              <div className="stat">
                <span className="stat__value" style={{ color: tierColor, fontSize: "2.5rem" }}>
                  {ratedPuzzles.rating}
                </span>
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
            <p className="rated__tier-desc">{TIER_DESCRIPTIONS[tier.difficulty]}</p>
          </div>
        </section>

        <section className="profile__section">
          <h2 className="profile__section-title">Difficulty Tiers</h2>
          <div className="rated__tier-table">
            {Object.entries(TIER_LABELS).map(([key, label]) => {
              const t = { beginner: "0–400", intermediate: "401–800", advanced: "801–1200", expert: "1201–1600", master: "1601–2000", grandmaster: "2001+" }[key];
              const active = key === tier.difficulty;
              return (
                <div key={key} className={`rated__tier-row${active ? " rated__tier-row--active" : ""}`}
                  style={active ? { borderColor: TIER_COLORS[key], background: `${TIER_COLORS[key]}18` } : undefined}>
                  <span className="rated__tier-dot" style={{ background: TIER_COLORS[key] }} />
                  <span className="rated__tier-name" style={active ? { color: TIER_COLORS[key] } : undefined}>{label}</span>
                  <span className="rated__tier-range">{t}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="profile__section">
          <h2 className="profile__section-title">Rating Gains</h2>
          <ul className="overlay__rules">
            <li>Solve within <b>1 minute</b>: <span className="rated__gain">+20</span></li>
            <li>Solve within <b>2 minutes</b>: <span className="rated__gain">+15</span></li>
            <li>Solve after <b>2 minutes</b>: <span className="rated__gain">+10</span></li>
            <li>Wrong answer: <span className="rated__loss">−10</span> (floor 0)</li>
          </ul>
          <button className="btn btn--primary" style={{ marginTop: "1.5rem" }} onClick={startPuzzle}>
            Start Solving
          </button>
        </section>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (phase === "result" && lastResult && currentPuzzle) {
    const { correct, gain, elapsedMs } = lastResult;
    const newTier = tierForRating(ratedPuzzles.rating);
    const tierChanged = newTier.difficulty !== tier.difficulty;

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
                <span className="stat__value" style={{ color: TIER_COLORS[newTier.difficulty] }}>
                  {ratedPuzzles.rating}
                </span>
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

          {tierChanged && (
            <div className="rated__tier-change" style={{ borderColor: TIER_COLORS[newTier.difficulty] }}>
              <span style={{ color: TIER_COLORS[newTier.difficulty] }}>
                Tier changed → {TIER_LABELS[newTier.difficulty]}
              </span>
              <span className="rated__tier-desc">{TIER_DESCRIPTIONS[newTier.difficulty]}</span>
            </div>
          )}

          <p className="chess-puzzle__theme" style={{ marginTop: "1rem" }}>
            Theme: {currentPuzzle.theme} · {TIER_LABELS[currentPuzzle.difficulty]}
          </p>
          <p className="chess-puzzle__prompt">{currentPuzzle.description}</p>
          {correct && (
            <p className="chess-puzzle__prompt" style={{ color: "var(--good)" }}>
              Solution: {squareName(currentPuzzle.solution.from)} → {squareName(currentPuzzle.solution.to)}
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

  // ── Solving ───────────────────────────────────────────────────────────────
  if (!puzzleChess || !currentPuzzle) return null;

  const legalTargets = new Set(selected.legal.map((m) => m.to));
  const legalCaptures = new Set(selected.legal.filter((m) => puzzleChess.board[m.to] !== null).map((m) => m.to));
  const flipped = puzzleChess.turn === "b";
  const ranks = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const files = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  return (
    <div className="app__shell chess-puzzle">
      <div className="app__head">
        <h1 className="app__logo">Rated Puzzles<span>.</span></h1>
        <button className="app__back" onClick={onExit}>‹ Back</button>
      </div>

      <div className="rated__header">
        <div className="stat">
          <span className="stat__value" style={{ color: tierColor }}>{ratedPuzzles.rating}</span>
          <span className="stat__label" style={{ color: tierColor }}>{tierLabel}</span>
        </div>
        <div className="rated__timer-block">
          <span className="rated__elapsed">{formatTime(elapsed)}</span>
          <span className="rated__potential">
            Solving now: <span className="rated__gain">+{previewGain}</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat__value">{ratedPuzzles.totalCompleted}</span>
          <span className="stat__label">Done</span>
        </div>
      </div>

      <p className="chess-puzzle__prompt">
        {puzzleChess.turn === "w" ? "White" : "Black"} to move — <em>{currentPuzzle.description}</em>
      </p>

      <div className="chess-board" role="grid" aria-label="Chess board">
        {ranks.map((r) => (
          <div key={r} className="chess-board__rank" role="row">
            {files.map((f) => {
              const sqIdx = r * 8 + f;
              const piece = puzzleChess.board[sqIdx];
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

      <p className="chess-puzzle__theme" style={{ color: tierColor }}>
        {TIER_LABELS[currentPuzzle.difficulty]} · {currentPuzzle.theme}
      </p>
    </div>
  );
}
