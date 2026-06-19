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

  it("defaults to RATED_PATTERN_INITIAL_RATING (1400)", () => {
    expect(ratedPatternInitialState().rating).toBe(RATED_PATTERN_INITIAL_RATING);
    expect(RATED_PATTERN_INITIAL_RATING).toBe(1400);
  });
});

describe("START action", () => {
  it("transitions to playing and generates a puzzle", () => {
    const s = startedState();
    expect(s.phase).toBe("playing");
    expect(s.current).not.toBeNull();
    expect(s.solved).toBe(0);
  });

  it("records startRating at session start", () => {
    const s = startedState(1200);
    expect(s.startRating).toBe(1200);
  });
});

describe("ANSWER action — correct", () => {
  it("increments solved/attempted, gains rating, and enters feedback phase", () => {
    const s = startedState();
    const answer = s.current!.answer;
    const next = ratedPatternReduce(s, { type: "ANSWER", value: answer }, rng);

    expect(next.phase).toBe("feedback");
    expect(next.solved).toBe(1);
    expect(next.attempted).toBe(1);
    expect(next.rating).toBe(RATED_PATTERN_INITIAL_RATING + RATED_PATTERN_GAIN);
    expect(next.lastResult).toBe("correct");
  });
});

describe("ANSWER action — wrong", () => {
  it("increments attempted, loses rating, enters feedback (does NOT end the session)", () => {
    const s = startedState();
    const wrong = s.current!.distractors[0];
    const next = ratedPatternReduce(s, { type: "ANSWER", value: wrong }, rng);

    expect(next.phase).toBe("feedback");
    expect(next.lastResult).toBe("wrong");
    expect(next.rating).toBe(RATED_PATTERN_INITIAL_RATING - RATED_PATTERN_LOSS);
    expect(next.solved).toBe(0);
    expect(next.attempted).toBe(1);
    // Puzzle is retained in feedback so UI can reveal the correct answer
    expect(next.current).not.toBeNull();
  });

  it("rating cannot drop below 0", () => {
    const s = startedState(10);
    const wrong = s.current!.distractors[0];
    const next = ratedPatternReduce(s, { type: "ANSWER", value: wrong }, rng);
    expect(next.rating).toBe(0);
  });
});

describe("NEXT action", () => {
  it("generates a new puzzle and returns to playing phase", () => {
    const s = startedState();
    const wrong = s.current!.distractors[0];
    const feedback = ratedPatternReduce(s, { type: "ANSWER", value: wrong }, rng);
    expect(feedback.phase).toBe("feedback");

    const playing = ratedPatternReduce(feedback, { type: "NEXT" }, rng);
    expect(playing.phase).toBe("playing");
    expect(playing.current).not.toBeNull();
    expect(playing.solved).toBe(feedback.solved); // unchanged
    expect(playing.rating).toBe(feedback.rating); // unchanged
  });

  it("is a no-op outside feedback phase", () => {
    const s = startedState();
    expect(s.phase).toBe("playing");
    const same = ratedPatternReduce(s, { type: "NEXT" }, rng);
    expect(same).toBe(s);
  });
});

describe("QUIT action", () => {
  it("transitions from playing to over", () => {
    const s = startedState();
    const over = ratedPatternReduce(s, { type: "QUIT" }, rng);
    expect(over.phase).toBe("over");
    expect(over.rating).toBe(s.rating);
    expect(over.solved).toBe(0);
  });

  it("transitions from feedback to over", () => {
    const s = startedState();
    const answer = s.current!.answer;
    const feedback = ratedPatternReduce(s, { type: "ANSWER", value: answer }, rng);
    const over = ratedPatternReduce(feedback, { type: "QUIT" }, rng);
    expect(over.phase).toBe("over");
    expect(over.solved).toBe(1);
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

describe("session delta via startRating", () => {
  it("startRating is preserved across multiple answers", () => {
    const rng2 = mulberry32(99);
    const wrapped = (s: ReturnType<typeof ratedPatternInitialState>, action: Parameters<typeof ratedPatternReduce>[1]) =>
      ratedPatternReduce(s, action, rng2);

    let s = wrapped(ratedPatternInitialState(1000), { type: "START" });
    expect(s.startRating).toBe(1000);

    // Correct answer
    const answer1 = s.current!.answer;
    s = wrapped(s, { type: "ANSWER", value: answer1 });
    expect(s.rating).toBe(1000 + RATED_PATTERN_GAIN);
    expect(s.startRating).toBe(1000); // unchanged

    // Next puzzle
    s = wrapped(s, { type: "NEXT" });

    // Wrong answer
    const wrong2 = s.current!.distractors[0];
    s = wrapped(s, { type: "ANSWER", value: wrong2 });
    const expectedFinalRating = Math.max(0, 1000 + RATED_PATTERN_GAIN - RATED_PATTERN_LOSS);
    expect(s.rating).toBe(expectedFinalRating);
    expect(s.startRating).toBe(1000); // still unchanged
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
  it("maps initial rating 1400 to band 5", () => {
    expect(bandForRating(1400)).toBe(5);
  });

  it("scales up by one band per 200 rating points above 600", () => {
    expect(bandForRating(600)).toBe(1);
    expect(bandForRating(800)).toBe(2);
    expect(bandForRating(1000)).toBe(3); // still valid for rating 1000
    expect(bandForRating(1200)).toBe(4);
    expect(bandForRating(1400)).toBe(5);
    expect(bandForRating(1600)).toBe(6);
    expect(bandForRating(1800)).toBe(7);
    expect(bandForRating(2000)).toBe(8);
    expect(bandForRating(2200)).toBe(9);
    expect(bandForRating(2400)).toBe(10);
    expect(bandForRating(3000)).toBe(10);
  });

  it("clamps low ratings to band 1", () => {
    expect(bandForRating(0)).toBe(1);
    expect(bandForRating(599)).toBe(1);
  });
});
