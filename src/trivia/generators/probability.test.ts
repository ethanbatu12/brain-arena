import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../game/rng";
import { generateProbabilityQuestion } from "./probability";

describe("generateProbabilityQuestion", () => {
  it("produces a well-formed question at every band", () => {
    const rng = mulberry32(31);
    for (let band = 1; band <= 6; band++) {
      for (let i = 0; i < 50; i++) {
        const q = generateProbabilityQuestion(band, "beginner", rng, i);
        expect(q.category).toBe("probability");
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
      }
    }
  });

  it("a six-sided die question has correct answer 1/6", () => {
    const rng = mulberry32(2);
    let found = false;
    for (let i = 0; i < 200 && !found; i++) {
      const q = generateProbabilityQuestion(1, "beginner", rng, i);
      if (q.prompt.includes("6-sided die")) {
        found = true;
        expect(q.choices[q.correctIndex]).toBe("1/6");
      }
    }
    expect(found).toBe(true);
  });
});
