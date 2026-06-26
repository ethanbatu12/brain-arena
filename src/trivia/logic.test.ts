import { describe, expect, it } from "vitest";
import { BONUS_POINTS, POINTS_PER_CORRECT } from "./constants";
import { isBonusCorrect, pointsForCorrect, scoreForCorrect, triviaAccuracy } from "./logic";

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

  it("totals 4 plain correct answers plus one bonus answer correctly", () => {
    let total = 0;
    for (let i = 1; i <= 5; i++) total += scoreForCorrect(i);
    expect(total).toBe(5 * POINTS_PER_CORRECT + BONUS_POINTS);
    expect(total).toBe(450);
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
