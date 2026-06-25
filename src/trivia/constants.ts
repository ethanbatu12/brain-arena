/** Tuning knobs for Mixed Trivia. */
export const TRIVIA_GAME_MS = 60_000; // 60-second sprint, same as the other games

export const POINTS_PER_CORRECT = 75;
export const BONUS_EVERY_CORRECT = 5; // every Nth correct answer earns a bonus
export const BONUS_POINTS = 25;

export const CATEGORIES = [
  "sports",
  "geography",
  "science",
  "history",
  "technology",
  "entertainment",
  "nature",
  "space",
  "math",
  "logic",
  "general",
] as const;

export const CATEGORY_META: Record<(typeof CATEGORIES)[number], { icon: string; label: string }> = {
  sports: { icon: "🏆", label: "Sports" },
  geography: { icon: "🌍", label: "Geography" },
  science: { icon: "🔬", label: "Science" },
  history: { icon: "📜", label: "History" },
  technology: { icon: "💻", label: "Technology" },
  entertainment: { icon: "🎬", label: "Entertainment" },
  nature: { icon: "🌿", label: "Nature" },
  space: { icon: "🚀", label: "Space" },
  math: { icon: "🔢", label: "Math" },
  logic: { icon: "🧠", label: "Logic" },
  general: { icon: "💡", label: "General Knowledge" },
};

export const DIFFICULTY_META: Record<string, { icon: string; label: string }> = {
  easy: { icon: "🟢", label: "Easy" },
  medium: { icon: "🟡", label: "Medium" },
  hard: { icon: "🟠", label: "Hard" },
  expert: { icon: "🔴", label: "Expert" },
};
