import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { BONUS_POINTS, MAX_BAND, MIN_BAND, POINTS_PER_CORRECT, QUESTIONS_PER_BAND_STEP } from "./constants";
import {
  bandForQuestionIndex,
  bandToDifficulty,
  isBonusCorrect,
  makeQuestion,
  pointsForCorrect,
  scoreForCorrect,
  triviaAccuracy,
} from "./logic";

describe("bandToDifficulty", () => {
  it("maps each band to its named tier", () => {
    expect(bandToDifficulty(1)).toBe("beginner");
    expect(bandToDifficulty(2)).toBe("easy");
    expect(bandToDifficulty(3)).toBe("medium");
    expect(bandToDifficulty(4)).toBe("hard");
    expect(bandToDifficulty(5)).toBe("expert");
    expect(bandToDifficulty(6)).toBe("master");
  });

  it("clamps out-of-range bands", () => {
    expect(bandToDifficulty(0)).toBe("beginner");
    expect(bandToDifficulty(99)).toBe("master");
  });
});

describe("bandForQuestionIndex", () => {
  it("starts at the minimum band", () => {
    expect(bandForQuestionIndex(0)).toBe(MIN_BAND);
  });

  it("increases by one band every QUESTIONS_PER_BAND_STEP questions", () => {
    expect(bandForQuestionIndex(QUESTIONS_PER_BAND_STEP)).toBe(MIN_BAND + 1);
    expect(bandForQuestionIndex(QUESTIONS_PER_BAND_STEP * 2)).toBe(MIN_BAND + 2);
  });

  it("caps at the maximum band", () => {
    expect(bandForQuestionIndex(QUESTIONS_PER_BAND_STEP * 50)).toBe(MAX_BAND);
  });
});

describe("scoring", () => {
  it("awards the flat per-correct point value with no bonus on most answers", () => {
    expect(pointsForCorrect()).toBe(POINTS_PER_CORRECT);
    expect(scoreForCorrect(1)).toBe(POINTS_PER_CORRECT);
    expect(isBonusCorrect(1)).toBe(false);
  });

  it("awards the bonus on the 5th, 10th, ... correct answer", () => {
    expect(isBonusCorrect(5)).toBe(true);
    expect(scoreForCorrect(5)).toBe(POINTS_PER_CORRECT + BONUS_POINTS);
  });

  it("matches the spec's worked example: 5 correct answers totals 425 (375 + 50 bonus)", () => {
    let total = 0;
    for (let i = 1; i <= 5; i++) total += scoreForCorrect(i);
    expect(total).toBe(5 * POINTS_PER_CORRECT + BONUS_POINTS);
    expect(total).toBe(425);
  });
});

describe("triviaAccuracy", () => {
  it("is zero with no questions answered", () => {
    expect(triviaAccuracy(0, 0)).toBe(0);
  });

  it("computes a percentage", () => {
    expect(triviaAccuracy(9, 10)).toBe(90);
    expect(triviaAccuracy(1, 4)).toBe(25);
  });
});

describe("makeQuestion", () => {
  it("always returns a well-formed question with exactly 4 unique choices and a valid correct index", () => {
    const rng = mulberry32(2024);
    for (let band = 1; band <= 6; band++) {
      for (let i = 0; i < 100; i++) {
        const q = makeQuestion(band, rng, i);
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
        expect(q.prompt.length).toBeGreaterThan(0);
        expect(["math", "logic", "patterns", "probability", "observation", "chess", "general"]).toContain(q.category);
      }
    }
  });

  it("produces many distinct prompts across repeated calls (procedural variety)", () => {
    const rng = mulberry32(7);
    const prompts = new Set<string>();
    for (let i = 0; i < 300; i++) {
      prompts.add(makeQuestion(3, rng, i).prompt);
    }
    expect(prompts.size).toBeGreaterThan(100);
  });
});
