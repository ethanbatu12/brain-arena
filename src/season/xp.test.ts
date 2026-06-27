import { describe, expect, it } from "vitest";
import { SEASON_XP_AWARDS, seasonXpForGameResult, seasonXpForTournamentRank } from "./xp";

describe("seasonXpForGameResult", () => {
  it("awards the base amount for an ordinary completion", () => {
    expect(seasonXpForGameResult(false)).toBe(SEASON_XP_AWARDS.GAME_COMPLETE);
  });

  it("adds the personal-best bonus", () => {
    expect(seasonXpForGameResult(true)).toBe(SEASON_XP_AWARDS.GAME_COMPLETE + SEASON_XP_AWARDS.NEW_PERSONAL_BEST);
  });
});

describe("seasonXpForTournamentRank", () => {
  it("gives the winner bonus for 1st place", () => {
    expect(seasonXpForTournamentRank(1)).toBe(SEASON_XP_AWARDS.TOURNAMENT_WINNER);
  });

  it("gives the top-10 bonus for ranks 2 through 10", () => {
    expect(seasonXpForTournamentRank(2)).toBe(SEASON_XP_AWARDS.TOURNAMENT_TOP_10);
    expect(seasonXpForTournamentRank(10)).toBe(SEASON_XP_AWARDS.TOURNAMENT_TOP_10);
  });

  it("gives nothing outside the top 10", () => {
    expect(seasonXpForTournamentRank(11)).toBe(0);
    expect(seasonXpForTournamentRank(500)).toBe(0);
  });
});
