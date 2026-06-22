import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../game/rng";
import { generateChessQuestion } from "./chess";

describe("generateChessQuestion", () => {
  it("produces a well-formed question at every band", () => {
    const rng = mulberry32(51);
    for (let band = 1; band <= 6; band++) {
      for (let i = 0; i < 50; i++) {
        const q = generateChessQuestion(band, "beginner", rng, i);
        expect(q.category).toBe("chess");
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
      }
    }
  });

  it("queen piece-value question has correct answer 9", () => {
    const rng = mulberry32(4);
    let found = false;
    for (let i = 0; i < 200 && !found; i++) {
      const q = generateChessQuestion(1, "beginner", rng, i);
      if (q.prompt.includes("a queen worth")) {
        found = true;
        expect(q.choices[q.correctIndex]).toBe("9");
      }
    }
    expect(found).toBe(true);
  });
});
