import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { MAX_BALLOONS, MAX_LEVEL, MIN_BALLOONS, MIN_LEVEL } from "./constants";
import {
  balloonCountForLevel,
  clampLevel,
  generateBalloon,
  generateBalloonSet,
  generateLayout,
  nextLevelOnSetComplete,
  opsForLevel,
  valueRangeForLevel,
} from "./logic";

describe("clampLevel", () => {
  it("clamps below the minimum", () => {
    expect(clampLevel(-3)).toBe(MIN_LEVEL);
  });
  it("clamps above the maximum", () => {
    expect(clampLevel(99)).toBe(MAX_LEVEL);
  });
  it("falls back to the minimum on NaN", () => {
    expect(clampLevel(Number.NaN)).toBe(MIN_LEVEL);
  });
  it("keeps in-range values unchanged", () => {
    expect(clampLevel(5)).toBe(5);
  });
});

describe("balloonCountForLevel", () => {
  it("starts at MIN_BALLOONS for the lowest level", () => {
    expect(balloonCountForLevel(MIN_LEVEL)).toBe(MIN_BALLOONS);
  });
  it("reaches MAX_BALLOONS at the highest level", () => {
    expect(balloonCountForLevel(MAX_LEVEL)).toBe(MAX_BALLOONS);
  });
  it("never decreases as the level increases (monotonic)", () => {
    let prev = 0;
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const count = balloonCountForLevel(level);
      expect(count).toBeGreaterThanOrEqual(prev);
      prev = count;
    }
  });
  it("never exceeds the configured bounds", () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const count = balloonCountForLevel(level);
      expect(count).toBeGreaterThanOrEqual(MIN_BALLOONS);
      expect(count).toBeLessThanOrEqual(MAX_BALLOONS);
    }
  });
});

describe("opsForLevel", () => {
  it("only offers plain positive numbers at the lowest levels", () => {
    expect(opsForLevel(1)).toEqual(["num"]);
    expect(opsForLevel(2)).toEqual(["num"]);
  });
  it("unlocks addition by level 3", () => {
    expect(opsForLevel(3)).toContain("add");
    expect(opsForLevel(3)).toContain("num");
  });
  it("unlocks subtraction by level 5", () => {
    expect(opsForLevel(5)).toContain("sub");
  });
  it("drops plain numbers and unlocks multiplication by level 7", () => {
    expect(opsForLevel(7)).not.toContain("num");
    expect(opsForLevel(7)).toContain("mul");
  });
  it("unlocks division at the highest levels", () => {
    expect(opsForLevel(9)).toContain("div");
    expect(opsForLevel(10)).toContain("div");
  });

  it("introduces negative numbers gradually, starting at level 3", () => {
    expect(opsForLevel(1)).not.toContain("negNum");
    expect(opsForLevel(2)).not.toContain("negNum");
    expect(opsForLevel(3)).toContain("negNum");
  });
  it("introduces negative-result subtraction by level 5", () => {
    expect(opsForLevel(4)).not.toContain("subNeg");
    expect(opsForLevel(5)).toContain("subNeg");
  });
  it("introduces negative addends by level 7", () => {
    expect(opsForLevel(6)).not.toContain("addNeg");
    expect(opsForLevel(7)).toContain("addNeg");
  });
  it("introduces negative multiplication only at the highest levels", () => {
    expect(opsForLevel(8)).not.toContain("mulNeg");
    expect(opsForLevel(MAX_LEVEL)).toContain("mulNeg");
  });
});

describe("valueRangeForLevel", () => {
  it("never decreases as the level increases (monotonic)", () => {
    let prev = 0;
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const max = valueRangeForLevel(level);
      expect(max).toBeGreaterThanOrEqual(prev);
      prev = max;
    }
  });
  it("is always large enough for MAX_BALLOONS unique values", () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      expect(valueRangeForLevel(level)).toBeGreaterThanOrEqual(MAX_BALLOONS * 2);
    }
  });
});

describe("generateBalloon", () => {
  it("num: label is the value itself", () => {
    const { value, label } = generateBalloon("num", 1, mulberry32(1));
    expect(label).toBe(String(value));
    expect(value).toBeGreaterThanOrEqual(1);
  });

  it("add: label matches 'a + b' and a + b === value", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { value, label } = generateBalloon("add", 5, mulberry32(seed));
      const m = label.match(/^(\d+) \+ (\d+)$/);
      expect(m).not.toBeNull();
      const [, a, b] = m!;
      expect(Number(a) + Number(b)).toBe(value);
    }
  });

  it("sub: label matches 'a − b', a - b === value, and value is never negative", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { value, label } = generateBalloon("sub", 6, mulberry32(seed));
      const m = label.match(/^(\d+) − (\d+)$/);
      expect(m).not.toBeNull();
      const [, a, b] = m!;
      expect(Number(a) - Number(b)).toBe(value);
      expect(value).toBeGreaterThanOrEqual(1);
    }
  });

  it("mul: label matches 'a × b' and a * b === value", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { value, label } = generateBalloon("mul", 8, mulberry32(seed));
      const m = label.match(/^(\d+) × (\d+)$/);
      expect(m).not.toBeNull();
      const [, a, b] = m!;
      expect(Number(a) * Number(b)).toBe(value);
    }
  });

  it("div: label matches 'a ÷ b', a / b is exact, and a / b === value", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { value, label } = generateBalloon("div", 10, mulberry32(seed));
      const m = label.match(/^(\d+) ÷ (\d+)$/);
      expect(m).not.toBeNull();
      const [, a, b] = m!;
      expect(Number(a) % Number(b)).toBe(0);
      expect(Number(a) / Number(b)).toBe(value);
    }
  });

  it("negNum: label is the value itself, and the value is always negative", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { value, label } = generateBalloon("negNum", 5, mulberry32(seed));
      expect(label).toBe(String(value));
      expect(value).toBeLessThan(0);
    }
  });

  it("subNeg: label matches 'a − b', a - b === value, and value is always negative", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { value, label } = generateBalloon("subNeg", 6, mulberry32(seed));
      const m = label.match(/^(\d+) − (\d+)$/);
      expect(m).not.toBeNull();
      const [, a, b] = m!;
      expect(Number(a) - Number(b)).toBe(value);
      expect(value).toBeLessThan(0);
    }
  });

  it("addNeg: label matches 'a + b' with a negative first term, and a + b === value", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { value, label } = generateBalloon("addNeg", 8, mulberry32(seed));
      const m = label.match(/^(-\d+) \+ (\d+)$/);
      expect(m).not.toBeNull();
      const [, a, b] = m!;
      expect(Number(a)).toBeLessThan(0);
      expect(Number(a) + Number(b)).toBe(value);
    }
  });

  it("mulNeg: label matches 'a × (b)' with a negative b, and a * b === value", () => {
    for (let seed = 0; seed < 20; seed++) {
      const { value, label } = generateBalloon("mulNeg", 10, mulberry32(seed));
      const m = label.match(/^(\d+) × \((-\d+)\)$/);
      expect(m).not.toBeNull();
      const [, a, b] = m!;
      expect(Number(b)).toBeLessThan(0);
      expect(Number(a) * Number(b)).toBe(value);
      expect(value).toBeLessThan(0);
    }
  });
});

