import { describe, expect, it } from "vitest";
import { mulberry32 } from "../game/rng";
import { BONUS_POINTS, POINTS_PER_CORRECT, TRIVIA_GAME_MS } from "./constants";
import { triviaInitialState, triviaReduce } from "./reducer";
import type { TriviaState } from "./types";

const rng = () => mulberry32(77);

function start(): TriviaState {
  return triviaReduce(triviaInitialState(), { type: "START" }, rng());
}

function answer(state: TriviaState, correct: boolean): TriviaState {
  const choiceIndex = correct
    ? state.question!.correctIndex
    : (state.question!.correctIndex + 1) % 4;
  return triviaReduce(state, { type: "ANSWER", questionId: state.question!.id, choiceIndex }, rng());
}

describe("triviaInitialState", () => {
  it("starts idle with zeroed stats and a full timer", () => {
    const s = triviaInitialState();
    expect(s.phase).toBe("idle");
    expect(s.question).toBeNull();
    expect(s.score).toBe(0);
    expect(s.correctCount).toBe(0);
    expect(s.wrongCount).toBe(0);
    expect(s.totalAnswered).toBe(0);
    expect(s.timeLeftMs).toBe(TRIVIA_GAME_MS);
  });
});

describe("START", () => {
  it("transitions to playing and generates a question", () => {
    const s = start();
    expect(s.phase).toBe("playing");
    expect(s.question).not.toBeNull();
  });
});

describe("ANSWER", () => {
  it("awards points and a new question on a correct answer", () => {
    const s = start();
    const prevId = s.question!.id;
    const next = answer(s, true);
    expect(next.score).toBe(POINTS_PER_CORRECT);
    expect(next.correctCount).toBe(1);
    expect(next.totalAnswered).toBe(1);
    expect(next.question).not.toBeNull();
    expect(next.question!.id).not.toBe(prevId);
    expect(next.lastResult).toEqual({ questionId: prevId, chosenIndex: next.lastResult!.chosenIndex, correct: true });
  });

  it("awards no points on a wrong answer but still advances", () => {
    const s = start();
    const next = answer(s, false);
    expect(next.score).toBe(0);
    expect(next.wrongCount).toBe(1);
    expect(next.totalAnswered).toBe(1);
    expect(next.lastResult!.correct).toBe(false);
  });

  it("ignores answers to a stale question id", () => {
    const s = start();
    const next = triviaReduce(s, { type: "ANSWER", questionId: s.question!.id - 999, choiceIndex: 0 }, rng());
    expect(next).toEqual(s);
  });

  it("ignores answers while idle or over", () => {
    const idle = triviaInitialState();
    expect(triviaReduce(idle, { type: "ANSWER", questionId: 1, choiceIndex: 0 }, rng())).toEqual(idle);
  });

  it("awards the bonus on the 5th correct answer", () => {
    let s = start();
    for (let i = 0; i < 4; i++) s = answer(s, true);
    expect(s.correctCount).toBe(4);
    expect(s.score).toBe(4 * POINTS_PER_CORRECT);

    s = answer(s, true);
    expect(s.correctCount).toBe(5);
    expect(s.score).toBe(4 * POINTS_PER_CORRECT + POINTS_PER_CORRECT + BONUS_POINTS);
    expect(s.score).toBe(450);
  });
});

describe("TICK", () => {
  it("counts down the round timer", () => {
    const s = start();
    const next = triviaReduce(s, { type: "TICK", deltaMs: 1000 }, rng());
    expect(next.timeLeftMs).toBe(TRIVIA_GAME_MS - 1000);
    expect(next.phase).toBe("playing");
  });

  it("ends the round when time runs out", () => {
    const s = start();
    const next = triviaReduce(s, { type: "TICK", deltaMs: TRIVIA_GAME_MS + 1000 }, rng());
    expect(next.phase).toBe("over");
    expect(next.timeLeftMs).toBe(0);
  });

  it("does nothing while idle", () => {
    const idle = triviaInitialState();
    expect(triviaReduce(idle, { type: "TICK", deltaMs: 100 }, rng())).toEqual(idle);
  });
});

describe("RESET", () => {
  it("returns to the initial idle state", () => {
    const s = answer(start(), true);
    expect(triviaReduce(s, { type: "RESET" }, rng())).toEqual(triviaInitialState());
  });
});
