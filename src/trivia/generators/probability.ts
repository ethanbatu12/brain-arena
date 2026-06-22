import type { Rng } from "../../game/rng";
import { buildChoices, pick, randInt } from "../utils";
import type { TriviaDifficulty, TriviaQuestion } from "../types";

type ProbabilityKind = "dice" | "coin" | "spinner" | "cards" | "bag";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function asFraction(numerator: number, denominator: number): string {
  const g = gcd(numerator, denominator) || 1;
  return `${numerator / g}/${denominator / g}`;
}

function fractionNear(numerator: number, denominator: number, deltaNum: number): string {
  const n = Math.max(1, Math.min(denominator - 1, numerator + deltaNum));
  return asFraction(n, denominator);
}

function kindsForBand(band: number): ProbabilityKind[] {
  if (band <= 2) return ["dice", "coin"];
  if (band <= 4) return ["dice", "coin", "spinner", "bag"];
  return ["dice", "spinner", "cards", "bag"];
}

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const COLORS = ["red", "blue", "green", "yellow", "purple"];

export function generateProbabilityQuestion(
  band: number,
  difficulty: TriviaDifficulty,
  rng: Rng,
  id: number,
): TriviaQuestion {
  const kind = pick(kindsForBand(band), rng);

  if (kind === "dice") {
    const sides = band <= 3 ? 6 : pick([6, 8, 10, 12], rng);
    const target = randInt(1, sides, rng);
    const prompt = `What is the probability of rolling a ${target} on a fair ${sides}-sided die?`;
    const correct = asFraction(1, sides);
    const distractors = [fractionNear(1, sides, 1), fractionNear(1, sides, 2), asFraction(2, sides)];
    const { choices, correctIndex } = buildChoices(rng, correct, distractors);
    return { id, category: "probability", difficulty, prompt, choices, correctIndex };
  }

  if (kind === "coin") {
    const flips = band <= 2 ? 1 : randInt(2, 3, rng);
    if (flips === 1) {
      const prompt = "What is the probability of flipping heads on a fair coin?";
      const correct = "1/2";
      const distractors = ["1/3", "1/4", "2/3"];
      const { choices, correctIndex } = buildChoices(rng, correct, distractors);
      return { id, category: "probability", difficulty, prompt, choices, correctIndex };
    }
    const denom = 2 ** flips;
    const prompt = `What is the probability of flipping all heads on ${flips} fair coin flips?`;
    const correct = asFraction(1, denom);
    const distractors = [fractionNear(1, denom, 1), asFraction(flips, denom), fractionNear(1, denom, 2)];
    const { choices, correctIndex } = buildChoices(rng, correct, distractors);
    return { id, category: "probability", difficulty, prompt, choices, correctIndex };
  }

  if (kind === "spinner") {
    const sections = randInt(4, band <= 4 ? 6 : 10, rng);
    const winning = randInt(1, Math.max(1, Math.floor(sections / 2)), rng);
    const prompt = `A spinner has ${sections} equal sections, ${winning} of them colored gold. What is the probability of landing on gold?`;
    const correct = asFraction(winning, sections);
    const distractors = [
      fractionNear(winning, sections, 1),
      asFraction(sections - winning, sections),
      fractionNear(winning, sections, -1),
    ];
    const { choices, correctIndex } = buildChoices(rng, correct, distractors);
    return { id, category: "probability", difficulty, prompt, choices, correctIndex };
  }

  if (kind === "cards") {
    const variant = pick(["suit", "rank"] as const, rng);
    if (variant === "suit") {
      const suit = pick(SUITS, rng);
      const prompt = `What is the probability of drawing a ${suit} card from a standard 52-card deck?`;
      const correct = "1/4";
      const distractors = ["1/13", "1/2", "1/52"];
      const { choices, correctIndex } = buildChoices(rng, correct, distractors);
      return { id, category: "probability", difficulty, prompt, choices, correctIndex };
    }
    const prompt = "What is the probability of drawing an ace from a standard 52-card deck?";
    const correct = "1/13";
    const distractors = ["1/4", "1/52", "4/52"];
    const { choices, correctIndex } = buildChoices(rng, correct, distractors);
    return { id, category: "probability", difficulty, prompt, choices, correctIndex };
  }

  // bag of colored balls
  const colorCount = randInt(2, band <= 4 ? 3 : 4, rng);
  const chosenColors = COLORS.slice(0, colorCount);
  const counts = chosenColors.map(() => randInt(2, 8, rng));
  const total = counts.reduce((s, c) => s + c, 0);
  const targetIndex = randInt(0, colorCount - 1, rng);
  const prompt = `A bag has ${chosenColors.map((c, i) => `${counts[i]} ${c}`).join(", ")} balls. What is the probability of drawing a ${chosenColors[targetIndex]} ball?`;
  const correct = asFraction(counts[targetIndex], total);
  const distractors = chosenColors
    .map((_, i) => asFraction(counts[i], total))
    .filter((f) => f !== correct);
  const { choices, correctIndex } = buildChoices(rng, correct, distractors);
  return { id, category: "probability", difficulty, prompt, choices, correctIndex };
}
