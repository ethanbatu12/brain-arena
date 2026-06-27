import { describe, expect, it } from "vitest";
import { awardSeasonXp, claimReward, emptySeasonProgress, rewardTrackFor } from "./progress";
import { ensureCurrentSeason } from "./rollover";
import { seasonIndexFor, seasonStartMs, SEASON_LENGTH_MS } from "./schedule";

describe("ensureCurrentSeason", () => {
  it("is a no-op within the same season", () => {
    const now = seasonStartMs(0) + 1000;
    const progress = emptySeasonProgress(seasonIndexFor(now));
    const { progress: updated, history } = ensureCurrentSeason(progress, [], now);
    expect(updated).toBe(progress);
    expect(history).toEqual([]);
  });

  it("starts a fresh season with no history when the prior season had zero activity", () => {
    const oldProgress = emptySeasonProgress(0);
    const now = seasonStartMs(1) + 1000;
    const { progress, history } = ensureCurrentSeason(oldProgress, [], now);
    expect(progress.seasonIndex).toBe(seasonIndexFor(now));
    expect(progress.seasonXp).toBe(0);
    expect(history).toEqual([]);
  });

  it("archives a season the player actually played, then resets to a fresh one", () => {
    let oldProgress = awardSeasonXp(emptySeasonProgress(0), 250);
    const tier1 = rewardTrackFor(oldProgress).find((r) => r.tier === 1)!;
    const claimed = claimReward(oldProgress, tier1.id);
    oldProgress = (claimed as { ok: true; progress: typeof oldProgress }).progress;

    const now = seasonStartMs(1) + 1000;
    const { progress, history } = ensureCurrentSeason(oldProgress, [], now);

    expect(history).toHaveLength(1);
    expect(history[0].seasonIndex).toBe(0);
    expect(history[0].claimedRewardIds).toEqual([tier1.id]);
    expect(history[0].finalLevel).toBeGreaterThanOrEqual(1);
    expect(progress.seasonIndex).toBe(1);
    expect(progress.seasonXp).toBe(0);
    expect(progress.claimedRewardIds).toEqual([]);
  });

  it("can roll over multiple seasons at once (player away for a long time)", () => {
    const oldProgress = awardSeasonXp(emptySeasonProgress(0), 100);
    const now = seasonStartMs(0) + SEASON_LENGTH_MS * 3 + 1000;
    const { progress, history } = ensureCurrentSeason(oldProgress, [], now);
    expect(progress.seasonIndex).toBe(seasonIndexFor(now));
    expect(history).toHaveLength(1); // only the one season they actually had progress in gets archived
  });

  it("appends to existing history rather than replacing it", () => {
    const priorHistory = [
      {
        seasonIndex: -1,
        themeId: "x",
        themeName: "X",
        finalLevel: 10,
        claimedRewardIds: [],
        completionPercent: 5,
        finalLeaderboardPlacement: null,
      },
    ];
    const oldProgress = awardSeasonXp(emptySeasonProgress(0), 50);
    const now = seasonStartMs(1) + 1000;
    const { history } = ensureCurrentSeason(oldProgress, priorHistory, now);
    expect(history).toHaveLength(2);
    expect(history[0]).toBe(priorHistory[0]);
  });
});
