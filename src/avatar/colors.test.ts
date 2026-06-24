import { describe, expect, it } from "vitest";
import { darken } from "./colors";

describe("darken", () => {
  it("returns the same color when amount is 0", () => {
    expect(darken("#ff0000", 0)).toBe("#ff0000");
  });

  it("darkens toward black as amount approaches 1", () => {
    expect(darken("#ff0000", 1)).toBe("#000000");
  });

  it("produces a valid 7-character hex string", () => {
    const result = darken("#3b82f6", 0.2);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });
});
