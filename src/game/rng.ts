/** A deterministic random source: returns a float in [0, 1). */
export type Rng = () => number;

/**
 * mulberry32 — a tiny, fast, well-distributed seeded PRNG.
 * Deterministic for a given seed, which is what makes the game logic testable.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
