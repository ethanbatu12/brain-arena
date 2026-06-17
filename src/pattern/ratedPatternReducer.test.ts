import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { RATED_PATTERN_GAIN, RATED_PATTERN_INITIAL_RATING, RATED_PATTERN_LOSS } from "./constants";
import {
  ratedPatternInitialState,
  ratedPatternReduce,
  ratingTier,
} from "./ratedPatternReducer";

const rng = mulberry32(42);

function startedState(rating = RATED_PATTERN_INITIAL_RATING) {
  return ratedPatternReduce(ratedPatternInitialState(rating), { type: "START" }, rng);
}

describe("ratedPatternInitialState", () => {
  it("starts idle with the given rating", () => {
    const s = ratedPatternInitialState(800);
    expect(s.phase).toBe("idle");
    expect(s.rating).toBe(800);
    expect(s.solved).toBe(0);
    expect(s.attempted).toBe(0);
  });

  it("defaults to RATED_PATTERN_INITIAL_RATING", () => {
    expect(ratedPatternInitialState().rating).toBe(RATED_PATTERN_INITIAL_RATING);
  });
});

describe("START action", () => {
  it("transitions to playing and generates a puzzle", () => {
    const s = startedState();
    expect(s.phase).toBe("playing");
    expect(s.current).not.toBeNull();
    expect(s.solved).toBe(0);
  });
});

describe("ANSWER action — correct", () => {
  it("increments solved/attempted and gains rating", () => {
    const s = startedState();
    const answer = s.current!.answer;
    const next = ratedPatternReduce(s, { type: "ANSWER", value: answer }, rng);

    expect(next.phase).toBe("playing");
    expect(next.solved).toBe(1);
    expect(next.attempted).toBe(1);
    expect(next.rating).toBe(RATED_PATTERN_INITIAL_RATING + RATED_PATTERN_GAIN);
    expect(next.lastResult).toBe("correct");
  });

  it("generates a new puzzle after a correct answer", () => {
    const s = startedState();
    const answer = s.current!.answer;
    const next = ratedPatternReduce(s, { type: "ANSWER", value: answer }, rng);
    expect(next.current).not.toBeNull();
  });
});

describe("ANSWER action — wrong", () => {
  it("ends the run and loses rating", () => {
    const s = startedState();
    const wrong = s.current!.distractors[0];
    const next = ratedPatternReduce(s, { type: "ANSWER", value: wrong }, rng);

    expect(next.phase).toBe("over");
    expect(next.lastResult).toBe("wrong");
    expect(next.rating).toBe(RATED_PATTERN_INITIAL_RATING - RATED_PATTERN_LOSS);
    expect(next.solved).toBe(0);
    expect(next.attempted).toBe(1);
  });

  it("rating cannot drop below 0", () => {
    const s = startedState(10);
    const wrong = s.current!.distractors[0];
    const next = ratedPatternReduce(s, { type: "ANSWER", value: wrong }, rng);
    expect(next.rating).toBe(0);
  });
});

describe("RESET action", () => {
  it("goes back to idle but keeps the current rating", () => {
    const s = startedState(900);
    const reset = ratedPatternReduce(s, { type: "RESET" }, rng);
    expect(reset.phase).toBe("idle");
    expect(reset.rating).toBe(900);
    expect(reset.solved).toBe(0);
  });
});

describe("ratingTier", () => {
  it.each([
    [300, "Beginner"],
    [500, "Easy"],
    [700, "Intermediate"],
    [900, "Advanced"],
    [1100, "Expert"],
    [1300, "Master"],
    [1500, "Elite"],
    [1800, "Grandmaster"],
  ])("rating %i → %s", (rating, tier) => {
    expect(ratingTier(rating)).toBe(tier);
  });
});
