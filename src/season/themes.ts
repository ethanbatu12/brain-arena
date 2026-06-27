export interface SeasonTheme {
  id: string;
  name: string;
  /** [start, end] gradient colors used for the season's UI accent/artwork. */
  colors: [string, string];
}

/**
 * The rotation of season themes — cycles in this order forever (season 0 is
 * Space, season 1 is Sports, ... season 7 is Space again, etc). Adding a new
 * theme is just appending an entry here; nothing else needs to change.
 */
export const THEMES: SeasonTheme[] = [
  { id: "space", name: "Space Season", colors: ["#6366f1", "#0ea5e9"] },
  { id: "sports", name: "Sports Season", colors: ["#22c55e", "#16a34a"] },
  { id: "winter", name: "Winter Season", colors: ["#7dd3fc", "#1e3a8a"] },
  { id: "summer", name: "Summer Season", colors: ["#fbbf24", "#f97316"] },
  { id: "halloween", name: "Halloween Season", colors: ["#f97316", "#581c87"] },
  { id: "chess-masters", name: "Chess Masters Season", colors: ["#94a3b8", "#1e293b"] },
  { id: "neon", name: "Neon Season", colors: ["#f0abfc", "#22d3ee"] },
];

export function getTheme(id: string): SeasonTheme | undefined {
  return THEMES.find((t) => t.id === id);
}
