import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../game/rng";
import { generateGeneralQuestion } from "./general";

describe("generateGeneralQuestion", () => {
  it("produces a well-formed question with a real fact every time", () => {
    const rng = mulberry32(61);
    for (let i = 0; i < 100; i++) {
      const q = generateGeneralQuestion(1, "beginner", rng, i);
      expect(q.category).toBe("general");
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
      expect(q.prompt.length).toBeGreaterThan(0);
    }
  });

  it("draws from a varied fact bank, not a single repeated question", () => {
    const rng = mulberry32(13);
    const prompts = new Set<string>();
    for (let i = 0; i < 100; i++) prompts.add(generateGeneralQuestion(1, "beginner", rng, i).prompt);
    expect(prompts.size).toBeGreaterThan(10);
  });
});
