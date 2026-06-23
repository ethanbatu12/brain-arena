export interface Coords {
  lat: number;
  lon: number;
}

export type FeatureKind = "road" | "landmark" | "park" | "school" | "business" | "intersection";

export interface MapFeature extends Coords {
  id: string;
  name: string;
  kind: FeatureKind;
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
  | "highway-navigation";

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
  steps: RouteStep[];
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
  | { type: "LOAD_FAILED"; message: string }
  | { type: "ANSWER"; questionId: number; choiceIndex: number }
  | { type: "TICK"; deltaMs: number }
  | { type: "RESET" };
