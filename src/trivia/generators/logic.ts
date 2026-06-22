import type { Rng } from "../../game/rng";
import { buildChoices, pick, randInt } from "../utils";
import type { TriviaDifficulty, TriviaQuestion } from "../types";

type LogicKind = "deduction" | "number-logic" | "must-be-true";

const NOUNS = ["cats", "dogs", "robots", "wizards", "ravens", "dolphins", "knights", "pilots"];
const TRAITS = ["fly", "swim", "are loud", "are clever", "are fast", "glow in the dark", "can sing"];

function kindsForBand(band: number): LogicKind[] {
  if (band <= 2) return ["deduction", "number-logic"];
  return ["deduction", "number-logic", "must-be-true"];
}

export function generateLogicQuestion(
  band: number,
  difficulty: TriviaDifficulty,
  rng: Rng,
  id: number,
): TriviaQuestion {
  const kind = pick(kindsForBand(band), rng);

  if (kind === "deduction") {
    const noun = pick(NOUNS, rng);
    const trait = pick(TRAITS, rng);
    const name = pick(["Zog", "Mira", "Tex", "Luna", "Otto", "Vex"], rng);
    const prompt = `All ${noun} ${trait}. ${name} is a ${noun.slice(0, -1)}. What must be true about ${name}?`;
    const correct = `${name} ${trait}`;
    const distractors = [
      `${name} does not ${trait.replace(/^(is|are) /, "")}`,
      `${name} might or might not ${trait.replace(/^(is|are) /, "")}`,
      `Nothing can be determined about ${name}`,
    ];
    const { choices, correctIndex } = buildChoices(rng, correct, distractors);
    return { id, category: "logic", difficulty, prompt, choices, correctIndex };
  }

  if (kind === "number-logic") {
    const maxNum = band <= 2 ? 20 : band <= 4 ? 100 : 500;
    const nums = new Set<number>();
    while (nums.size < 4) nums.add(randInt(2, maxNum, rng));
    const list = Array.from(nums);
    const variant = pick(["largest", "smallest", "even", "odd"] as const, rng);

    let correctNum: number;
    let prompt: string;
    if (variant === "largest") {
      correctNum = Math.max(...list);
      prompt = `Which of these numbers is the largest: ${list.join(", ")}?`;
    } else if (variant === "smallest") {
      correctNum = Math.min(...list);
      prompt = `Which of these numbers is the smallest: ${list.join(", ")}?`;
    } else if (variant === "even") {
      const evens = list.filter((n) => n % 2 === 0);
      if (evens.length === 0 || evens.length === list.length) {
        list[0] = list[0] % 2 === 0 ? list[0] + 1 : list[0]; // force exactly one even/odd mix
      }
      const finalEvens = list.filter((n) => n % 2 === 0);
      correctNum = finalEvens[0] ?? list[0];
      prompt = `Which of these numbers is even: ${list.join(", ")}?`;
    } else {
      const odds = list.filter((n) => n % 2 !== 0);
      if (odds.length === 0) list[0] += 1;
      const finalOdds = list.filter((n) => n % 2 !== 0);
      correctNum = finalOdds[0] ?? list[0];
      prompt = `Which of these numbers is odd: ${list.join(", ")}?`;
    }

    const distractors = list.filter((n) => n !== correctNum).map(String);
    const { choices, correctIndex } = buildChoices(rng, String(correctNum), distractors);
    return { id, category: "logic", difficulty, prompt, choices, correctIndex };
  }

  // must-be-true: simple transitive ordering
  const a = pick(["A", "X", "Sam", "Riley"], rng);
  const b = pick(["B", "Y", "Jordan", "Casey"], rng);
  const c = pick(["C", "Z", "Drew", "Quinn"], rng);
  const prompt = `${a} is older than ${b}. ${b} is older than ${c}. Which statement must be true?`;
  const correct = `${a} is older than ${c}`;
  const distractors = [
    `${c} is older than ${a}`,
    `${a} and ${c} are the same age`,
    `${b} is the oldest`,
  ];
  const { choices, correctIndex } = buildChoices(rng, correct, distractors);
  return { id, category: "logic", difficulty, prompt, choices, correctIndex };
}
