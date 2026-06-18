import { useCallback, useEffect, useRef, useState } from "react";
import type { ChessPuzzle, ChessState, Color, Move, Square } from "../chess/types";
import { legalMoves, loadFen, makeMove, toFen } from "../chess/engine";
import { getPuzzleForRating, tierForRating } from "../chess/puzzles";
import { getStockfish } from "../chess/StockfishService";
import { ratingGainForTime } from "../player/storage";
import type { RatedPuzzleStats } from "../player/types";

const VERIFY_DEPTH = 18;

interface RatedPuzzlesProps {
  ratedPuzzles: RatedPuzzleStats;
  onExit: () => void;
  onResult: (correct: boolean, elapsedMs: number, puzzleId?: number) => void;
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

const TIER_RANGES: Record<string, string> = {
  beginner: "0–400", intermediate: "401–800", advanced: "801–1200",
  expert: "1201–1600", master: "1601–2000", grandmaster: "2001+",
};

const REVEAL_MS = 2500;   // how long the correct move stays highlighted after a miss
const REPLY_MS = 600;     // delay before the forced opponent reply is played

const PIECE_UNICODE: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
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

function solutionLine(p: ChessPuzzle): string {
  return p.solution
    .map((m) => `${squareName(m.from)}→${squareName(m.to)}${m.promotion ? "=" + m.promotion : ""}`)
    .join("   ");
}

export function RatedPuzzles({ ratedPuzzles, onExit, onResult }: RatedPuzzlesProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle | null>(null);
  const [gameState, setGameState] = useState<ChessState | null>(null);
  const [orientation, setOrientation] = useState<Color>("w");
  const [stepIndex, setStepIndex] = useState(0);
  const [showingSolution, setShowingSolution] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<{ sq: Square | null; legal: Move[] }>({ sq: null, legal: [] });
  const [lastResult, setLastResult] = useState<{ correct: boolean; gain: number; elapsedMs: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const usedIdsRef = useRef<Set<number>>(new Set());

  const clearTimeouts = useCallback(() => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
  }, []);

  // Pick a puzzle for the current rating, avoiding recent repeats
  const pickPuzzle = useCallback((rating: number): ChessPuzzle => {
    const puzzle = getPuzzleForRating(rating, usedIdsRef.current);
    usedIdsRef.current.add(puzzle.id);
    if (usedIdsRef.current.size >= 8) usedIdsRef.current.clear();
    return puzzle;
  }, []);

  const beginPuzzle = useCallback((rating: number) => {
    clearTimeouts();
    const puzzle = pickPuzzle(rating);
    const state = loadFen(puzzle.fen);
    setCurrentPuzzle(puzzle);
    setGameState(state);
    setOrientation(state.turn);
    setStepIndex(0);
    setShowingSolution(false);
    setBusy(false);
    setSelected({ sq: null, legal: [] });
    setLastResult(null);
    startTimeRef.current = Date.now();
    setElapsed(0);
    setPhase("solving");
  }, [clearTimeouts, pickPuzzle]);

  // Live timer (paused once the answer is locked in)
  useEffect(() => {
    if (phase === "solving" && !showingSolution) {
      tickRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 250);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase, showingSolution]);

  // Clean up timers on unmount
  useEffect(() => () => clearTimeouts(), [clearTimeouts]);

  const finishWith = useCallback((correct: boolean, elapsedMs: number, puzzleId: number) => {
    const gain = correct ? ratingGainForTime(elapsedMs) : -10;
    onResult(correct, elapsedMs, puzzleId);
    setLastResult({ correct, gain, elapsedMs });
    setPhase("result");
  }, [onResult]);

  const attemptMove = useCallback(async (move: Move) => {
    if (!gameState || !currentPuzzle) return;
    const elapsedMs = Date.now() - startTimeRef.current;
    const expected = currentPuzzle.solution[stepIndex];
    const matchesStored =
      move.from === expected.from &&
      move.to === expected.to &&
      (!expected.promotion || move.promotion === expected.promotion);

    setSelected({ sq: null, legal: [] });

    if (!matchesStored) {
      // Ask Stockfish whether the player's move is actually the engine's top choice
      // (handles valid alternative solutions the puzzle bank doesn't list).
      let isAlternative = false;
      try {
        const sf = getStockfish();
        if (sf.isAvailable()) {
          const fen = toFen(gameState);
          const moveUci = squareName(move.from) + squareName(move.to) + (move.promotion?.toLowerCase() ?? "");
          const best = await sf.getBestMove(fen, VERIFY_DEPTH);
          isAlternative = best === moveUci;
        }
      } catch { /* fallthrough to wrong */ }

      if (!isAlternative) {
        setShowingSolution(true);
        schedule(() => {
          setShowingSolution(false);
          finishWith(false, elapsedMs, currentPuzzle.id);
        }, REVEAL_MS);
        return;
      }
    }

    // Correct: play the move on the live board.
    const afterPlayer = makeMove(gameState, move);
    setGameState(afterPlayer);

    const isLastStep = stepIndex >= currentPuzzle.solution.length - 1;
    if (isLastStep) {
      finishWith(true, elapsedMs, currentPuzzle.id);
      return;
    }

    // A forced opponent reply follows — play it automatically after a beat.
    setBusy(true);
    const reply = currentPuzzle.solution[stepIndex + 1];
    schedule(() => {
      setGameState((gs) => (gs ? makeMove(gs, reply) : gs));
      setStepIndex((i) => i + 2);
      setBusy(false);
    }, REPLY_MS);
  }, [gameState, currentPuzzle, stepIndex, schedule, finishWith]);

  const handleSquareClick = useCallback((sqIdx: Square) => {
    if (phase !== "solving" || showingSolution || busy || !gameState) return;

    if (selected.sq !== null) {
      const move = selected.legal.find((m) => m.to === sqIdx);
      if (move) { attemptMove(move); return; }
    }
    const piece = gameState.board[sqIdx];
    if (piece && piece.color === gameState.turn) {
      setSelected({ sq: sqIdx, legal: legalMoves(gameState, sqIdx) });
    } else {
      setSelected({ sq: null, legal: [] });
    }
  }, [phase, showingSolution, busy, gameState, selected, attemptMove]);

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
              const active = key === tier.difficulty;
              return (
                <div key={key} className={`rated__tier-row${active ? " rated__tier-row--active" : ""}`}
                  style={active ? { borderColor: TIER_COLORS[key], background: `${TIER_COLORS[key]}18` } : undefined}>
                  <span className="rated__tier-dot" style={{ background: TIER_COLORS[key] }} />
                  <span className="rated__tier-name" style={active ? { color: TIER_COLORS[key] } : undefined}>{label}</span>
                  <span className="rated__tier-range">{TIER_RANGES[key]}</span>
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
            <li>Solve after <b>3 minutes</b>: <span className="rated__gain">+10</span> (floor)</li>
            <li>Wrong answer: <span className="rated__loss">−10</span> (floor 0)</li>
          </ul>
          <button className="btn btn--primary" style={{ marginTop: "1.5rem" }} onClick={() => beginPuzzle(ratedPuzzles.rating)}>
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

          {/* Solution + explanation are revealed only now that the puzzle is over. */}
          <p className="chess-puzzle__theme" style={{ marginTop: "1rem" }}>
            {TIER_LABELS[currentPuzzle.difficulty]} · {currentPuzzle.theme}
          </p>
          <p className="chess-puzzle__prompt" style={{ color: correct ? "var(--good)" : "var(--bad, #ef4444)" }}>
            Solution: {solutionLine(currentPuzzle)}
          </p>
          <p className="chess-puzzle__prompt">{currentPuzzle.explanation}</p>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button className="btn btn--primary" onClick={() => beginPuzzle(ratedPuzzles.rating)}>Next Puzzle</button>
            <button className="btn btn--ghost" onClick={onExit}>Back to Chess</button>
          </div>
        </section>
      </div>
    );
  }

