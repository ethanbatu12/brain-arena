import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../game/rng";
import { generateMathQuestion } from "./math";

describe("generateMathQuestion", () => {
  it("produces a well-formed question at every band", () => {
    const rng = mulberry32(1);
    for (let band = 1; band <= 6; band++) {
      for (let i = 0; i < 50; i++) {
        const q = generateMathQuestion(band, "beginner", rng, i);
        expect(q.category).toBe("math");
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
      }
    }
  });

  it("the correct choice matches the arithmetic actually described in the prompt for addition", () => {
    const rng = mulberry32(5);
    let found = false;
    for (let i = 0; i < 200 && !found; i++) {
      const q = generateMathQuestion(1, "beginner", rng, i);
      const match = q.prompt.match(/What is (\d+) \+ (\d+)\?/);
      if (match) {
        found = true;
        const [, a, b] = match;
        const expected = Number(a) + Number(b);
        expect(q.choices[q.correctIndex]).toBe(String(expected));
      }
    }
    expect(found).toBe(true);
  });
});
