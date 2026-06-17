/** Total time for one Pattern game session. */
export const PATTERN_GAME_MS = 60_000;

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

/** Adaptive difficulty — level drifts toward the player's true skill. */
export const LEVEL_UP   = 0.4; // per correct answer
export const LEVEL_DOWN = 0.6; // per wrong answer

/** Base points for a correct answer; scaled by level. */
export const BASE_POINTS = 50;

/** Bonus awarded every N consecutive correct answers. */
export const BONUS_EVERY  = 5;
export const BONUS_POINTS = 50;
