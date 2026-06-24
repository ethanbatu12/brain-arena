import { describe, expect, it } from "vitest";
import { isUnlocked, partitionByUnlock, unlockedValues } from "./unlocks";
import type { AvatarOption } from "./options";

const OPTIONS: AvatarOption<string>[] = [
  { value: "a", label: "A", unlockLevel: 1 },
  { value: "b", label: "B", unlockLevel: 5 },
  { value: "c", label: "C", unlockLevel: 10 },
];

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
