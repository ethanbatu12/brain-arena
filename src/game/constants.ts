/**
 * Central tuning knobs for the Memory Matrix game.
 * Kept in one place so balance changes never require touching logic.
 */
export const GRID_MIN = 2; // smallest the board can shrink to
export const GRID_MAX = 8; // largest the board can grow to (8x8 = 64 cells)
export const GRID_START = 2; // starting board size

// How long the pattern is shown. Bigger boards reveal longer (more to memorize).
export const MEMORIZE_MS_SMALL = 4000; // small boards
export const MEMORIZE_MS_LARGE = 5000; // boards from MEMORIZE_LARGE_FROM and up
export const MEMORIZE_LARGE_FROM = 4; // 4×4 and larger get the longer reveal

export const FEEDBACK_MS = 650; // pause showing the answer after a round ends
export const GAME_MS = 60_000; // total play time per game (60 seconds)

/** Points earned per lit box in a perfectly completed sequence. */
export const POINTS_PER_BOX = 15;

/** Fraction of the board that lights up. Higher = harder. */
export const FILL_RATIO = 0.3;

/** Consecutive wins at the current size required before the board grows. */
export const GROWTH_STREAK = 2;

/** Every Nth round won (all-or-nothing) earns a bonus. */
export const BONUS_EVERY_ROUNDS = 5;
export const BONUS_POINTS = 25;
