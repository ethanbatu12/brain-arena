import type { Rng } from "../../game/rng";
import { buildChoices, pick, randInt } from "../utils";
import type { TriviaDifficulty, TriviaQuestion } from "../types";

type MathKind = "add" | "sub" | "mult" | "div" | "percent" | "exponent" | "sqrt" | "fraction" | "word-problem";

function kindsForBand(band: number): MathKind[] {
  if (band <= 1) return ["add", "sub"];
  if (band === 2) return ["add", "sub", "mult"];
  if (band === 3) return ["mult", "div", "percent", "exponent"];
  if (band === 4) return ["mult", "div", "percent", "exponent", "sqrt"];
  if (band === 5) return ["percent", "exponent", "sqrt", "fraction", "word-problem"];
  return ["percent", "exponent", "sqrt", "fraction", "word-problem"];
}

function numDistractors(answer: number, spread: number, rng: Rng): string[] {
  const offsets = [1, -1, 2, -2, spread, -spread].filter((o) => o !== 0);
  const seen = new Set<number>();
  const out: string[] = [];
  for (const off of offsets) {
    const v = answer + off;
    if (v !== answer && !seen.has(v)) {
      seen.add(v);
      out.push(String(v));
    }
    if (out.length >= 5) break;
  }
  // shuffle so we don't always pick the same first three
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateMathQuestion(
  band: number,
  difficulty: TriviaDifficulty,
  rng: Rng,
  id: number,
): TriviaQuestion {
  const kind = pick(kindsForBand(band), rng);
  const maxNum = band <= 1 ? 20 : band === 2 ? 50 : band === 3 ? 100 : band === 4 ? 250 : 1000;

  let prompt: string;
  let answer: number;
  let spread = 5;

  switch (kind) {
    case "add": {
      const a = randInt(1, maxNum, rng);
      const b = randInt(1, maxNum, rng);
      answer = a + b;
      prompt = `What is ${a} + ${b}?`;
      break;
    }
    case "sub": {
      const a = randInt(1, maxNum, rng);
      const b = randInt(1, a, rng);
      answer = a - b;
      prompt = `What is ${a} − ${b}?`;
      break;
    }
    case "mult": {
      const a = randInt(2, band <= 3 ? 12 : 25, rng);
      const b = randInt(2, band <= 3 ? 12 : 25, rng);
      answer = a * b;
      spread = Math.max(2, Math.round(answer * 0.1));
      prompt = `What is ${a} × ${b}?`;
      break;
    }
    case "div": {
      const b = randInt(2, 12, rng);
      const a = b * randInt(2, 12, rng);
      answer = a / b;
      prompt = `What is ${a} ÷ ${b}?`;
      break;
    }
    case "percent": {
      const roundPercents = [10, 20, 25, 50, 75];
      const hardPercents = [15, 35, 40, 60, 72, 85];
      const pct = band <= 3 ? pick(roundPercents, rng) : pick(hardPercents, rng);
      const base = randInt(2, band <= 3 ? 20 : 60, rng) * (band <= 3 ? 10 : 5);
      answer = Math.round((pct / 100) * base);
      spread = Math.max(2, Math.round(answer * 0.15));
      prompt = `What is ${pct}% of ${base}?`;
      break;
    }
    case "exponent": {
      const exp = band <= 4 ? 2 : 3;
      const base = randInt(2, exp === 2 ? 15 : 9, rng);
      answer = Math.pow(base, exp);
      spread = Math.max(2, Math.round(answer * 0.2));
      prompt = exp === 2 ? `What is ${base} squared?` : `What is ${base} cubed?`;
      break;
    }
    case "sqrt": {
      const root = randInt(2, band <= 4 ? 12 : 20, rng);
      answer = root;
      const square = root * root;
      spread = 2;
      prompt = `What is the square root of ${square}?`;
      break;
    }
    case "fraction": {
      const denom = pick([4, 5, 6, 8, 10], rng);
      const a = randInt(1, denom - 1, rng);
      const b = randInt(1, denom - a, rng);
      answer = a + b;
      spread = 1;
      const choicesStr = buildChoices(
        rng,
        `${answer}/${denom}`,
        numDistractors(answer, spread, rng).map((v) => `${v}/${denom}`),
      );
      return {
        id,
        category: "math",
        difficulty,
        prompt: `What is ${a}/${denom} + ${b}/${denom}?`,
        choices: choicesStr.choices,
        correctIndex: choicesStr.correctIndex,
      };
    }
    case "word-problem": {
      const speed = randInt(20, 80, rng);
      const hours = randInt(2, 6, rng);
      answer = speed * hours;
      spread = Math.max(5, Math.round(answer * 0.1));
      prompt = `A car travels at ${speed} mph for ${hours} hours. How many miles does it travel?`;
      break;
    }
  }

  const { choices, correctIndex } = buildChoices(rng, String(answer), numDistractors(answer, spread, rng));
  return { id, category: "math", difficulty, prompt, choices, correctIndex };
}
