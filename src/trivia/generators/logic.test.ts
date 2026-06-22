import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../game/rng";
import { generateLogicQuestion } from "./logic";

describe("generateLogicQuestion", () => {
  it("produces a well-formed question at every band", () => {
    const rng = mulberry32(11);
    for (let band = 1; band <= 6; band++) {
      for (let i = 0; i < 50; i++) {
        const q = generateLogicQuestion(band, "beginner", rng, i);
        expect(q.category).toBe("logic");
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
      }
    }
  });
});
