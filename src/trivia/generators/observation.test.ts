import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../game/rng";
import { generateObservationQuestion } from "./observation";

describe("generateObservationQuestion", () => {
  it("produces a well-formed question with a grid at every band", () => {
    const rng = mulberry32(41);
    for (let band = 1; band <= 6; band++) {
      for (let i = 0; i < 50; i++) {
        const q = generateObservationQuestion(band, "beginner", rng, i);
        expect(q.category).toBe("observation");
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
        expect(q.observationGrid).toBeDefined();
        expect(q.observationGrid!.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("a cell question's correct answer matches the actual grid contents", () => {
    const rng = mulberry32(9);
    let found = false;
    for (let i = 0; i < 100 && !found; i++) {
      const q = generateObservationQuestion(1, "beginner", rng, i);
      if (q.prompt.startsWith("What symbol was in the")) {
        found = true;
        const flat = q.observationGrid!.flat();
        expect(flat).toContain(q.choices[q.correctIndex]);
      }
    }
    expect(found).toBe(true);
  });
});
