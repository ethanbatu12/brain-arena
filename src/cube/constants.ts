/** Tuning knobs for the Logic Challenge (cube-counting) sprint. */
export const CUBE_GAME_MS = 60_000; // 60-second sprint, same as the other games

export const POINTS_PER_CORRECT = 100;
export const BONUS_EVERY = 5; // every Nth correct answer in a row earns a bonus
export const BONUS_POINTS = 25;

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

/** Correct answers needed before the level (and difficulty) advances by one. */
export const LEVEL_UP_EVERY = 2;

/** Footprint grows from 2x2 (levels 1-2) to 5x5 (levels 7-10). */
export const MIN_FOOTPRINT = 2;
export const MAX_FOOTPRINT = 5;

/** Max stack height grows from 1 (levels 1-2) to 5 (levels 9-10). */
export const MIN_HEIGHT = 1;
export const MAX_HEIGHT = 5;

/** Longest guess the input will accept (max total = 5*5*5 = 125). */
export const MAX_INPUT_LEN = 3;
