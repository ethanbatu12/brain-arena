import type { GameId } from "./player/types";

export interface GameMeta {
  id: GameId;
  name: string;
  tag: string;
  blurb: string;
  accent: string;
}

export const GAMES: GameMeta[] = [
  {
    id: "memory",
    name: "Memory Matrix",
    tag: "Visual memory",
    blurb: "Recall the pattern of lit tiles. Clear it and the board grows.",
    accent: "var(--accent)",
  },
  {
    id: "math",
    name: "Mental Math",
    tag: "Speed & arithmetic",
    blurb: "Two problems at once — solve either. Faster and harder scores more.",
    accent: "var(--good)",
  },
  {
    id: "logic",
    name: "Logic Challenge",
    tag: "Spatial reasoning",
    blurb: "Study the stack and type the total cube count — hidden ones included.",
    accent: "var(--logic)",
  },
  {
    id: "balloon",
    name: "Balloon Order",
    tag: "Ascending order",
    blurb: "Tap the balloons from smallest to largest before time runs out.",
    accent: "var(--balloon)",
  },
  {
    id: "pattern",
    name: "Fill in the Pattern",
    tag: "Pattern recognition",
    blurb: "Spot the rule, find the missing term. Sequences grow harder as you go.",
    accent: "var(--pattern)",
  },
  {
    id: "reaction",
    name: "Reaction Grid",
    tag: "Reaction speed",
    blurb: "Tap the blue dot before it disappears. Pure speed, pure focus.",
    accent: "var(--reaction)",
  },
  {
    id: "trivia",
    name: "Brain Blitz Trivia",
    tag: "Quickfire trivia",
    blurb: "Math, logic, patterns, probability, chess, and more — answer fast, difficulty climbs as you go.",
    accent: "var(--trivia)",
  },
];

export interface ChallengeMeta {
  id: "challenge";
  name: string;
  tag: string;
  blurb: string;
  accent: string;
}

export const CHALLENGE_META: ChallengeMeta = {
  id: "challenge",
  name: "All Games Challenge",
  tag: "Ultimate test",
  blurb: "Play all seven games back-to-back. Your scores combine into one ultimate total.",
  accent: "var(--challenge)",
};
