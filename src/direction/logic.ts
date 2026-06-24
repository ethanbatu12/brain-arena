/**
 * Procedural question generation from a player's real surroundings.
 * Every generator is a pure function of (origin, features, rng, id), so the
 * exact same machinery that drives the real game is fully unit-testable
 * with a fixed mock feature list and seeded rng — no network, no GPS.
 */
import type { Rng } from "../game/rng";
import { BONUS_EVERY_CORRECT, BONUS_POINTS, MIN_FEATURES_REQUIRED, POINTS_PER_CORRECT, QUESTION_KINDS } from "./constants";
import { bearingDegrees, directionFrom, offsetCoords, sortByDistance } from "./geo";
import { buildChoices, pick, shuffle } from "./utils";
import type { CompassDirection, Coords, DirectionQuestion, DirectionQuestionKind, MapFeature, RouteInfo, RouteStep } from "./types";

const DIRECTION_WORDS: Record<CompassDirection, string> = {
  N: "north",
  NE: "northeast",
  E: "east",
  SE: "southeast",
  S: "south",
  SW: "southwest",
  W: "west",
  NW: "northwest",
};

const KIND_LABELS: Record<MapFeature["kind"], string> = {
  road: "road",
  landmark: "landmark",
  park: "park",
  school: "school",
  business: "business",
  intersection: "intersection",
};

function kindLabel(feature: MapFeature): string {
  return KIND_LABELS[feature.kind];
}

const DECOY_NAMES = [
  "Sunset Avenue",
  "Lincoln Park",
  "Cedar Street School",
  "Maple Street",
  "Riverside Drive",
  "Harbor Plaza",
  "Birchwood Lane",
  "Founders Square",
];

function decoyNamesNotIn(features: MapFeature[], rng: Rng, count: number): string[] {
  const used = new Set(features.map((f) => f.name));
  const pool = DECOY_NAMES.filter((n) => !used.has(n));
  return shuffle(pool, rng).slice(0, count);
}

function namesExcluding(features: MapFeature[], exclude: MapFeature[]): string[] {
  const excluded = new Set(exclude.map((f) => f.id));
  return features.filter((f) => !excluded.has(f.id)).map((f) => f.name);
}

// ── individual question builders ───────────────────────────────────────────

const BASIC_DIRECTION_TEMPLATES = [
  (kind: string, dir: string) => `Which ${kind} is ${dir} of your location?`,
  (kind: string, dir: string) => `If you look ${dir}, which ${kind} would you be facing?`,
  (kind: string, dir: string) => `Which ${kind} lies to the ${dir} of where you are now?`,
  (kind: string, dir: string) => `Heading ${dir} from here, which ${kind} is in that direction?`,
  (kind: string, dir: string) => `Which ${kind} sits ${dir} of your current location?`,
];

function buildBasicDirection(origin: Coords, features: MapFeature[], rng: Rng, id: number): DirectionQuestion {
  const target = pick(features, rng);
  const dir = directionFrom(origin, target);
  const template = pick(BASIC_DIRECTION_TEMPLATES, rng);
  const prompt = template(kindLabel(target), DIRECTION_WORDS[dir]);
  const { choices, correctIndex } = buildChoices(rng, target.name, namesExcluding(features, [target]));
  return { id, kind: "basic-direction", prompt, choices, correctIndex };
}

const CLOSEST_TEMPLATES = [
  (ref: string) => `Which location is closest to ${ref}?`,
  (ref: string) => `Out of these, which is nearest to ${ref}?`,
  (ref: string) => `Which place is the shortest distance from ${ref}?`,
  (ref: string) => `Which of these would you reach first starting from ${ref}?`,
];

const FURTHEST_TEMPLATES = [
  (ref: string) => `Which location is furthest from ${ref}?`,
  (ref: string) => `Which of these is farthest away from ${ref}?`,
  (ref: string) => `Out of these, which is the most distant from ${ref}?`,
  (ref: string) => `Which place would take the longest to reach from ${ref}?`,
];

