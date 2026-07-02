import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";

/**
 * Safety net: every cloud-sync call site (player/cloudSync.ts,
 * leaderboard/globalLeaderboard.ts, tournament/cloudSync.ts) hits a real
 * Supabase project over the network with no test-time mocking. Without this,
 * running the test suite makes real HTTP requests to production — e.g.
 * `createAccount("Alice", ...)` in PlayerContext.test.tsx would actually
 * write a fake "Alice" account into the live database, and read stale
 * results back on the next run, causing flaky "username already taken"
 * failures that have nothing to do with the code under test.
 *
 * Stubbed to resolve with an empty-but-successful response (not reject):
 * `isUserBanned` intentionally fails CLOSED (treats network errors as
 * "banned") so a broken check can never silently admit a banned user in
 * production — rejecting fetch here would make every test look banned.
 * An empty 200 response instead reads as "no rows found" everywhere
 * (no cloud profile, not banned, empty leaderboard/history), which is
 * exactly the deterministic clean-slate a test should start from. A test
 * file that wants specific network behavior should use `vi.mock(...)` on
 * the module directly, which takes priority over this global stub.
 */
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});
