import { describe, expect, it } from "vitest";
import { isAvailable, isUnlocked, partitionByUnlock, unlockedValues } from "./unlocks";
import type { AvatarOption } from "./options";

const OPTIONS: AvatarOption<string>[] = [
  { value: "a", label: "A", unlockLevel: 1 },
  { value: "b", label: "B", unlockLevel: 5 },
  { value: "c", label: "C", unlockLevel: 10 },
];

const EXCLUSIVE_OPTION: AvatarOption<string> = { value: "trophy-item", label: "Trophy Item", unlockLevel: 9999, exclusive: true };

describe("isUnlocked", () => {
  it("is unlocked when player level meets or exceeds the requirement", () => {
    expect(isUnlocked(OPTIONS[1], 5)).toBe(true);
    expect(isUnlocked(OPTIONS[1], 6)).toBe(true);
  });

  it("is locked when player level is below the requirement", () => {
    expect(isUnlocked(OPTIONS[1], 4)).toBe(false);
  });

  it("level-1 options are always unlocked for any valid player", () => {
    expect(isUnlocked(OPTIONS[0], 1)).toBe(true);
  });
});

describe("partitionByUnlock", () => {
  it("splits options into unlocked and locked based on player level", () => {
    const { unlocked, locked } = partitionByUnlock(OPTIONS, 5);
    expect(unlocked.map((o) => o.value)).toEqual(["a", "b"]);
    expect(locked.map((o) => o.value)).toEqual(["c"]);
  });

  it("everything is unlocked at a very high level", () => {
    const { unlocked, locked } = partitionByUnlock(OPTIONS, 999);
    expect(unlocked).toHaveLength(3);
    expect(locked).toHaveLength(0);
  });

  it("only level-1 items are unlocked at level 1", () => {
    const { unlocked, locked } = partitionByUnlock(OPTIONS, 1);
    expect(unlocked.map((o) => o.value)).toEqual(["a"]);
    expect(locked).toHaveLength(2);
  });
});

describe("unlockedValues", () => {
  it("returns just the raw values that are unlocked", () => {
    expect(unlockedValues(OPTIONS, 10)).toEqual(["a", "b", "c"]);
    expect(unlockedValues(OPTIONS, 1)).toEqual(["a"]);
  });
});

describe("isAvailable", () => {
  it("behaves like isUnlocked for ordinary, non-exclusive options", () => {
    expect(isAvailable(OPTIONS[1], 5, new Set())).toBe(true);
    expect(isAvailable(OPTIONS[1], 4, new Set())).toBe(false);
  });

  it("an exclusive option is never available purely from leveling, no matter how high", () => {
    expect(isAvailable(EXCLUSIVE_OPTION, 999_999, new Set())).toBe(false);
  });

  it("an exclusive option becomes available once owned", () => {
    expect(isAvailable(EXCLUSIVE_OPTION, 1, new Set(["trophy-item"]))).toBe(true);
  });

  it("owning a different exclusive item doesn't unlock this one", () => {
    expect(isAvailable(EXCLUSIVE_OPTION, 1, new Set(["some-other-item"]))).toBe(false);
  });
});