function buildClosest(origin: Coords, features: MapFeature[], rng: Rng, id: number): DirectionQuestion {
  const useReference = features.length >= 5 && rng() < 0.5;
  const reference = useReference ? pick(features, rng) : null;
  const refPoint: Coords = reference ?? origin;
  const pool = reference ? features.filter((f) => f.id !== reference.id) : features;
  const sorted = sortByDistance(refPoint, pool);
  const correct = sorted[0];
  const refLabel = reference ? reference.name : "your location";
  const prompt = pick(CLOSEST_TEMPLATES, rng)(refLabel);
  const { choices, correctIndex } = buildChoices(rng, correct.name, namesExcluding(pool, [correct]));
  return { id, kind: "closest", prompt, choices, correctIndex };
}

function buildFurthest(origin: Coords, features: MapFeature[], rng: Rng, id: number): DirectionQuestion {
  const useReference = features.length >= 5 && rng() < 0.5;
  const reference = useReference ? pick(features, rng) : null;
  const refPoint: Coords = reference ?? origin;
  const pool = reference ? features.filter((f) => f.id !== reference.id) : features;
  const sorted = sortByDistance(refPoint, pool);
  const correct = sorted[sorted.length - 1];
  const refLabel = reference ? reference.name : "your location";
  const prompt = pick(FURTHEST_TEMPLATES, rng)(refLabel);
  const { choices, correctIndex } = buildChoices(rng, correct.name, namesExcluding(pool, [correct]));
  return { id, kind: "furthest", prompt, choices, correctIndex };
}

const RELATIVE_POSITION_TEMPLATES = [
  (dir: string, ref: string) => `Which location is ${dir} of ${ref}?`,
  (dir: string, ref: string) => `What's located ${dir} of ${ref}?`,
  (dir: string, ref: string) => `Looking ${dir} from ${ref}, which place is there?`,
  (dir: string, ref: string) => `Which place sits ${dir} of ${ref}?`,
];

function buildRelativePosition(_origin: Coords, features: MapFeature[], rng: Rng, id: number): DirectionQuestion {
  const reference = pick(features, rng);
  const others = features.filter((f) => f.id !== reference.id);
  const target = pick(others, rng);
  const dir = directionFrom(reference, target);
  const prompt = pick(RELATIVE_POSITION_TEMPLATES, rng)(DIRECTION_WORDS[dir], reference.name);
  const { choices, correctIndex } = buildChoices(rng, target.name, namesExcluding(others, [target]));
  return { id, kind: "relative-position", prompt, choices, correctIndex };
}

function permutationsOf3<T>(items: [T, T, T]): T[][] {
  const [a, b, c] = items;
  return [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a],
  ];
}

const DISTANCE_RANKING_TEMPLATES = [
  (listed: string) => `Order these locations from closest to furthest: ${listed}`,
  (listed: string) => `Rank these from nearest to farthest: ${listed}`,
  (listed: string) => `Which order puts these from closest to farthest away: ${listed}?`,
];

function buildDistanceRanking(origin: Coords, features: MapFeature[], rng: Rng, id: number): DirectionQuestion {
  const sample = shuffle(features, rng).slice(0, 3) as [MapFeature, MapFeature, MapFeature];
  const correctOrder = sortByDistance(origin, sample).map((f) => f.name);
  const correctStr = correctOrder.join(" → ");
  const allPerms = permutationsOf3(correctOrder as [string, string, string])
    .map((p) => p.join(" → "))
    .filter((p) => p !== correctStr);
  const distractors = shuffle(allPerms, rng).slice(0, 3);
  const listed = shuffle(sample, rng).map((f) => f.name).join(", ");
  const prompt = pick(DISTANCE_RANKING_TEMPLATES, rng)(listed);
  const { choices, correctIndex } = buildChoices(rng, correctStr, distractors);
  return { id, kind: "distance-ranking", prompt, choices, correctIndex };
}

const MAP_MEMORY_WHICH_SHOWN_TEMPLATES = [
  () => "Which of these locations appeared on the map you saw?",
  () => "Which one of these did you actually see on the map?",
  () => "Which of these was on the map a moment ago?",
];
const MAP_MEMORY_CLOSEST_TEMPLATES = [
  () => "Which location was closest to your location on the map you saw?",
  () => "Of the places shown, which was nearest to you?",
  () => "On the map you saw, which place was closest to your position?",
];
const MAP_MEMORY_DIRECTION_TEMPLATES = [
  (dir: string) => `Which location was ${dir} of your location on the map you saw?`,
  (dir: string) => `On the map you saw, which place was to the ${dir}?`,
  (dir: string) => `Which place appeared ${dir} of you on that map?`,
];

