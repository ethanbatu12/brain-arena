import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../game/rng";
import { generatePatternQuestion } from "./patterns";

describe("generatePatternQuestion", () => {
  it("produces a well-formed question at every band", () => {
    const rng = mulberry32(21);
    for (let band = 1; band <= 6; band++) {
      for (let i = 0; i < 50; i++) {
        const q = generatePatternQuestion(band, "beginner", rng, i);
        expect(q.category).toBe("patterns");
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
      }
    }
  });

  it("the correct answer continues an arithmetic sequence correctly", () => {
    const rng = mulberry32(3);
    let found = false;
    for (let i = 0; i < 200 && !found; i++) {
      const q = generatePatternQuestion(1, "beginner", rng, i);
      const match = q.prompt.match(/What comes next: ([\d, ]+), \?/);
      if (match) {
        found = true;
        const nums = match[1].split(",").map((s) => Number(s.trim()));
        const step = nums[1] - nums[0];
        const expected = nums[nums.length - 1] + step;
        expect(q.choices[q.correctIndex]).toBe(String(expected));
      }
    }
    expect(found).toBe(true);
  });
});
