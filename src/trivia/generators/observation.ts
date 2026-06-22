import type { Rng } from "../../game/rng";
import { buildChoices, pick, randInt } from "../utils";
import type { TriviaDifficulty, TriviaQuestion } from "../types";

const SYMBOLS = ["🔵", "🔺", "⭐", "⬛", "🟢", "🟣", "🟡"];
const CELL_NAMES = [
  ["top-left", "top-middle", "top-right"],
  ["middle-left", "center", "middle-right"],
  ["bottom-left", "bottom-middle", "bottom-right"],
];

type ObservationKind = "count" | "cell" | "most-common";

function kindsForBand(band: number): ObservationKind[] {
  if (band <= 2) return ["cell"];
  if (band <= 4) return ["cell", "count"];
  return ["count", "most-common"];
}

export function generateObservationQuestion(
  band: number,
  difficulty: TriviaDifficulty,
  rng: Rng,
  id: number,
): TriviaQuestion {
  const gridSize = band <= 2 ? 2 : 3;
  const symbolPoolSize = band <= 2 ? 2 : band <= 4 ? 3 : 4;
  const symbolPool = SYMBOLS.slice(0, symbolPoolSize);

  const grid: string[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => pick(symbolPool, rng)),
  );

  const kind = pick(kindsForBand(band), rng);
  const flat = grid.flat();

  if (kind === "cell") {
    const row = randInt(0, gridSize - 1, rng);
    const col = randInt(0, gridSize - 1, rng);
    const cellName = gridSize === 3 ? CELL_NAMES[row][col] : `row ${row + 1}, column ${col + 1}`;
    const correct = grid[row][col];
    const distractors = symbolPool.filter((s) => s !== correct);
    const prompt = `What symbol was in the ${cellName} cell of the grid you saw?`;
    const { choices, correctIndex } = buildChoices(rng, correct, distractors);
    return { id, category: "observation", difficulty, prompt, choices, correctIndex, observationGrid: grid };
  }

  if (kind === "count") {
    const target = pick(symbolPool, rng);
    const count = flat.filter((s) => s === target).length;
    const prompt = `How many ${target} symbols were in the grid you saw?`;
    const distractors = [count + 1, Math.max(0, count - 1), count + 2]
      .filter((n) => n !== count)
      .map(String);
    const { choices, correctIndex } = buildChoices(rng, String(count), distractors);
    return { id, category: "observation", difficulty, prompt, choices, correctIndex, observationGrid: grid };
  }

  // most-common
  const tally = new Map<string, number>();
  for (const s of flat) tally.set(s, (tally.get(s) ?? 0) + 1);
  let mostCommon = flat[0];
  let max = 0;
  for (const [symbol, count] of tally) {
    if (count > max) {
      max = count;
      mostCommon = symbol;
    }
  }
  const prompt = "Which symbol appeared most often in the grid you saw?";
  const distractors = symbolPool.filter((s) => s !== mostCommon);
  const { choices, correctIndex } = buildChoices(rng, mostCommon, distractors);
  return { id, category: "observation", difficulty, prompt, choices, correctIndex, observationGrid: grid };
}