function buildMapMemory(origin: Coords, features: MapFeature[], rng: Rng, id: number): DirectionQuestion {
  const variant = pick(["which-shown", "closest", "direction"] as const, rng);

  if (variant === "which-shown") {
    const shown = pick(features, rng);
    const distractors = decoyNamesNotIn(features, rng, 3);
    const prompt = pick(MAP_MEMORY_WHICH_SHOWN_TEMPLATES, rng)();
    const { choices, correctIndex } = buildChoices(rng, shown.name, distractors);
    return { id, kind: "map-memory", prompt, choices, correctIndex, showMapFirst: true };
  }

  if (variant === "closest") {
    const sorted = sortByDistance(origin, features);
    const correct = sorted[0];
    const prompt = pick(MAP_MEMORY_CLOSEST_TEMPLATES, rng)();
    const { choices, correctIndex } = buildChoices(rng, correct.name, namesExcluding(features, [correct]));
    return { id, kind: "map-memory", prompt, choices, correctIndex, showMapFirst: true };
  }

  const target = pick(features, rng);
  const dir = directionFrom(origin, target);
  const prompt = pick(MAP_MEMORY_DIRECTION_TEMPLATES, rng)(DIRECTION_WORDS[dir]);
  const { choices, correctIndex } = buildChoices(rng, target.name, namesExcluding(features, [target]));
  return { id, kind: "map-memory", prompt, choices, correctIndex, showMapFirst: true };
}

const WAYPOINT_TEMPLATES = [
  () => "If you travel north then east from your location, which of these would you reach first?",
  () => "Heading north and then turning east, which place would you come across first?",
  () => "Starting north then east from here, which of these is closest to that path?",
];
const DIAGONAL_TEMPLATES = [
  (dir: string) => `Which location is most directly ${dir} of your location?`,
  (dir: string) => `Out of these, which is positioned most precisely to the ${dir}?`,
  (dir: string) => `Which place is closest to due ${dir} of where you are?`,
];

function buildAdvancedNavigation(origin: Coords, features: MapFeature[], rng: Rng, id: number): DirectionQuestion {
  const variant = pick(["waypoint", "diagonal"] as const, rng);

  if (variant === "waypoint") {
    const waypoint = offsetCoords(origin, 400, 400);
    const correct = sortByDistance(waypoint, features)[0];
    const prompt = pick(WAYPOINT_TEMPLATES, rng)();
    const { choices, correctIndex } = buildChoices(rng, correct.name, namesExcluding(features, [correct]));
    return { id, kind: "advanced-navigation", prompt, choices, correctIndex };
  }

  const dir = pick(["NE", "SE", "SW", "NW"] as const, rng);
  const targetDegrees: Record<CompassDirection, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
  const angularDiff = (feature: MapFeature) => {
    const bearing = bearingDegrees(origin, feature);
    const diff = ((bearing - targetDegrees[dir] + 180) % 360 + 360) % 360 - 180;
    return Math.abs(diff);
  };
  const sorted = [...features].sort((a, b) => angularDiff(a) - angularDiff(b));
  const correct = sorted[0];
  const prompt = pick(DIAGONAL_TEMPLATES, rng)(DIRECTION_WORDS[dir]);
  const { choices, correctIndex } = buildChoices(rng, correct.name, namesExcluding(features, [correct]));
  return { id, kind: "advanced-navigation", prompt, choices, correctIndex };
}

// ── highway-navigation (real turn-by-turn routes via OSRM) ─────────────────

function firstTurnStep(route: RouteInfo): RouteStep | undefined {
  return route.steps.find((s) => s.maneuverType !== "depart" && s.maneuverType !== "arrive");
}

function bucketModifier(modifier: string | undefined): "left" | "right" | "straight" | "u-turn" {
  if (!modifier) return "straight";
  if (modifier.includes("uturn")) return "u-turn";
  if (modifier.includes("left")) return "left";
  if (modifier.includes("right")) return "right";
  return "straight";
}

function countTurns(route: RouteInfo): number {
  return route.steps.filter((s) => s.maneuverType !== "depart" && s.maneuverType !== "arrive").length;
}

