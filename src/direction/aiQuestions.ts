/**
 * AI-generated direction questions via Claude.
 * Called once during the loading phase with the player's real surroundings;
 * returns a pre-fetched pool of questions that mix into gameplay alongside
 * the procedurally-generated ones. Fails silently — if the API is down or
 * the key is missing, the game just uses procedural questions only.
 */
import Anthropic from "@anthropic-ai/sdk";
import { bearingDegrees, compassDirection, distanceMeters } from "./geo";
import type { Coords, DirectionQuestion, MapFeature, RouteInfo } from "./types";

const DIRECTION_WORDS: Record<string, string> = {
  N: "north", NE: "northeast", E: "east", SE: "southeast",
  S: "south", SW: "southwest", W: "west", NW: "northwest",
};

interface FeatureContext {
  name: string;
  kind: string;
  direction: string;
  distanceM: number;
  rating?: number;
}

interface RouteContext {
  destination: string;
  distanceKm: number;
  durationMin: number;
  firstTurn?: string;
  totalTurns: number;
}

function buildFeatureContext(origin: Coords, features: MapFeature[]): FeatureContext[] {
  return features.map((f) => ({
    name: f.name,
    kind: f.kind,
    direction: DIRECTION_WORDS[compassDirection(bearingDegrees(origin, f))] ?? "nearby",
    distanceM: Math.round(distanceMeters(origin, f)),
    rating: f.rating,
  }));
}

function buildRouteContext(routes: RouteInfo[]): RouteContext[] {
  return routes.map((r) => {
    const firstTurnStep = r.steps.find(
      (s) => s.maneuverType !== "depart" && s.maneuverType !== "arrive",
    );
    const totalTurns = r.steps.filter(
      (s) => s.maneuverType !== "depart" && s.maneuverType !== "arrive",
    ).length;
    return {
      destination: r.destinationName,
      distanceKm: Math.round(r.totalDistanceM / 100) / 10,
      durationMin: Math.max(1, Math.round(r.durationSec / 60)),
      firstTurn: firstTurnStep?.modifier,
      totalTurns,
    };
  });
}

function buildPrompt(features: FeatureContext[], routes: RouteContext[]): string {
  const featureList = features
    .map((f) => `- ${f.name} (${f.kind}): ${f.direction}, ${f.distanceM}m away${f.rating ? `, rated ${f.rating}/5` : ""}`)
    .join("\n");

  const routeList = routes.length > 0
    ? routes
        .map((r) => `- ${r.destination}: ${r.distanceKm}km, ~${r.durationMin} min drive, ${r.totalTurns} turns total${r.firstTurn ? `, first turn is ${r.firstTurn}` : ""}`)
        .join("\n")
    : "No driving routes available.";

  return `You are generating geography quiz questions for a game called Direction Challenge. The player is at a real location and these are the actual nearby landmarks:

NEARBY PLACES:
${featureList}

DRIVING ROUTES:
${routeList}

Generate exactly 12 multiple-choice questions about these real places. Use the ACTUAL place names from the list above. Mix these question types:
- Direction questions (which place is north/south/east/west?)
- Distance questions (which is closest/furthest?)
- Relative position (if you're at X facing Y, which way are you facing?)
- Creative scenario questions (you're heading to X, which place do you pass on the way?)
- Multi-step reasoning (walk north to X then turn east — what's nearby?)
- Comparison questions (which place has the best rating? which is the longest drive?)
- Trick questions with plausible wrong answers

Draw from a WIDE variety of place categories in the list — don't repeatedly use the same 1-2 kinds of places (e.g. don't make every question about parks or schools). Spread questions across restaurants, landmarks, shops, entertainment venues, and anything else listed, not just the very closest couple of places — moderately nearby places are just as fair game as the absolute closest one.

Make the questions feel natural and conversational — not robotic. Vary the phrasing a lot. Some can be fun/casual, some more serious navigation-style.

IMPORTANT: Only use place names from the list above. All 4 choices must be real places from the list. The correctIndex must be 0, 1, 2, or 3.

Return ONLY a JSON array, no other text:
[
  {
    "prompt": "question text here",
    "choices": ["Place A", "Place B", "Place C", "Place D"],
    "correctIndex": 0
  }
]`;
}

function validateQuestion(raw: unknown, id: number): DirectionQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  if (typeof q.prompt !== "string" || q.prompt.length === 0) return null;
  if (!Array.isArray(q.choices) || q.choices.length < 2) return null;
  if (typeof q.correctIndex !== "number") return null;
  if (q.correctIndex < 0 || q.correctIndex >= q.choices.length) return null;
  if (!q.choices.every((c: unknown) => typeof c === "string" && c.length > 0)) return null;
  return {
    id,
    kind: "ai-generated" as DirectionQuestion["kind"],
    prompt: q.prompt,
    choices: q.choices as string[],
    correctIndex: q.correctIndex,
  };
}

/**
 * Fetches a batch of AI-generated questions for the player's real surroundings.
 * Returns an empty array on any failure so callers never need to handle errors.
 */
export async function fetchAiQuestions(
  origin: Coords,
  features: MapFeature[],
  routes: RouteInfo[],
  startId: number,
): Promise<DirectionQuestion[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey || features.length < 3) return [];

  try {
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const featureCtx = buildFeatureContext(origin, features);
    const routeCtx = buildRouteContext(routes);
    const prompt = buildPrompt(featureCtx, routeCtx);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    // Extract JSON array from the response (handles any preamble/postamble)
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw: unknown[] = JSON.parse(match[0]);
    if (!Array.isArray(raw)) return [];

    return raw
      .map((q, i) => validateQuestion(q, startId + i))
      .filter((q): q is DirectionQuestion => q !== null);
  } catch {
    return [];
  }
}
