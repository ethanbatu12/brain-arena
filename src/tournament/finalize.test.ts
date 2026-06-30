import { describe, expect, it, vi, beforeEach } from "vitest";
import { ensureTournamentFinalized } from "./finalize";
import * as cloudSync from "./cloudSync";
import { weeksBefore } from "./schedule";

vi.mock("./cloudSync", () => ({
  fetchLatestTournamentHistory: vi.fn(),
  fetchTournamentLeaderboard: vi.fn(),
  finalizeTournamentWeek: vi.fn(),
}));

const NOW = Date.UTC(2026, 5, 22, 12, 0, 0); // a Monday — currentWeekStart = 2026-06-22

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ensureTournamentFinalized", () => {
  it("does nothing if already up to date", async () => {
    vi.mocked(cloudSync.fetchLatestTournamentHistory).mockResolvedValue({
      weekStart: "2026-06-15",
      weekEnd: "2026-06-21",
      gameId: "memory",
      first: null,
      second: null,
      third: null,
      finalizedAt: new Date().toISOString(),
    });
    await ensureTournamentFinalized(NOW);
    expect(cloudSync.finalizeTournamentWeek).not.toHaveBeenCalled();
  });

  it("finalizes a single missed week", async () => {
    vi.mocked(cloudSync.fetchLatestTournamentHistory).mockResolvedValue({
      weekStart: "2026-06-08",
      weekEnd: "2026-06-14",
      gameId: "memory",
      first: null,
      second: null,
      third: null,
      finalizedAt: new Date().toISOString(),
    });
    vi.mocked(cloudSync.fetchTournamentLeaderboard).mockResolvedValue([
      { username: "Alice", score: 500, level: 10 },
      { username: "Bob", score: 300, level: 5 },
    ]);

    await ensureTournamentFinalized(NOW);

    expect(cloudSync.finalizeTournamentWeek).toHaveBeenCalledTimes(1);
    const entry = vi.mocked(cloudSync.finalizeTournamentWeek).mock.calls[0][0];
    expect(entry.weekStart).toBe("2026-06-15");
    expect(entry.first).toEqual({ username: "Alice", score: 500 });
    expect(entry.second).toEqual({ username: "Bob", score: 300 });
  });

  it("backfills every missed week, not just the most recent one — the core bug fix", async () => {
    // Latest finalized was 3 weeks ago; two whole weeks in between were never finalized.
    vi.mocked(cloudSync.fetchLatestTournamentHistory).mockResolvedValue({
      weekStart: "2026-06-01",
      weekEnd: "2026-06-07",
      gameId: "memory",
      first: null,
      second: null,
      third: null,
      finalizedAt: new Date().toISOString(),
    });
    vi.mocked(cloudSync.fetchTournamentLeaderboard).mockResolvedValue([{ username: "Alice", score: 100, level: 1 }]);

    await ensureTournamentFinalized(NOW);

    // Missed weeks: 2026-06-08 and 2026-06-15 (2026-06-22 is the current, still-active week).
    expect(cloudSync.finalizeTournamentWeek).toHaveBeenCalledTimes(2);
    const weekStarts = vi.mocked(cloudSync.finalizeTournamentWeek).mock.calls.map((c) => c[0].weekStart);
    expect(weekStarts).toEqual(["2026-06-08", "2026-06-15"]);
  });

  it("skips a week with no scores but still continues past it", async () => {
    vi.mocked(cloudSync.fetchLatestTournamentHistory).mockResolvedValue({
      weekStart: "2026-06-01",
      weekEnd: "2026-06-07",
      gameId: "memory",
      first: null,
      second: null,
      third: null,
      finalizedAt: new Date().toISOString(),
    });
    vi.mocked(cloudSync.fetchTournamentLeaderboard).mockImplementation(async (weekStart: string) =>
      weekStart === "2026-06-08" ? [] : [{ username: "Alice", score: 100, level: 1 }],
    );

    await ensureTournamentFinalized(NOW);

    // Only the week with scores gets a written entry.
    expect(cloudSync.finalizeTournamentWeek).toHaveBeenCalledTimes(1);
    expect(vi.mocked(cloudSync.finalizeTournamentWeek).mock.calls[0][0].weekStart).toBe("2026-06-15");
  });

  it("bounds the backfill window when nothing has ever been finalized", async () => {
    vi.mocked(cloudSync.fetchLatestTournamentHistory).mockResolvedValue(null);
    vi.mocked(cloudSync.fetchTournamentLeaderboard).mockResolvedValue([]);

    await ensureTournamentFinalized(NOW);

    const calls = vi.mocked(cloudSync.fetchTournamentLeaderboard).mock.calls.map((c) => c[0]);
    const earliestExpected = weeksBefore("2026-06-22", 26);
    expect(calls[0]).toBe(earliestExpected);
  });
});
