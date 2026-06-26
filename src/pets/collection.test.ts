import { describe, expect, it } from "vitest";
import { canPurchase, collectionStats } from "./collection";

describe("collectionStats", () => {
  it("is 0/total/0% with no pets owned", () => {
    const stats = collectionStats([]);
    expect(stats.owned).toBe(0);
    expect(stats.total).toBe(20);
    expect(stats.percent).toBe(0);
  });

  it("counts only pets that exist in the catalog", () => {
    const stats = collectionStats(["golden-retriever", "not-a-real-pet"]);
    expect(stats.owned).toBe(1);
  });

  it("is 100% once every pet is owned", () => {
    const allIds = Array.from({ length: 20 }, (_, i) => i).map(
      (i) => ["golden-retriever", "black-cat", "rabbit", "hamster", "fox", "panda", "penguin", "owl",
        "red-panda", "wolf", "snow-leopard", "baby-tiger", "baby-dragon", "phoenix", "robot-companion",
        "space-alien", "golden-dragon", "crystal-phoenix", "cosmic-wolf", "galaxy-dragon"][i],
    );
    expect(collectionStats(allIds).percent).toBe(100);
  });
});

describe("canPurchase", () => {
  it("succeeds when the player has enough coins and doesn't already own it", () => {
    expect(canPurchase("golden-retriever", 500, [])).toEqual({ ok: true });
  });

  it("fails for an unknown pet id", () => {
    expect(canPurchase("not-a-real-pet", 999_999, [])).toEqual({ ok: false, error: "unknown-pet" });
  });

  it("fails if the player already owns it", () => {
    expect(canPurchase("golden-retriever", 500, ["golden-retriever"])).toEqual({ ok: false, error: "already-owned" });
  });

  it("fails if the player doesn't have enough coins", () => {
    expect(canPurchase("galaxy-dragon", 100, [])).toEqual({ ok: false, error: "not-enough-coins" });
  });

  it("succeeds with exactly enough coins", () => {
    expect(canPurchase("golden-retriever", 300, [])).toEqual({ ok: true });
  });
});
