export interface Coords {
  lat: number;
  lon: number;
}

export type FeatureKind = "road" | "landmark" | "park" | "school" | "business" | "intersection";

export interface MapFeature extends Coords {
  id: string;
  name: string;
  kind: FeatureKind;
  /** Google user rating (1-5), when available. */
  rating?: number;
}

export type CompassDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type DirectionQuestionKind =
  | "basic-direction"
  | "closest"
  | "furthest"
  | "relative-position"
  | "distance-ranking"
  | "map-memory"
  | "advanced-navigation"
  | "highway-navigation"
  | "place-rating"
  | "heading"
  | "between"
  | "ai-generated";

/** A single turn-by-turn step of a route, from OSRM. */
export interface RouteStep {
  roadName: string;
  distanceM: number;
  maneuverType: string;
  modifier?: string;
  isHighway: boolean;
}

/** A real driving route from the player's location to one nearby feature. */
export interface RouteInfo {
  destinationFeatureId: string;
  destinationName: string;
  totalDistanceM: number;
  /** Estimated drive time in seconds, from Google Directions. */
  durationSec: number;
  steps: RouteStep[];
  /** Full route geometry (one coordinate per shape point), for distance-to-route calculations. */
  polyline: Coords[];
}

export interface DirectionQuestion {
  id: number;
  kind: DirectionQuestionKind;
  prompt: string;
  choices: string[];
  correctIndex: number;
  /** Map-memory questions only: briefly shown before the question/choices appear. */
  showMapFirst?: boolean;
}

export type DirectionPhase = "idle" | "locating" | "loading" | "playing" | "over" | "error";

export interface DirectionLastResult {
  questionId: number;
  chosenIndex: number;
  correct: boolean;
}

export interface DirectionState {
  phase: DirectionPhase;
  origin: Coords | null;
  features: MapFeature[];
  routes: RouteInfo[];
  /** Pre-fetched AI-generated questions, drawn from during gameplay. */
  aiQuestionPool: DirectionQuestion[];
  question: DirectionQuestion | null;
  score: number;
  timeLeftMs: number;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  nextId: number;
  lastResult: DirectionLastResult | null;
  flashId: number;
  errorMessage: string | null;
}

export type DirectionAction =
  | { type: "START" }
  | { type: "LOCATED"; origin: Coords }
  | { type: "FEATURES_LOADED"; features: MapFeature[]; routes: RouteInfo[] }
  | { type: "AI_QUESTIONS_LOADED"; questions: DirectionQuestion[] }
  | { type: "LOAD_FAILED"; message: string }
  | { type: "ANSWER"; questionId: number; choiceIndex: number }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
