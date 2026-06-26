import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR_CONFIG } from "./defaults";
import { sanitizeAvatarConfig } from "./serialize";

describe("sanitizeAvatarConfig", () => {
  it("returns the full default config when given null/undefined", () => {
    expect(sanitizeAvatarConfig(null)).toEqual(DEFAULT_AVATAR_CONFIG);
    expect(sanitizeAvatarConfig(undefined)).toEqual(DEFAULT_AVATAR_CONFIG);
  });

  it("returns the default config when given an empty object", () => {
    expect(sanitizeAvatarConfig({})).toEqual(DEFAULT_AVATAR_CONFIG);
  });

  it("preserves every valid field from a complete, valid config", () => {
    const custom = {
      ...DEFAULT_AVATAR_CONFIG,
      faceShape: "square" as const,
      hairColor: "blue" as const,
      accessories: ["glasses", "headband"] as ("glasses" | "headband")[],
    };
    expect(sanitizeAvatarConfig(custom)).toEqual(custom);
  });

  it("supports wearing multiple accessories at once", () => {
    const result = sanitizeAvatarConfig({ accessories: ["glasses", "headband", "crown"] });
    expect(result.accessories).toEqual(["glasses", "headband", "crown"]);
  });

  it("migrates an old single-string accessory value into a one-item array", () => {
    const result = sanitizeAvatarConfig({ accessory: "glasses" } as never);
    expect(result.accessories).toEqual(["glasses"]);
  });

  it("treats a legacy 'none' value as wearing nothing", () => {
    const result = sanitizeAvatarConfig({ accessory: "none" } as never);
    expect(result.accessories).toEqual([]);
  });

  it("drops unrecognized accessory values and de-duplicates", () => {
    const result = sanitizeAvatarConfig({ accessories: ["glasses", "glasses", "not-a-real-thing"] as never });
    expect(result.accessories).toEqual(["glasses"]);
  });

  it("caps accessories at the absolute maximum, even if more were stored", () => {
    const tooMany = ["glasses", "headband", "cap", "snapback", "bucketHat", "hat", "beanie", "crown"];
    const result = sanitizeAvatarConfig({ accessories: tooMany as never });
    expect(result.accessories).toHaveLength(7);
  });

  it("falls back to the default for any single invalid/corrupted field, keeping the rest", () => {
    const corrupted = {
      ...DEFAULT_AVATAR_CONFIG,
      hairStyle: "not-a-real-style" as never,
      eyeColor: "ultraviolet" as never,
    };
    const result = sanitizeAvatarConfig(corrupted);
    expect(result.hairStyle).toBe(DEFAULT_AVATAR_CONFIG.hairStyle);
    expect(result.eyeColor).toBe(DEFAULT_AVATAR_CONFIG.eyeColor);
    expect(result.faceShape).toBe(DEFAULT_AVATAR_CONFIG.faceShape);
  });

  it("falls back booleans to the default when given a non-boolean value", () => {
    const corrupted = { ...DEFAULT_AVATAR_CONFIG, freckles: "yes" as never };
    expect(sanitizeAvatarConfig(corrupted).freckles).toBe(DEFAULT_AVATAR_CONFIG.freckles);
  });

  it("repairs a totally empty partial object field-by-field", () => {
    const partial = { faceShape: "oval" as const };
    const result = sanitizeAvatarConfig(partial);
    expect(result.faceShape).toBe("oval");
    expect(result.skinTone).toBe(DEFAULT_AVATAR_CONFIG.skinTone);
  });
});
