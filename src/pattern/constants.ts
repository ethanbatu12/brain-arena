/** Total time for one Timed Pattern game session. */
export const PATTERN_GAME_MS = 60_000;

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

/** Adaptive difficulty — level drifts toward the player's true skill. */
export const LEVEL_UP   = 0.4; // per correct answer
export const LEVEL_DOWN = 0.6; // per wrong answer

/** Base points per correct answer in Timed mode; scales by level. */
export const BASE_POINTS = 75;

/** Bonus awarded every N correct answers in Timed mode. */
export const BONUS_EVERY  = 5;
export const BONUS_POINTS = 50;

// ── Rated Patterns constants ──────────────────────────────────────────────────

/** Starting rating for all new accounts in Rated Patterns. */
export const RATED_PATTERN_INITIAL_RATING = 600;

/** Rating gained per correct answer. */
export const RATED_PATTERN_GAIN = 15;

/** Rating lost when a wrong answer ends the run. */
export const RATED_PATTERN_LOSS = 25;

/** How many rating history entries to keep (for sparkline / recent history). */
export const RATED_PATTERN_HISTORY_SIZE = 20;
