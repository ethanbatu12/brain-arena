/** Tuning knobs for Brain Blitz Trivia. */
export const TRIVIA_GAME_MS = 60_000; // 60-second sprint, same as the other games

export const POINTS_PER_CORRECT = 75;
export const BONUS_EVERY_CORRECT = 5; // every Nth correct answer earns a bonus
export const BONUS_POINTS = 25;

export const MIN_BAND = 1;
export const MAX_BAND = 6;

/** Difficulty band increases by 1 every N questions answered (correct or not). */
export const QUESTIONS_PER_BAND_STEP = 4;

export const DIFFICULTY_LABELS = ["beginner", "easy", "medium", "hard", "expert", "master"] as const;

export const CATEGORIES = ["math", "logic", "patterns", "probability", "observation", "chess", "general"] as const;

export const CATEGORY_META: Record<(typeof CATEGORIES)[number], { icon: string; label: string }> = {
  math: { icon: "🔢", label: "Math" },
  logic: { icon: "🧠", label: "Logic" },
  patterns: { icon: "🧩", label: "Patterns" },
  probability: { icon: "🎲", label: "Probability" },
  observation: { icon: "👁️", label: "Observation" },
  chess: { icon: "♟️", label: "Chess" },
  general: { icon: "🌍", label: "General Knowledge" },
};

/** How long an observation grid is shown before it's hidden and the question appears (ms). */
export const OBSERVATION_REVEAL_MS = 2_500;
