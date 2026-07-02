import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { balloonCountForLevel } from "./balloon/logic";
import { MIN_LEVEL, BALLOON_GAME_MS } from "./balloon/constants";
import { GAME_MS } from "./game/constants";
import { MATH_GAME_MS } from "./math/constants";
import { CUBE_GAME_MS } from "./cube/constants";
import { PATTERN_GAME_MS } from "./pattern/constants";
import { REACTION_GAME_MS } from "./reaction/constants";
import { TRIVIA_GAME_MS } from "./trivia/constants";
import { clearAllForTests } from "./player/db";
import App from "./App";

/** Render the app and wait for the initial profile load to finish. */
async function renderApp() {
  const result = render(<App />);
  await screen.findByRole("form", { name: /account/i });
  return result;
}

async function signUp(user: ReturnType<typeof userEvent.setup>, name: string, password = "secret1") {
  // Switch to the Create Account tab.
  const tab = screen.getAllByRole("button", { name: /create account/i })[0];
  await user.click(tab);

  const form = screen.getByRole("form", { name: /account/i });
  await user.type(within(form).getByLabelText("Username"), name);
  await user.type(within(form).getByLabelText("Password"), password);
  await user.type(within(form).getByLabelText("Confirm password"), password);
  await user.click(within(form).getByRole("button", { name: /create account/i }));

  // Account creation hashes the password asynchronously; wait for either the
  // avatar-setup screen to appear (success) or an error message (failure).
  await waitFor(() => {
    expect(screen.queryByRole("button", { name: /save avatar/i }) ?? screen.queryByRole("alert")).toBeTruthy();
  });

  // A brand-new account routes through one-time avatar setup before the hub.
  const saveAvatar = screen.queryByRole("button", { name: /save avatar/i });
  if (saveAvatar) {
    await user.click(saveAvatar);
    await screen.findByRole("button", { name: /all games challenge/i });
  }
}

async function signIn(user: ReturnType<typeof userEvent.setup>, name: string, password = "secret1") {
  const form = screen.getByRole("form", { name: /account/i });
  await user.type(within(form).getByLabelText("Username"), name);
  await user.type(within(form).getByLabelText("Password"), password);
  await user.click(within(form).getByRole("button", { name: /^sign in$/i }));

  // Sign-in verifies the password hash asynchronously; wait for either the
  // hub to appear (success) or an error message (failure) before continuing.
  await waitFor(() => {
    expect(screen.queryByRole("button", { name: /all games challenge/i }) ?? screen.queryByRole("alert")).toBeTruthy();
  });
}

/**
 * Lean integration coverage of the React shell — game *rules* are proven in the
 * reducer tests; here we verify navigation, auth, and profile wiring.
 */
describe("<App /> navigation", () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearAllForTests();
  });

  it("shows the sign-in screen first", async () => {
    await renderApp();
    expect(screen.getByRole("form", { name: /account/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /memory matrix/i })).not.toBeInTheDocument();
  });

  it("rejects sign-in for an unknown account", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signIn(user, "Nobody");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /memory matrix/i })).not.toBeInTheDocument();
  });

  it("rejects creating an account with an invalid username", async () => {
    const user = userEvent.setup();
    await renderApp();

    const tab = screen.getAllByRole("button", { name: /create account/i })[0];
    await user.click(tab);
    const form = screen.getByRole("form", { name: /account/i });
    await user.type(within(form).getByLabelText("Username"), "a");
    await user.type(within(form).getByLabelText("Password"), "secret1");
    await user.type(within(form).getByLabelText("Confirm password"), "secret1");
    await user.click(within(form).getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /memory matrix/i })).not.toBeInTheDocument();
  });

  it("creating an account signs in and shows the hub", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    // Scoped to the game tile grid — the weekly tournament card's accessible
    // name can also contain a game's name (whichever game is featured this
    // week), so an unscoped query can ambiguously match both.
    const grid = within(document.querySelector(".home__grid") as HTMLElement);
    expect(grid.getByRole("button", { name: /memory matrix/i })).toBeInTheDocument();
    expect(grid.getByRole("button", { name: /mental math/i })).toBeInTheDocument();
    expect(grid.getByRole("button", { name: /logic challenge/i })).toBeInTheDocument();
    expect(grid.getByRole("button", { name: /balloon order/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /all games challenge/i })).toBeInTheDocument();
  });

  it("opens Memory Matrix and can start a 2×2 board", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");
    await user.click(screen.getByRole("button", { name: /memory matrix/i }));
    expect(screen.getByText(/tiles flash for a few seconds/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^start/i }));
    expect(screen.getAllByRole("button", { name: /^Cell / })).toHaveLength(4);
  });

  it("opens Mental Math, shows two problems, and accepts an answer", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");
    await user.click(screen.getByRole("button", { name: /mental math/i }));
    expect(screen.getByText(/two problems, always on screen/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^start/i }));

    // Two problem bubbles are visible (each contains a math expression).
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();

    // Typing a non-numeric value is stripped to digits.
    await user.type(input, "4a2");
    expect((input as HTMLInputElement).value).toBe("42");
  });

  it("opens Logic Challenge, shows a cube structure, and accepts a guess", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");
    // Scoped to the game tile grid — see comment above on the ambiguous
    // "logic challenge" match against the weekly tournament card.
    const grid = within(document.querySelector(".home__grid") as HTMLElement);
    await user.click(grid.getByRole("button", { name: /logic challenge/i }));
    expect(screen.getByText(/cube towers/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^start/i }));

    // The cube structure is rendered as an SVG image.
    expect(screen.getByRole("img", { name: /cubes/i })).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();

    // Typing a non-numeric value is stripped to digits.
    await user.type(input, "1a2");
    expect((input as HTMLInputElement).value).toBe("12");
  });

  it("opens Balloon Order, shows balloons, and scores a correct tap", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");
    await user.click(screen.getByRole("button", { name: /balloon order/i }));
    expect(screen.getByText(/tap them in order/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^start/i }));

    // Level 1 balloons are plain numbers, so the smallest can be found by parsing labels.
    const balloons = screen.getAllByRole("button", { name: /^Balloon /i });
    expect(balloons).toHaveLength(balloonCountForLevel(MIN_LEVEL));

    const smallest = balloons.reduce((min, b) => {
      const value = Number(b.textContent);
      const minValue = Number(min.textContent);
      return value < minValue ? b : min;
    });

    await user.click(smallest);
    expect(screen.getAllByText("25").length).toBeGreaterThan(0);
  });

  it("returns to the hub via the back button", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");
    await user.click(screen.getByRole("button", { name: /mental math/i }));
    await user.click(screen.getByRole("button", { name: /back to menu/i }));
    expect(screen.getByRole("button", { name: /memory matrix/i })).toBeInTheDocument();
  });
});

