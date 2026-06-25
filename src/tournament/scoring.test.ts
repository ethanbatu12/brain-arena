import { describe, expect, it } from "vitest";
import { isPlausibleScore } from "./scoring";

describe("isPlausibleScore", () => {
  it("accepts ordinary, realistic scores", () => {
    expect(isPlausibleScore("memory", 0)).toBe(true);
    expect(isPlausibleScore("trivia", 1200)).toBe(true);
  });

  it("rejects negative scores", () => {
    expect(isPlausibleScore("math", -1)).toBe(false);
  });

  it("rejects non-integer scores", () => {
    expect(isPlausibleScore("balloon", 12.5)).toBe(false);
  });

  it("rejects non-finite scores", () => {
    expect(isPlausibleScore("logic", Infinity)).toBe(false);
    expect(isPlausibleScore("logic", NaN)).toBe(false);
  });

  it("rejects absurdly large, tampered-looking scores", () => {
    expect(isPlausibleScore("pattern", 999_999_999)).toBe(false);
  });
});
