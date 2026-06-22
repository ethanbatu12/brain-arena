/** Tuning knobs for the Mental Math sprint. */
export const MATH_GAME_MS = 60_000; // 60-second sprint

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10; // level 10 ≈ 2-digit × 1-digit, the hardest band

/**
 * Adaptive difficulty: the level behaves like a rating that drifts toward the
 * player's true ability, so the questions stay at the edge of what they can do
 * quickly — a fair approximation of mental-math skill.
 * Up is gentle (≈3 correct per level), down is a touch faster so a player who
 * is struggling is eased back to a level they can sustain.
 */
export const LEVEL_UP = 0.34; // per correct answer
export const LEVEL_DOWN = 0.5; // per wrong answer

/** Longest answer the input will accept (keeps numeric parsing sane). */
export const MAX_INPUT_LEN = 4;

/** Every Nth correct answer earns a bonus. */
export const BONUS_EVERY_CORRECT = 5;
export const BONUS_POINTS = 25;