type HighwayVariant = "turns-to-highway" | "first-road" | "distance" | "direction" | "total-turns" | "duration";
// turns-to-highway and total-turns appear twice each to weight "how many
// turns" questions more heavily, per request.
const HIGHWAY_VARIANTS: HighwayVariant[] = [
  "turns-to-highway",
  "turns-to-highway",
  "total-turns",
  "total-turns",
  "first-road",
  "distance",
  "direction",
  "duration",
];

const FIRST_ROAD_TEMPLATES = [
  (dest: string) => `Which road do you turn onto first when driving to ${dest}?`,
  (dest: string) => `What's the first road you turn onto on the way to ${dest}?`,
  (dest: string) => `Driving to ${dest}, which road comes first after your initial turn?`,
];

const ROUTE_DISTANCE_TEMPLATES = [
  (dest: string) => `About how far is the drive to ${dest}?`,
  (dest: string) => `Roughly how many kilometers is it to ${dest}?`,
  (dest: string) => `What's the approximate driving distance to ${dest}?`,
];

const FIRST_TURN_DIRECTION_TEMPLATES = [
  (dest: string) => `Which way do you turn first when driving to ${dest}?`,
  (dest: string) => `What's your first turn on the route to ${dest}?`,
  (dest: string) => `Driving to ${dest}, which direction is your first turn?`,
];

function buildHighwayNavigation(routes: RouteInfo[], rng: Rng, id: number): DirectionQuestion | null {
  const shuffledVariants = shuffle(HIGHWAY_VARIANTS, rng);
  for (const variant of shuffledVariants) {
    const route = pick(routes, rng);

    if (variant === "turns-to-highway") {
      const highwayIndex = route.steps.findIndex((s) => s.isHighway);
      if (highwayIndex <= 0) continue;
      const prompt = `On the route to ${route.destinationName}, how many turns until you reach the highway?`;
      const distractors = [highwayIndex + 1, Math.max(0, highwayIndex - 1), highwayIndex + 2].map(String);
      const { choices, correctIndex } = buildChoices(rng, String(highwayIndex), distractors);
      return { id, kind: "highway-navigation", prompt, choices, correctIndex };
    }

    if (variant === "total-turns") {
      const turns = countTurns(route);
      if (turns <= 0) continue;
      const prompt = `How many turns does it take to reach ${route.destinationName} from your location?`;
      const distractors = [turns + 1, Math.max(0, turns - 1), turns + 2].map(String);
      const { choices, correctIndex } = buildChoices(rng, String(turns), distractors);
      return { id, kind: "highway-navigation", prompt, choices, correctIndex };
    }

    if (variant === "duration") {
      if (route.durationSec <= 0) continue;
      const minutes = Math.max(1, Math.round(route.durationSec / 60));
      const distractors = [minutes + 2, Math.max(1, minutes - 2), minutes + 5].map((v) => `${v} min`);
      const prompt = `About how long would it take to drive to ${route.destinationName}?`;
      const { choices, correctIndex } = buildChoices(rng, `${minutes} min`, distractors);
      return { id, kind: "highway-navigation", prompt, choices, correctIndex };
    }

    if (variant === "first-road") {
      const step = firstTurnStep(route);
      if (!step) continue;
      const otherRoads = routes
        .filter((r) => r !== route)
        .map((r) => firstTurnStep(r)?.roadName)
        .filter((name): name is string => Boolean(name) && name !== step.roadName);
      const prompt = pick(FIRST_ROAD_TEMPLATES, rng)(route.destinationName);
      const { choices, correctIndex } = buildChoices(rng, step.roadName, otherRoads);
      return { id, kind: "highway-navigation", prompt, choices, correctIndex };
    }

    if (variant === "distance") {
      const km = Math.round(route.totalDistanceM / 100) / 10;
      const distractors = [km + 0.5, Math.max(0.1, km - 0.5), km + 1].map((v) => `${Math.round(v * 10) / 10} km`);
      const prompt = pick(ROUTE_DISTANCE_TEMPLATES, rng)(route.destinationName);
      const { choices, correctIndex } = buildChoices(rng, `${km} km`, distractors);
      return { id, kind: "highway-navigation", prompt, choices, correctIndex };
    }

    // direction
    const step = firstTurnStep(route);
    if (!step) continue;
    const correct = bucketModifier(step.modifier);
    const allDirections: Array<"left" | "right" | "straight" | "u-turn"> = ["left", "right", "straight", "u-turn"];
    const prompt = pick(FIRST_TURN_DIRECTION_TEMPLATES, rng)(route.destinationName);
    const { choices, correctIndex } = buildChoices(rng, correct, allDirections.filter((d) => d !== correct));
    return { id, kind: "highway-navigation", prompt, choices, correctIndex };
  }
  return null;
}

