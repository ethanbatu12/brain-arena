import { describe, expect, it } from "vitest";
import {
  currentTournamentWeek,
  featuredGameForWeek,
  formatDuration,
  msUntilNextTournament,
  msUntilTournamentEnd,
  previousWeekStart,
  weekEndFor,
  weekEndTimestamp,
  weekStartFor,
} from "./schedule";
import { TOURNAMENT_GAME_POOL } from "./types";

describe("weekStartFor", () => {
  it("returns the same Monday for any day within that week", () => {
    // 2026-06-22 is a Monday (UTC)
    const monday = Date.UTC(2026, 5, 22, 0, 0, 0);
    const wednesday = Date.UTC(2026, 5, 24, 15, 30, 0);
    const sunday = Date.UTC(2026, 5, 28, 23, 59, 59);
    expect(weekStartFor(monday)).toBe("2026-06-22");
    expect(weekStartFor(wednesday)).toBe("2026-06-22");
    expect(weekStartFor(sunday)).toBe("2026-06-22");
  });

  it("rolls over to the next Monday once the week ends", () => {
    const nextMonday = Date.UTC(2026, 5, 29, 0, 0, 1);
    expect(weekStartFor(nextMonday)).toBe("2026-06-29");
  });

  it("handles a Sunday correctly (not treating it as the start of its own week)", () => {
    // 2026-01-04 is a Sunday; it belongs to the week starting 2025-12-29
    const sunday = Date.UTC(2026, 0, 4, 12, 0, 0);
    expect(weekStartFor(sunday)).toBe("2025-12-29");
  });
});

describe("weekEndFor / weekEndTimestamp", () => {
  it("is the Sunday 6 days after the Monday", () => {
    expect(weekEndFor("2026-06-22")).toBe("2026-06-28");
  });

  it("is just before the following Monday at midnight UTC", () => {
    const endTs = weekEndTimestamp("2026-06-22");
    const followingMondayTs = Date.UTC(2026, 5, 29, 0, 0, 0);
    expect(endTs).toBe(followingMondayTs - 1);
  });
});

describe("featuredGameForWeek", () => {
  it("always returns a game from the tournament pool", () => {
    for (const week of ["2026-06-22", "2026-06-29", "2026-07-06", "2027-01-04"]) {
      expect(TOURNAMENT_GAME_POOL).toContain(featuredGameForWeek(week));
    }
  });

  it("is deterministic for the same week", () => {
    expect(featuredGameForWeek("2026-06-22")).toBe(featuredGameForWeek("2026-06-22"));
  });

  it("varies across different weeks (not always the same game)", () => {
    const games = new Set(
      Array.from({ length: 20 }, (_, i) => featuredGameForWeek(weekStartFor(Date.UTC(2026, 0, 5 + i * 7)))),
    );
    expect(games.size).toBeGreaterThan(1);
  });
});

describe("currentTournamentWeek", () => {
  it("returns a consistent week/game pairing", () => {
    const now = Date.UTC(2026, 5, 24);
    const week = currentTournamentWeek(now);
    expect(week.weekStart).toBe("2026-06-22");
    expect(week.weekEnd).toBe("2026-06-28");
    expect(TOURNAMENT_GAME_POOL).toContain(week.gameId);
  });
});

describe("msUntilTournamentEnd / msUntilNextTournament", () => {
  it("counts down to zero, never negative", () => {
    const weekStart = "2026-06-22";
    const afterEnd = weekEndTimestamp(weekStart) + 10_000;
    expect(msUntilTournamentEnd(weekStart, afterEnd)).toBe(0);
  });

  it("next tournament starts exactly 1ms after this one ends", () => {
    const weekStart = "2026-06-22";
    const now = weekEndTimestamp(weekStart) - 500;
    expect(msUntilNextTournament(weekStart, now)).toBe(msUntilTournamentEnd(weekStart, now) + 1);
  });
});

describe("previousWeekStart", () => {
  it("is exactly 7 days before", () => {
    expect(previousWeekStart("2026-06-22")).toBe("2026-06-15");
  });

  it("handles year boundaries", () => {
    expect(previousWeekStart("2026-01-05")).toBe("2025-12-29");
  });
});

describe("formatDuration", () => {
  it("formats days, hours, minutes, seconds appropriately", () => {
    expect(formatDuration(2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000)).toBe("2d 3h 4m");
    expect(formatDuration(3 * 3_600_000 + 4 * 60_000)).toBe("3h 4m");
    expect(formatDuration(4 * 60_000 + 5_000)).toBe("4m 5s");
    expect(formatDuration(5_000)).toBe("5s");
    expect(formatDuration(0)).toBe("0s");
  });
});
