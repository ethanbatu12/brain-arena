import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { RATED_PATTERN_GAIN, RATED_PATTERN_INITIAL_RATING, RATED_PATTERN_LOSS } from "./constants";
import {
  ratedPatternInitialState,
  ratedPatternReduce,
  ratingTier,
} from "./ratedPatternReducer";
import { bandForRating } from "./logic";

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

  it("defaults to RATED_PATTERN_INITIAL_RATING (1000)", () => {
    expect(ratedPatternInitialState().rating).toBe(RATED_PATTERN_INITIAL_RATING);
    expect(RATED_PATTERN_INITIAL_RATING).toBe(1000);
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
    [500,  "Provisional"],
    [999,  "Provisional"],
    [1000, "Beginner"],
    [1100, "Beginner"],
    [1200, "Easy"],
    [1350, "Easy"],
    [1400, "Intermediate"],
    [1500, "Intermediate"],
    [1600, "Advanced"],
    [1700, "Advanced"],
    [1800, "Expert"],
    [1900, "Expert"],
    [2000, "Master"],
    [2100, "Master"],
    [2200, "Elite"],
    [2300, "Elite"],
    [2400, "Grandmaster"],
    [3000, "Grandmaster"],
  ])("rating %i → %s", (rating, tier) => {
    expect(ratingTier(rating)).toBe(tier);
  });
});

describe("bandForRating", () => {
  it("maps initial rating 1000 to band 3 (Beginner difficulty)", () => {
    expect(bandForRating(1000)).toBe(3);
  });

  it("scales up by one band per 200 rating points above 600", () => {
    // band = floor((rating - 600) / 200) + 1, clamped 1–10
    expect(bandForRating(600)).toBe(1);
    expect(bandForRating(800)).toBe(2);
    expect(bandForRating(1000)).toBe(3);
    expect(bandForRating(1200)).toBe(4);
    expect(bandForRating(1400)).toBe(5);
    expect(bandForRating(1600)).toBe(6);
    expect(bandForRating(1800)).toBe(7);
    expect(bandForRating(2000)).toBe(8);
    expect(bandForRating(2200)).toBe(9);
    expect(bandForRating(2400)).toBe(10);
    expect(bandForRating(3000)).toBe(10); // clamped
  });

  it("clamps low ratings to band 1", () => {
    expect(bandForRating(0)).toBe(1);
    expect(bandForRating(599)).toBe(1);
  });
});