// ── place-rating (real Google user ratings) ────────────────────────────────

const RATING_QUESTION_TEMPLATES = [
  (kind: string) => `Which ${kind} has the highest rating?`,
  (kind: string) => `Out of these, which ${kind} is rated best by visitors?`,
  (kind: string) => `Which ${kind} do people rate the highest?`,
];

function buildPlaceRating(_origin: Coords, features: MapFeature[], rng: Rng, id: number): DirectionQuestion | null {
  const rated = features.filter((f) => f.rating !== undefined);
  if (rated.length < 2) return null;
  const sample = shuffle(rated, rng).slice(0, Math.min(4, rated.length));
  const best = sample.reduce((a, b) => (b.rating! > a.rating! ? b : a));
  const kind = kindLabel(best);
  const prompt = pick(RATING_QUESTION_TEMPLATES, rng)(kind);
  const { choices, correctIndex } = buildChoices(rng, best.name, namesExcluding(sample, [best]));
  return { id, kind: "place-rating", prompt, choices, correctIndex };
}

const GENERATORS: Record<
  Exclude<DirectionQuestionKind, "highway-navigation" | "place-rating">,
  (origin: Coords, features: MapFeature[], rng: Rng, id: number) => DirectionQuestion
> = {
  "basic-direction": buildBasicDirection,
  closest: buildClosest,
  furthest: buildFurthest,
  "relative-position": buildRelativePosition,
  "distance-ranking": buildDistanceRanking,
  "map-memory": buildMapMemory,
  "advanced-navigation": buildAdvancedNavigation,
};

/**
 * Generates one question from real map features (and, when available, real
 * driving routes / place ratings) around `origin`. Returns null if there
 * aren't enough features to build a well-formed question at all.
 */
export function makeQuestion(
  origin: Coords,
  features: MapFeature[],
  routes: RouteInfo[],
  rng: Rng,
  id: number,
): DirectionQuestion | null {
  if (features.length < MIN_FEATURES_REQUIRED) return null;
  const pool: DirectionQuestionKind[] = [...QUESTION_KINDS];
  // Pushed twice to weight navigation/turn questions more heavily, per request.
  if (routes.length > 0) pool.push("highway-navigation", "highway-navigation");
  if (features.filter((f) => f.rating !== undefined).length >= 2) pool.push("place-rating");

  for (let attempt = 0; attempt < 6; attempt++) {
    const kind = pick(pool, rng);
    if (kind === "highway-navigation") {
      const q = buildHighwayNavigation(routes, rng, id);
      if (q) return q;
      continue;
    }
    if (kind === "place-rating") {
      const q = buildPlaceRating(origin, features, rng, id);
      if (q) return q;
      continue;
    }
    return GENERATORS[kind](origin, features, rng, id);
  }
  return buildBasicDirection(origin, features, rng, id);
}

export { DIRECTION_WORDS };

/** Points earned for a single correct answer, before any bonus. */
export function pointsForCorrect(): number {
  return POINTS_PER_CORRECT;
}

/** Whether this correct-answer count (after incrementing) completes a bonus streak. */
export function isBonusCorrect(correctSoFar: number): boolean {
  return correctSoFar > 0 && correctSoFar % BONUS_EVERY_CORRECT === 0;
}

/** Total points awarded for a correct answer, including bonus if it completes a streak. */
export function scoreForCorrect(correctSoFar: number): number {
  return pointsForCorrect() + (isBonusCorrect(correctSoFar) ? BONUS_POINTS : 0);
}

/** Accuracy percentage, 0 when no questions have been answered. */
export function directionAccuracy(correctCount: number, totalAnswered: number): number {
  if (totalAnswered === 0) return 0;
  return (correctCount / totalAnswered) * 100;
}