describe("<App /> profile & unified scoring", () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearAllForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records a completed balloon round into the player's profile stats", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");

    await user.click(screen.getByRole("button", { name: /balloon order/i }));

    vi.useFakeTimers({ shouldAdvanceTime: false, toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"] });
    fireEvent.click(screen.getByRole("button", { name: /^start/i }));

    const balloons = screen.getAllByRole("button", { name: /^Balloon /i });
    const smallest = balloons.reduce((min, b) => {
      const value = Number(b.textContent);
      const minValue = Number(min.textContent);
      return value < minValue ? b : min;
    });
    fireEvent.click(smallest);
    expect(screen.getAllByText("25").length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(BALLOON_GAME_MS + 1000);
    });
    vi.useRealTimers();

    expect(screen.getByText(/^Time!$/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: /profile/i }));

    expect(screen.getAllByText("25").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
  });

  it("rejects sign-in with the wrong password", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");

    await user.click(screen.getByRole("button", { name: /balloon order/i }));
    await user.click(screen.getByRole("button", { name: /back to menu/i }));
    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(screen.getByRole("form", { name: /account/i })).toBeInTheDocument();
    await signIn(user, "Alice", "wrongpassword");

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /memory matrix/i })).not.toBeInTheDocument();
  });

  it("signs out from the hub and restores stats on sign-in with the correct password", async () => {
    const user = userEvent.setup();
    await renderApp();
    await signUp(user, "Alice");

    await user.click(screen.getByRole("button", { name: /balloon order/i }));

    vi.useFakeTimers({ shouldAdvanceTime: false, toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"] });
    fireEvent.click(screen.getByRole("button", { name: /^start/i }));

    const balloons = screen.getAllByRole("button", { name: /^Balloon /i });
    const smallest = balloons.reduce((min, b) => {
      const value = Number(b.textContent);
      const minValue = Number(min.textContent);
      return value < minValue ? b : min;
    });
    fireEvent.click(smallest);

    act(() => {
      vi.advanceTimersByTime(BALLOON_GAME_MS + 1000);
    });
    vi.useRealTimers();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(screen.getByRole("form", { name: /account/i })).toBeInTheDocument();

    await signIn(user, "Alice", "secret1");
    await user.click(screen.getByRole("button", { name: /profile/i }));
    expect(screen.getAllByText("25").length).toBeGreaterThan(0);
  });
});

describe("<App /> All Games Challenge", () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearAllForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs all seven games back-to-back, combines scores, and updates the profile", async () => {
    const user = userEvent.setup();
    const { container } = await renderApp();
    await signUp(user, "Alice");

    await user.click(screen.getByRole("button", { name: /all games challenge/i }));

    // Fake timers must be active before the first stage mounts, since each
    // stage auto-starts its own countdown immediately on mount.
    vi.useFakeTimers({ shouldAdvanceTime: false, toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"] });
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));

    const finishStage = (gameMs: number) => {
      act(() => {
        vi.advanceTimersByTime(gameMs + 1000);
      });
    };

    // Stage 1: Memory Matrix (auto-started)
    expect(screen.getByText(/game 1 of 7/i)).toBeInTheDocument();
    finishStage(GAME_MS);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Stage 2: Mental Math
    expect(screen.getByText(/game 2 of 7/i)).toBeInTheDocument();
    finishStage(MATH_GAME_MS);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Stage 3: Logic Challenge
    expect(screen.getByText(/game 3 of 7/i)).toBeInTheDocument();
    finishStage(CUBE_GAME_MS);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Stage 4: Balloon Order
    expect(screen.getByText(/game 4 of 7/i)).toBeInTheDocument();
    finishStage(BALLOON_GAME_MS);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Stage 5: Fill in the Pattern
    expect(screen.getByText(/game 5 of 7/i)).toBeInTheDocument();
    finishStage(PATTERN_GAME_MS);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Stage 6: Reaction Rush
    expect(screen.getByText(/game 6 of 7/i)).toBeInTheDocument();
    finishStage(REACTION_GAME_MS);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Stage 7: Trivia Sprint
    expect(screen.getByText(/game 7 of 7/i)).toBeInTheDocument();
    finishStage(TRIVIA_GAME_MS);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    vi.useRealTimers();

    // Summary
    expect(screen.getByText(/challenge complete/i)).toBeInTheDocument();
    const total = Number(container.querySelector(".overlay__score")?.textContent);

    await user.click(screen.getByRole("button", { name: /back to hub/i }));
    await user.click(screen.getByRole("button", { name: /profile/i }));

    const combinedBestStat = screen.getByText("Combined best").previousElementSibling;
    expect(combinedBestStat?.textContent).toBe(String(total));
  });
});
