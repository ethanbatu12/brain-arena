import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { clearAllForTests } from "./db";
import { PlayerProvider, usePlayerProfile } from "./PlayerContext";
import { loadCurrentUsername, loadProfiles } from "./storage";

beforeEach(async () => {
  await clearAllForTests();
});

async function renderPlayer() {
  const helpers = renderHook(() => usePlayerProfile(), { wrapper: PlayerProvider });
  await waitFor(() => expect(helpers.result.current.loading).toBe(false));
  return helpers;
}

describe("usePlayerProfile", () => {
  it("starts loading, then with no profile and no existing usernames", async () => {
    const { result } = renderHook(() => usePlayerProfile(), { wrapper: PlayerProvider });
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toBeNull();
    expect(result.current.existingUsernames).toEqual([]);
  });

  it("creates a new account, persisting the profile, password hash, and current username", async () => {
    const { result } = await renderPlayer();

    let response: { ok: true } | { ok: false; error: string } | undefined;
    await act(async () => {
      response = await result.current.createAccount("Alice", "secret1");
    });

    expect(response).toEqual({ ok: true });
    expect(result.current.profile?.username).toBe("Alice");
    expect(await loadCurrentUsername()).toBe("Alice");
    const stored = await loadProfiles();
    expect(stored.Alice?.username).toBe("Alice");
    expect(stored.Alice?.passwordHash).toBeTruthy();
    expect(stored.Alice?.passwordSalt).toBeTruthy();
  });

  it("rejects creating an account with a username that is already taken", async () => {
    const { result } = await renderPlayer();

    await act(async () => {
      await result.current.createAccount("Alice", "secret1");
    });
    const original = await loadProfiles();
    const originalHash = original.Alice?.passwordHash;

    act(() => {
      result.current.signOut();
    });

    let response: { ok: true } | { ok: false; error: string } | undefined;
    await act(async () => {
      response = await result.current.createAccount("Alice", "different1");
    });

    expect(response?.ok).toBe(false);
    const after = await loadProfiles();
    expect(after.Alice?.passwordHash).toBe(originalHash);
  });

  it("rejects creating an account with an invalid password", async () => {
    const { result } = await renderPlayer();

    let response: { ok: true } | { ok: false; error: string } | undefined;
    await act(async () => {
      response = await result.current.createAccount("Alice", "abc");
    });

    expect(response?.ok).toBe(false);
    expect(result.current.profile).toBeNull();
    const stored = await loadProfiles();
    expect(stored.Alice).toBeUndefined();
  });

  it("rejects an invalid username and leaves profile null", async () => {
    const { result } = await renderPlayer();

    let response: { ok: true } | { ok: false; error: string } | undefined;
    await act(async () => {
      response = await result.current.createAccount("a", "secret1");
    });

    expect(response?.ok).toBe(false);
    expect(result.current.profile).toBeNull();
  });

  it("records a game result and updates per-game and overall stats", async () => {
    const { result } = await renderPlayer();

    await act(async () => {
      await result.current.createAccount("Alice", "secret1");
    });
    act(() => {
      result.current.recordResult("balloon", 75);
    });

    expect(result.current.profile?.games.balloon.bestScore).toBe(75);
    expect(result.current.profile?.overallBestScore).toBe(75);

    await waitFor(async () => {
      const stored = await loadProfiles();
      expect(stored.Alice?.games.balloon.bestScore).toBe(75);
    });
  });

  it("records a combined result and updates combined/overall bests, totals, and run count", async () => {
    const { result } = await renderPlayer();

    await act(async () => {
      await result.current.createAccount("Alice", "secret1");
    });
    act(() => {
      result.current.recordCombinedResult(120);
    });

    expect(result.current.profile?.combinedBestScore).toBe(120);
    expect(result.current.profile?.overallBestScore).toBe(120);
    expect(result.current.profile?.combinedTotalScore).toBe(120);
    expect(result.current.profile?.challengeRunsCompleted).toBe(1);

    await waitFor(async () => {
      const stored = await loadProfiles();
      expect(stored.Alice?.combinedBestScore).toBe(120);
    });

    act(() => {
      result.current.recordCombinedResult(80);
    });
    expect(result.current.profile?.combinedBestScore).toBe(120);
    expect(result.current.profile?.combinedTotalScore).toBe(200);
    expect(result.current.profile?.challengeRunsCompleted).toBe(2);

    act(() => {
      result.current.recordCombinedResult(200);
    });
    expect(result.current.profile?.combinedBestScore).toBe(200);
    expect(result.current.profile?.overallBestScore).toBe(200);
    expect(result.current.profile?.challengeRunsCompleted).toBe(3);
  });

  it("signs out, clearing the profile, and signs back in with the correct password", async () => {
    const { result } = await renderPlayer();

    await act(async () => {
      await result.current.createAccount("Alice", "secret1");
    });
    act(() => {
      result.current.recordResult("balloon", 75);
    });
    act(() => {
      result.current.signOut();
    });

    expect(result.current.profile).toBeNull();
    expect(await loadCurrentUsername()).toBeNull();
    expect(result.current.existingUsernames).toContain("Alice");

    let response: { ok: true } | { ok: false; error: string } | undefined;
    await act(async () => {
      response = await result.current.signIn("Alice", "secret1");
    });

    expect(response).toEqual({ ok: true });
    expect(result.current.profile?.games.balloon.bestScore).toBe(75);
  });

  it("rejects sign-in with the wrong password and leaves the profile null", async () => {
    const { result } = await renderPlayer();

    await act(async () => {
      await result.current.createAccount("Alice", "secret1");
    });
    act(() => {
      result.current.signOut();
    });

    let response: { ok: true } | { ok: false; error: string } | undefined;
    await act(async () => {
      response = await result.current.signIn("Alice", "wrongpass");
    });

    expect(response?.ok).toBe(false);
    expect(result.current.profile).toBeNull();
  });

  it("rejects sign-in for an unknown username", async () => {
    const { result } = await renderPlayer();

    let response: { ok: true } | { ok: false; error: string } | undefined;
    await act(async () => {
      response = await result.current.signIn("Nobody", "secret1");
    });

    expect(response?.ok).toBe(false);
    expect(result.current.profile).toBeNull();
  });

  it("restores the previously signed-in player on remount (app reopen)", async () => {
    const first = await renderPlayer();
    await act(async () => {
      await first.result.current.createAccount("Alice", "secret1");
    });
    act(() => {
      first.result.current.recordResult("balloon", 50);
    });

    await waitFor(async () => {
      const stored = await loadProfiles();
      expect(stored.Alice?.games.balloon.bestScore).toBe(50);
    });

    const second = await renderPlayer();
    expect(second.result.current.profile?.username).toBe("Alice");
    expect(second.result.current.profile?.games.balloon.bestScore).toBe(50);
  });
});
