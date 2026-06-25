import { describe, expect, it } from "vitest";
import { CATEGORIES } from "./constants";
import { ALL_QUESTIONS } from "./questionBank";

describe("ALL_QUESTIONS", () => {
  it("contains a substantial number of questions", () => {
    expect(ALL_QUESTIONS.length).toBeGreaterThan(250);
  });

  it("has every question with exactly 4 unique choices and a valid correct index", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });

  it("has no two questions that are identical in both prompt and image", () => {
    // Image questions intentionally reuse the same prompt text ("What animal is this?")
    // across different images — only the prompt+image combination needs to be unique.
    const keys = ALL_QUESTIONS.map((q) => `${q.prompt}|${q.image ?? ""}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has no duplicate ids", () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses known categories and difficulties", () => {
    const validDifficulties = new Set(["easy", "medium", "hard", "expert"]);
    for (const q of ALL_QUESTIONS) {
      expect(CATEGORIES).toContain(q.category);
      expect(validDifficulties.has(q.difficulty)).toBe(true);
    }
  });

  it("covers every category", () => {
    const seen = new Set(ALL_QUESTIONS.map((q) => q.category));
    for (const c of CATEGORIES) expect(seen.has(c)).toBe(true);
  });

  it("covers every difficulty within each major category", () => {
    const validDifficulties = ["easy", "medium", "hard", "expert"] as const;
    for (const category of CATEGORIES) {
      const inCategory = ALL_QUESTIONS.filter((q) => q.category === category);
      const difficulties = new Set(inCategory.map((q) => q.difficulty));
      for (const d of validDifficulties) {
        expect(difficulties.has(d), `${category} is missing a ${d} question`).toBe(true);
      }
    }
  });

  it("gives every image-type question an image", () => {
    for (const q of ALL_QUESTIONS) {
      if (q.type === "image") expect(q.image).toBeTruthy();
    }
  });
});
