import type { Rng } from "../../game/rng";
import { buildChoices, pick, randInt } from "../utils";
import type { TriviaDifficulty, TriviaQuestion } from "../types";

type PatternKind = "arithmetic" | "geometric" | "squares" | "cubes" | "fibonacci" | "alternating";

function kindsForBand(band: number): PatternKind[] {
  if (band <= 1) return ["arithmetic"];
  if (band === 2) return ["arithmetic", "squares"];
  if (band === 3) return ["arithmetic", "geometric", "squares"];
  if (band === 4) return ["geometric", "squares", "cubes", "alternating"];
  return ["geometric", "cubes", "fibonacci", "alternating"];
}

function distractorsNear(answer: number, step: number): string[] {
  const abs = Math.max(1, Math.abs(step));
  return [String(answer + abs), String(answer - abs), String(answer + abs * 2)];
}

export function generatePatternQuestion(
  band: number,
  difficulty: TriviaDifficulty,
  rng: Rng,
  id: number,
): TriviaQuestion {
  const kind = pick(kindsForBand(band), rng);
  const length = band <= 2 ? 4 : 5;

  let nums: number[];
  let step: number;
  let prompt: string;

  switch (kind) {
    case "arithmetic": {
      const start = randInt(1, band <= 2 ? 10 : 30, rng);
      step = randInt(1, band <= 2 ? 5 : 12, rng);
      nums = Array.from({ length }, (_, i) => start + step * i);
      prompt = `What comes next: ${nums.join(", ")}, ?`;
      break;
    }
    case "geometric": {
      const start = randInt(1, 5, rng);
      const ratio = randInt(2, band <= 4 ? 2 : 3, rng);
      nums = Array.from({ length }, (_, i) => start * Math.pow(ratio, i));
      step = nums[nums.length - 1] * (ratio - 1);
      prompt = `What comes next: ${nums.join(", ")}, ?`;
      break;
    }
    case "squares": {
      const n0 = randInt(1, 6, rng);
      nums = Array.from({ length }, (_, i) => (n0 + i) ** 2);
      step = 2 * (n0 + length) - 1;
      prompt = `What comes next: ${nums.join(", ")}, ?`;
      break;
    }
    case "cubes": {
      const n0 = randInt(1, 4, rng);
      nums = Array.from({ length }, (_, i) => (n0 + i) ** 3);
      step = 3 * (n0 + length) ** 2;
      prompt = `What comes next: ${nums.join(", ")}, ?`;
      break;
    }
    case "fibonacci": {
      const a0 = randInt(1, 5, rng);
      const b0 = randInt(1, 5, rng);
      nums = [a0, b0];
      while (nums.length < length) nums.push(nums[nums.length - 1] + nums[nums.length - 2]);
      step = nums[nums.length - 1] - nums[nums.length - 2];
      prompt = `What comes next: ${nums.join(", ")}, ?`;
      break;
    }
    case "alternating": {
      const a0 = randInt(1, 10, rng);
      const da = randInt(1, 5, rng);
      const b0 = randInt(1, 10, rng);
      const db = randInt(1, 4, rng);
      const seq: number[] = [];
      for (let i = 0; i < length + 1; i++) {
        seq.push(i % 2 === 0 ? a0 + (i / 2) * da : b0 + Math.floor(i / 2) * db);
      }
      nums = seq.slice(0, length);
      const nextVal = seq[length];
      step = nextVal - nums[nums.length - 1];
      prompt = `What comes next: ${nums.join(", ")}, ?`;
      const { choices, correctIndex } = buildChoices(rng, String(nextVal), distractorsNear(nextVal, step || 1));
      return { id, category: "patterns", difficulty, prompt, choices, correctIndex };
    }
  }

  let answer: number;
  if (kind === "squares") {
    const root0 = Math.round(Math.sqrt(nums[0]));
    answer = (root0 + length) ** 2;
  } else if (kind === "cubes") {
    const root0 = Math.round(Math.cbrt(nums[0]));
    answer = (root0 + length) ** 3;
  } else if (kind === "geometric") {
    const ratio = Math.round(nums[1] / nums[0]);
    answer = nums[nums.length - 1] * ratio;
  } else if (kind === "fibonacci") {
    answer = nums[nums.length - 1] + nums[nums.length - 2];
  } else {
    answer = nums[nums.length - 1] + step;
  }

  const { choices, correctIndex } = buildChoices(rng, String(answer), distractorsNear(answer, step));
  return { id, category: "patterns", difficulty, prompt, choices, correctIndex };
}
