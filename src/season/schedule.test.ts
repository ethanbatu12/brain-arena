import { describe, expect, it } from "vitest";
import { THEMES } from "./themes";
import {
  SEASON_EPOCH_MS,
  SEASON_LENGTH_DAYS,
  daysRemainingInSeason,
  seasonEndMs,
  seasonIndexFor,
  seasonStartMs,
  themeForSeason,
} from "./schedule";

describe("seasonIndexFor", () => {
  it("is season 0 at the epoch", () => {
    expect(seasonIndexFor(SEASON_EPOCH_MS)).toBe(0);
  });

  it("is still season 0 just before the season ends", () => {
    const almostEnd = SEASON_EPOCH_MS + SEASON_LENGTH_DAYS * 86_400_000 - 1;
    expect(seasonIndexFor(almostEnd)).toBe(0);
  });

  it("rolls over to season 1 exactly 28 days later", () => {
    const nextSeason = SEASON_EPOCH_MS + SEASON_LENGTH_DAYS * 86_400_000;
    expect(seasonIndexFor(nextSeason)).toBe(1);
  });

  it("handles times before the epoch (negative seasons), still consistent", () => {
    const before = SEASON_EPOCH_MS - 1;
    expect(seasonIndexFor(before)).toBe(-1);
  });
});

describe("seasonStartMs / seasonEndMs", () => {
  it("season 0 starts at the epoch", () => {
    expect(seasonStartMs(0)).toBe(SEASON_EPOCH_MS);
  });

  it("each season is exactly 28 days long", () => {
    expect(seasonEndMs(0) - seasonStartMs(0)).toBe(SEASON_LENGTH_DAYS * 86_400_000);
  });

  it("season N+1 starts exactly when season N ends", () => {
    expect(seasonStartMs(5)).toBe(seasonEndMs(4));
  });
});

describe("themeForSeason", () => {
  it("assigns themes in catalog order, season 0 first", () => {
    expect(themeForSeason(0)).toBe(THEMES[0]);
    expect(themeForSeason(1)).toBe(THEMES[1]);
  });

  it("wraps around after exhausting the catalog", () => {
    expect(themeForSeason(THEMES.length)).toBe(THEMES[0]);
    expect(themeForSeason(THEMES.length + 2)).toBe(THEMES[2]);
  });

  it("never throws for negative season indices", () => {
    expect(() => themeForSeason(-1)).not.toThrow();
  });
});

describe("daysRemainingInSeason", () => {
  it("is the full season length right at the start", () => {
    expect(daysRemainingInSeason(0, seasonStartMs(0))).toBe(SEASON_LENGTH_DAYS);
  });

  it("counts down to 0 right at the end", () => {
    expect(daysRemainingInSeason(0, seasonEndMs(0))).toBe(0);
  });

  it("never goes negative past the end", () => {
    expect(daysRemainingInSeason(0, seasonEndMs(0) + 86_400_000)).toBe(0);
  });
});
