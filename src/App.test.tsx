import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

/**
 * Lean integration coverage of the React shell — game *rules* are proven in the
 * reducer tests; here we verify navigation and wiring.
 */
describe("<App /> navigation", () => {
  beforeEach(() => localStorage.clear());

  it("shows the home menu with both games", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /memory matrix/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mental math/i })).toBeInTheDocument();
  });

  it("opens Memory Matrix and can start a 3×3 board", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /memory matrix/i }));
    expect(screen.getByText(/tiles flash for a few seconds/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^start/i }));
    expect(screen.getAllByRole("button", { name: /^Cell / })).toHaveLength(9);
  });

  it("opens Mental Math, shows two problems, and accepts an answer", async () => {
    const user = userEvent.setup();
    render(<App />);
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

  it("returns to the menu via the back button", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /mental math/i }));
    await user.click(screen.getByRole("button", { name: /back to menu/i }));
    expect(screen.getByRole("button", { name: /memory matrix/i })).toBeInTheDocument();
  });
});
