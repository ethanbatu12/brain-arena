import type { Rng } from "../../game/rng";
import { buildChoices, pick } from "../utils";
import type { TriviaDifficulty, TriviaQuestion } from "../types";

type ChessKind = "piece-value" | "legal-moves" | "checkmate-pattern" | "tactic";

const PIECE_VALUES: Record<string, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
};

/** Approximate max squares reachable from a central square on an otherwise-empty board. */
const MAX_MOVES_FROM_CENTER: Record<string, number> = {
  rook: 14,
  bishop: 13,
  queen: 27,
  knight: 8,
  king: 8,
};

const CHECKMATE_PATTERNS: { description: string; name: string }[] = [
  { description: "a rook and king trap the enemy king along the edge of the board", name: "Back-rank mate" },
  { description: "the king is checkmated while completely surrounded by its own pieces", name: "Smothered mate" },
  { description: "a queen and knight deliver mate with the queen sacrificing itself for position", name: "Anastasia's mate" },
  { description: "two rooks march up the board, mating the king step by step", name: "Ladder mate" },
  { description: "a bishop and knight corner the king with no escape squares", name: "Boden's mate" },
];

const TACTICS: { description: string; name: string }[] = [
  { description: "one move attacks two enemy pieces at the same time", name: "Fork" },
  { description: "a piece cannot move because doing so would expose a more valuable piece to attack", name: "Pin" },
  { description: "a less valuable piece is sacrificed to deflect a more valuable piece into a bad square", name: "Skewer" },
  { description: "an attacking move forces a response, gaining time or material", name: "Forcing move" },
  { description: "a piece moves out of the way so another piece behind it can deliver an attack", name: "Discovered attack" },
];

function kindsForBand(band: number): ChessKind[] {
  if (band <= 2) return ["piece-value"];
  if (band <= 4) return ["piece-value", "legal-moves", "checkmate-pattern"];
  return ["legal-moves", "checkmate-pattern", "tactic"];
}

export function generateChessQuestion(
  band: number,
  difficulty: TriviaDifficulty,
  rng: Rng,
  id: number,
): TriviaQuestion {
  const kind = pick(kindsForBand(band), rng);

  if (kind === "piece-value") {
    const pieces = Object.keys(PIECE_VALUES);
    const piece = pick(pieces, rng);
    const value = PIECE_VALUES[piece];
    const prompt = `In standard chess piece values, how many points is a ${piece} worth?`;
    const distractors = Object.values(PIECE_VALUES)
      .filter((v) => v !== value)
      .map(String);
    const { choices, correctIndex } = buildChoices(rng, String(value), distractors);
    return { id, category: "chess", difficulty, prompt, choices, correctIndex };
  }

  if (kind === "legal-moves") {
    const pieces = Object.keys(MAX_MOVES_FROM_CENTER);
    const piece = pick(pieces, rng);
    const count = MAX_MOVES_FROM_CENTER[piece];
    const prompt = `From a central square on an otherwise-empty board, what is the maximum number of squares a ${piece} can move to?`;
    const distractors = Object.values(MAX_MOVES_FROM_CENTER)
      .filter((v) => v !== count)
      .map(String);
    const { choices, correctIndex } = buildChoices(rng, String(count), distractors);
    return { id, category: "chess", difficulty, prompt, choices, correctIndex };
  }

  if (kind === "checkmate-pattern") {
    const item = pick(CHECKMATE_PATTERNS, rng);
    const prompt = `What is the name of the checkmate pattern where ${item.description}?`;
    const distractors = CHECKMATE_PATTERNS.filter((p) => p.name !== item.name).map((p) => p.name);
    const { choices, correctIndex } = buildChoices(rng, item.name, distractors);
    return { id, category: "chess", difficulty, prompt, choices, correctIndex };
  }

  // tactic
  const item = pick(TACTICS, rng);
  const prompt = `What is the name of the chess tactic where ${item.description}?`;
  const distractors = TACTICS.filter((t) => t.name !== item.name).map((t) => t.name);
  const { choices, correctIndex } = buildChoices(rng, item.name, distractors);
  return { id, category: "chess", difficulty, prompt, choices, correctIndex };
}
