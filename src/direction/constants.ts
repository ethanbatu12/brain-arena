/** Tuning knobs for Direction Challenge. */
export const DIRECTION_GAME_MS = 3 * 60_000; // 3-minute round

export const POINTS_PER_CORRECT = 100;
export const BONUS_EVERY_CORRECT = 5;
export const BONUS_POINTS = 100;

/** Radius (meters) searched around the player for map features. */
export const SEARCH_RADIUS_M = 1500;

/** Minimum number of features required to generate questions reliably. */
export const MIN_FEATURES_REQUIRED = 4;

/** How long a map-memory question shows the map before hiding it (ms). */
export const MAP_MEMORY_REVEAL_MS = 4_000;

export const QUESTION_KINDS = [
  "basic-direction",
  "closest",
  "furthest",
  "relative-position",
  "distance-ranking",
  "map-memory",
  "advanced-navigation",
] as const;

/** Overpass API endpoint — free, no API key required. */
export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/** Nominatim geocoding endpoint — free, no API key required (OpenStreetMap). */
export const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/** OSRM public demo routing server — free, no API key required. */
export const OSRM_URL = "https://router.project-osrm.org";

/** How many sample routes to fetch per game (for highway-navigation questions). */
export const MAX_SAMPLE_ROUTES = 3;
