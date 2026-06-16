import { useState } from "react";

type Mode = "signin" | "create";

interface SignInProps {
  onCreateAccount: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onSignIn: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export function SignIn({ onCreateAccount, onSignIn }: SignInProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      const result = await onCreateAccount(username, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    } else {
      const result = await onSignIn(username, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    }

    setError(null);
  };

  return (
    <div className="app__shell home signin">
      <div className="home__head">
        <h1 className="home__title">
          Brain<span>Arena</span>
        </h1>
        <p className="home__sub">Sign in or create an account to start playing.</p>
      </div>

      <div className="signin__tabs">
        <button
          type="button"
          className={`signin__tab ${mode === "signin" ? "is-active" : ""}`}
          onClick={() => switchMode("signin")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`signin__tab ${mode === "create" ? "is-active" : ""}`}
          onClick={() => switchMode("create")}
        >
          Create Account
        </button>
      </div>

      <form className="signin__form" aria-label="Account" onSubmit={submit}>
        <input
          className="signin__input"
          type="text"
          aria-label="Username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
        />
        <input
          className="signin__input"
          type="password"
          aria-label="Password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={40}
        />
        {mode === "create" && (
          <input
            className="signin__input"
            type="password"
            aria-label="Confirm password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            maxLength={40}
          />
        )}
        <button type="submit" className="btn btn--primary">
          {mode === "create" ? "Create Account" : "Sign In"}
        </button>
        {error && <p role="alert" className="signin__error">{error}</p>}
      </form>
    </div>
  );
}
