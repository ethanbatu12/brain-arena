import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { ALL_QUESTIONS } from "./questionBank";
import { pickNextQuestion, stageForQuestionIndex } from "./selection";
import type { TriviaQuestion } from "./types";

describe("stageForQuestionIndex", () => {
  it("groups every 3 questions into the same stage", () => {
    expect(stageForQuestionIndex(0)).toBe(0);
    expect(stageForQuestionIndex(2)).toBe(0);
    expect(stageForQuestionIndex(3)).toBe(1);
    expect(stageForQuestionIndex(20)).toBeGreaterThan(stageForQuestionIndex(0));
  });
});

describe("pickNextQuestion", () => {
  it("always returns a well-formed question", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 200; i++) {
      const q = pickNextQuestion(new Set(), i, rng);
      expect(q.choices).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });

  it("never repeats a question that's still in usedIds while unseen ones remain", () => {
    const rng = mulberry32(7);
    const used = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const q = pickNextQuestion(used, i, rng);
      expect(used.has(q.id)).toBe(false);
      used.add(q.id);
    }
  });

  it("leans toward easier questions early and harder questions later, on average", () => {
    const rng = mulberry32(99);
    const used = new Set<number>();
    const early: TriviaQuestion["difficulty"][] = [];
    const late: TriviaQuestion["difficulty"][] = [];
    for (let i = 0; i < 6; i++) {
      const q = pickNextQuestion(used, i, rng);
      used.add(q.id);
      early.push(q.difficulty);
    }
    for (let i = 30; i < 36; i++) {
      const q = pickNextQuestion(used, i, rng);
      used.add(q.id);
      late.push(q.difficulty);
    }
    const rank = { easy: 0, medium: 1, hard: 2, expert: 3 };
    const avg = (arr: TriviaQuestion["difficulty"][]) => arr.reduce((sum, d) => sum + rank[d], 0) / arr.length;
    expect(avg(late)).toBeGreaterThan(avg(early));
  });

  it("falls back gracefully even with an exhausted usedIds set covering the whole bank", () => {
    const rng = mulberry32(3);
    const allIds = new Set(ALL_QUESTIONS.map((q) => q.id));
    const q = pickNextQuestion(allIds, 50, rng);
    expect(q.choices).toHaveLength(4);
  });
});