describe("generateBalloonSet", () => {
  it("returns balloonCountForLevel(level) balloons with unique values", () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      const { balloons, sortedIds } = generateBalloonSet(level, mulberry32(level * 7), 1);
      expect(balloons).toHaveLength(balloonCountForLevel(level));
      const values = balloons.map((b) => b.value);
      expect(new Set(values).size).toBe(values.length);
      expect(sortedIds).toHaveLength(balloons.length);
    }
  });

  it("sortedIds reflects ascending order of balloon values", () => {
    const { balloons, sortedIds } = generateBalloonSet(6, mulberry32(42), 1);
    const byId = new Map(balloons.map((b) => [b.id, b]));
    const sortedValues = sortedIds.map((id) => byId.get(id)!.value);
    for (let i = 1; i < sortedValues.length; i++) {
      expect(sortedValues[i]).toBeGreaterThan(sortedValues[i - 1]);
    }
  });

  it("assigns ids starting from startId", () => {
    const { balloons } = generateBalloonSet(1, mulberry32(3), 100);
    const ids = balloons.map((b) => b.id).sort((a, b) => a - b);
    expect(ids[0]).toBe(100);
    expect(ids[ids.length - 1]).toBe(100 + balloons.length - 1);
  });

  it("places every balloon within [0,1] bounds", () => {
    const { balloons } = generateBalloonSet(9, mulberry32(17), 1);
    for (const b of balloons) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(1);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateBalloonSet(5, mulberry32(99), 1);
    const b = generateBalloonSet(5, mulberry32(99), 1);
    expect(a).toEqual(b);
  });

  it("orders negative and positive values correctly at high levels", () => {
    let sawNegative = false;
    for (let seed = 0; seed < 30; seed++) {
      const { balloons, sortedIds } = generateBalloonSet(MAX_LEVEL, mulberry32(seed), 1);
      const byId = new Map(balloons.map((b) => [b.id, b]));
      const sortedValues = sortedIds.map((id) => byId.get(id)!.value);
      for (let i = 1; i < sortedValues.length; i++) {
        expect(sortedValues[i]).toBeGreaterThan(sortedValues[i - 1]);
      }
      if (sortedValues.some((v) => v < 0)) sawNegative = true;
    }
    expect(sawNegative).toBe(true);
  });

  it("keeps the early levels mostly (or entirely) positive", () => {
    for (let seed = 0; seed < 10; seed++) {
      const { balloons } = generateBalloonSet(MIN_LEVEL, mulberry32(seed), 1);
      expect(balloons.every((b) => b.value >= 0)).toBe(true);
    }
  });
});

describe("nextLevelOnSetComplete", () => {
  it("increases the level by one", () => {
    expect(nextLevelOnSetComplete(3)).toBe(4);
  });
  it("never grows past the maximum", () => {
    expect(nextLevelOnSetComplete(MAX_LEVEL)).toBe(MAX_LEVEL);
  });
});

describe("generateLayout", () => {
  it("returns `count` positions, each within [0,1]", () => {
    for (const count of [MIN_BALLOONS, 6, 7, MAX_BALLOONS]) {
      const positions = generateLayout(count, mulberry32(count));
      expect(positions).toHaveLength(count);
      for (const { x, y } of positions) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("never places two balloons in the same grid cell (no overlap)", () => {
    for (const count of [MIN_BALLOONS, 6, 7, MAX_BALLOONS]) {
      const positions = generateLayout(count, mulberry32(count * 31));
      const cols = Math.ceil(Math.sqrt(count));
      const cells = new Set<string>();
      for (const { x, y } of positions) {
        const cellCol = Math.floor(x * cols);
        const cellRow = Math.floor(y * cols);
        const key = `${cellRow},${cellCol}`;
        expect(cells.has(key)).toBe(false);
        cells.add(key);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateLayout(8, mulberry32(123));
    const b = generateLayout(8, mulberry32(123));
    expect(a).toEqual(b);
  });
});
