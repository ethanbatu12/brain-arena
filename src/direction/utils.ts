import type { Rng } from "../game/rng";

export function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Fisher-Yates shuffle that does not mutate the input. */
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Shuffles `correct` together with up to 3 unique distractors into a 4-choice
 * array, returning the shuffled choices and the index of the correct one.
 */
export function buildChoices(
  rng: Rng,
  correct: string,
  distractors: string[],
): { choices: string[]; correctIndex: number } {
  const uniqueDistractors: string[] = [];
  for (const d of distractors) {
    if (d !== correct && !uniqueDistractors.includes(d)) uniqueDistractors.push(d);
    if (uniqueDistractors.length === 3) break;
  }
  let pad = 1;
  while (uniqueDistractors.length < 3) {
    const filler = `${correct} (${pad})`;
    if (filler !== correct && !uniqueDistractors.includes(filler)) uniqueDistractors.push(filler);
    pad++;
  }
  const all = shuffle([correct, ...uniqueDistractors], rng);
  return { choices: all, correctIndex: all.indexOf(correct) };
}
