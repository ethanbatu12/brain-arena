import type { Rng } from "../game/rng";
import { BALLOON_GAME_MS, BONUS_EVERY_SETS, BONUS_POINTS, MIN_LEVEL, POINTS_PER_BALLOON } from "./constants";
import { generateBalloonSet, nextLevelOnSetComplete } from "./logic";
import type { BalloonAction, BalloonState } from "./types";

export function balloonInitialState(): BalloonState {
  return {
    phase: "idle",
    balloons: [],
    sortedIds: [],
    nextIndex: 0,
    score: 0,
    timeLeftMs: BALLOON_GAME_MS,
    level: MIN_LEVEL,
    completedSets: 0,
    setsToBonus: 0,
    correctTaps: 0,
    wrongTaps: 0,
    peakLevel: MIN_LEVEL,
    lastResult: null,
    flashId: 0,
    nextId: 1,
  };
}

export function balloonReduce(state: BalloonState, action: BalloonAction, rng: Rng): BalloonState {
  switch (action.type) {
    case "RESET":
      return balloonInitialState();

    case "START": {
      const base = balloonInitialState();
      const { balloons, sortedIds } = generateBalloonSet(base.level, rng, 1);
      return { ...base, phase: "playing", balloons, sortedIds, nextId: 1 + balloons.length };
    }

    case "TAP": {
      if (state.phase !== "playing") return state;
      const expectedId = state.sortedIds[state.nextIndex];

      if (action.id !== expectedId) {
        return {
          ...state,
          wrongTaps: state.wrongTaps + 1,
          lastResult: { id: action.id, correct: false },
          flashId: state.flashId + 1,
        };
      }

      const balloons = state.balloons.map((b) => (b.id === action.id ? { ...b, popped: true } : b));
      const nextIndex = state.nextIndex + 1;
      const score = state.score + POINTS_PER_BALLOON;
      const correctTaps = state.correctTaps + 1;
      const lastResult = { id: action.id, correct: true } as const;
      const flashId = state.flashId + 1;

      if (nextIndex < state.sortedIds.length) {
        return { ...state, balloons, nextIndex, score, correctTaps, lastResult, flashId };
      }

      // Set cleared: progress difficulty, award bonus if due, and spawn the next set.
      const completedSets = state.completedSets + 1;
      const setsToBonus = (state.setsToBonus + 1) % BONUS_EVERY_SETS;
      const bonus = setsToBonus === 0 ? BONUS_POINTS : 0;
      const level = nextLevelOnSetComplete(state.level);
      const generated = generateBalloonSet(level, rng, state.nextId);

      return {
        ...state,
        balloons: generated.balloons,
        sortedIds: generated.sortedIds,
        nextIndex: 0,
        score: score + bonus,
        correctTaps,
        completedSets,
        setsToBonus,
        level,
        peakLevel: Math.max(state.peakLevel, level),
        lastResult,
        flashId,
        nextId: state.nextId + generated.balloons.length,
      };
    }

    case "TICK": {
      if (state.phase !== "playing") return state;
      const timeLeftMs = state.timeLeftMs - action.deltaMs;
      if (timeLeftMs <= 0) {
        return { ...state, timeLeftMs: 0, phase: "over" };
      }
      return { ...state, timeLeftMs };
    }

    default:
      return state;
  }
}