  // ── Solving ───────────────────────────────────────────────────────────────
  if (!gameState || !currentPuzzle) return null;

  const legalTargets = new Set(selected.legal.map((m) => m.to));
  const legalCaptures = new Set(selected.legal.filter((m) => gameState.board[m.to] !== null).map((m) => m.to));
  const flipped = orientation === "b";
  const ranks = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const files = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  // Highlight the correct move only while revealing it after a wrong attempt.
  const revealMove = showingSolution ? currentPuzzle.solution[stepIndex] : null;

  const totalPlayerMoves = Math.ceil(currentPuzzle.solution.length / 2);
  const currentPlayerMove = Math.floor(stepIndex / 2) + 1;

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
        {gameState.turn === "w" ? "White" : "Black"} to move — <em>{currentPuzzle.description}</em>
        {totalPlayerMoves > 1 && (
          <span className="rated__step"> · move {currentPlayerMove} of {totalPlayerMoves}</span>
        )}
      </p>

      <div className="chess-board" role="grid" aria-label="Chess board">
        {ranks.map((r) => (
          <div key={r} className="chess-board__rank" role="row">
            {files.map((f) => {
              const sqIdx = r * 8 + f;
              const piece = gameState.board[sqIdx];
              const isLight = (f + r) % 2 === 1;
              const isSelected = sqIdx === selected.sq;
              const isLegal = legalTargets.has(sqIdx);
              const isCapture = legalCaptures.has(sqIdx);
              const isRevealFrom = revealMove?.from === sqIdx;
              const isRevealTo = revealMove?.to === sqIdx;
              const classes = [
                "chess-board__sq",
                isLight ? "chess-board__sq--light" : "chess-board__sq--dark",
                isSelected ? "chess-board__sq--selected" : "",
                isRevealFrom ? "chess-board__sq--solution-from" : "",
                isRevealTo ? "chess-board__sq--solution-to" : "",
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

      {showingSolution && (
        <p className="chess-puzzle__theme" style={{ color: "var(--bad, #ef4444)" }}>
          Not quite — here is the best move.
        </p>
      )}
    </div>
  );
}
