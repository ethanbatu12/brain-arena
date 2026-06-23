import { useEffect, useRef, useState } from "react";
import { MAP_MEMORY_REVEAL_MS, DIRECTION_GAME_MS, BONUS_EVERY_CORRECT, BONUS_POINTS, POINTS_PER_CORRECT } from "../direction/constants";
import { loadGoogleMaps } from "../direction/google/loader";
import type { DirectionState } from "../direction/types";
import { useDirectionChallenge } from "../hooks/useDirectionChallenge";

interface DirectionChallengeProps {
  onExit: () => void;
  mode?: "solo" | "challenge";
  onRoundComplete?: (score: number) => void;
}

export function DirectionChallenge({ onExit, mode = "solo", onRoundComplete }: DirectionChallengeProps) {
  const { state, best, start, startWithAddress, reset, answer } = useDirectionChallenge();
  const { phase } = state;
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (mode === "challenge" && phase === "idle") start();
  }, [mode, phase, start]);

  const submitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) startWithAddress(address);
  };

  return (
    <div className="app__shell">
      <div className="app__head">
        <button className="app__back" onClick={onExit} aria-label="Back to menu">
          ‹ Menu
        </button>
        <h1 className="app__logo">
          Direction<span>Challenge</span>
        </h1>
        <p className="app__tag">find your way</p>
      </div>

      <DirectionHUD state={state} best={best} />

      <main className="app__stage">
        {phase === "idle" && (
          <Overlay>
            <h2>Direction Challenge</h2>
            <p className="overlay__lead">
              Questions are generated from your real surroundings — real roads, parks,
              schools, and landmarks near your actual location. Allow location access
              to begin; every round is unique to where you are.
            </p>
            <ul className="overlay__rules">
              <li>
                Correct answer: <b>+{POINTS_PER_CORRECT} points</b>
              </li>
              <li>
                Every <b>{BONUS_EVERY_CORRECT} correct</b>: an extra <b>+{BONUS_POINTS} bonus</b>
              </li>
              <li>3 minutes — answer as many as you can</li>
            </ul>
            <button className="btn btn--primary" onClick={start}>
              Start · 3 minutes
            </button>
            {best > 0 && <p className="overlay__best">Best score {best.toLocaleString()}</p>}
            <AddressFallback address={address} setAddress={setAddress} onSubmit={submitAddress} />
          </Overlay>
        )}

        {phase === "locating" && (
          <Overlay>
            <h2>Finding you…</h2>
            <p className="overlay__lead">Requesting location access from your browser.</p>
          </Overlay>
        )}

        {phase === "loading" && (
          <Overlay>
            <h2>Mapping your surroundings…</h2>
            <p className="overlay__lead">Fetching nearby roads and landmarks, plus a few real driving routes.</p>
          </Overlay>
        )}

        {phase === "error" && (
          <Overlay>
            <h2>Couldn't start</h2>
            <p className="overlay__lead">{state.errorMessage}</p>
            <div className="overlay__actions">
              <button className="btn btn--primary" onClick={start}>
                Try GPS again
              </button>
              <button className="btn btn--ghost" onClick={onExit}>
                Menu
              </button>
            </div>
            <AddressFallback address={address} setAddress={setAddress} onSubmit={submitAddress} />
          </Overlay>
        )}

        {phase === "playing" && state.question && state.origin && (
          <DirectionPlayingView state={state} answer={answer} />
        )}

        {phase === "over" && (
          <Overlay>
            <h2>Time!</h2>
            <div className="overlay__score">{state.score.toLocaleString()}</div>
            <p className="overlay__lead">
              {state.correctCount} correct of {state.totalAnswered} · {accuracy(state)}% accuracy
              {state.score >= best && state.score > 0 ? " · new best!" : ""}
            </p>
            <div className="overlay__actions">
              {mode === "challenge" ? (
                <button className="btn btn--primary" onClick={() => onRoundComplete?.(state.score)}>
                  Continue ›
                </button>
              ) : (
                <>
                  <button className="btn btn--primary" onClick={start}>
                    Play again
                  </button>
                  <button
                    className="btn btn--ghost"
                    onClick={() => {
                      reset();
                      onExit();
                    }}
                  >
                    Menu
                  </button>
                </>
              )}
            </div>
          </Overlay>
        )}
      </main>
    </div>
  );
}

function DirectionPlayingView({
  state,
  answer,
}: {
  state: DirectionState;
  answer: (questionId: number, choiceIndex: number) => void;
}) {
  const question = state.question!;
  const origin = state.origin!;
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [mapVisible, setMapVisible] = useState(!question.showMapFirst);

  // Reset the reveal-then-hide timer whenever a new map-memory question appears.
  useEffect(() => {
    if (!question.showMapFirst) {
      setMapVisible(true);
      return;
    }
    setMapVisible(true);
    const id = setTimeout(() => setMapVisible(false), MAP_MEMORY_REVEAL_MS);
    return () => clearTimeout(id);
  }, [question.id, question.showMapFirst]);

  useEffect(() => {
    if (!mapVisible || !mapRef.current) return;
    let cancelled = false;
    const markers: google.maps.Marker[] = [];

    loadGoogleMaps().then((g) => {
      if (cancelled || !mapRef.current) return;

      const map = new g.maps.Map(mapRef.current, {
        center: { lat: origin.lat, lng: origin.lon },
        zoom: 15,
        mapTypeId: g.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true,
        clickableIcons: false,
      });
      googleMapRef.current = map;

      markers.push(
        new g.maps.Marker({
          position: { lat: origin.lat, lng: origin.lon },
          map,
          title: "You",
          icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#ffffff", fillOpacity: 1, strokeColor: "#000000", strokeWeight: 2 },
        }),
      );

      for (const f of state.features) {
        markers.push(
          new g.maps.Marker({
            position: { lat: f.lat, lng: f.lon },
            map,
            title: f.name,
            icon: { path: g.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "#facc15", fillOpacity: 0.9, strokeColor: "#0b0d12", strokeWeight: 1 },
          }),
        );
      }
    });

    return () => {
      cancelled = true;
      for (const m of markers) m.setMap(null);
      googleMapRef.current = null;
    };
  }, [mapVisible, origin, state.features]);

  return (
    <div className="direction__playing">
      {mapVisible ? (
        <div ref={mapRef} className="direction__map" />
      ) : (
        <div className="direction__map direction__map--hidden">
          <p>Map hidden — answer from memory</p>
        </div>
      )}

      <div className="direction__question">
        <p className="direction__prompt">{question.prompt}</p>
        <div className="direction__choices">
          {question.choices.map((choice, i) => (
            <button
              key={`${question.id}-${i}`}
              className="direction__choice"
              onClick={() => answer(question.id, i)}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddressFallback({
  address,
  setAddress,
  onSubmit,
}: {
  address: string;
  setAddress: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form className="direction__address" onSubmit={onSubmit}>
      <p className="direction__address-hint">Can't get your location? Enter an address instead:</p>
      <div className="direction__address-row">
        <input
          className="signin__input"
          type="text"
          aria-label="Address"
          placeholder="123 Main St, City, State"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button type="submit" className="btn btn--ghost">
          Use this address
        </button>
      </div>
    </form>
  );
}

function accuracy(state: DirectionState): number {
  const total = state.correctCount + state.wrongCount;
  return total === 0 ? 100 : Math.round((state.correctCount / total) * 100);
}

function DirectionHUD({ state, best }: { state: DirectionState; best: number }) {
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const pct = Math.max(0, Math.min(100, (state.timeLeftMs / DIRECTION_GAME_MS) * 100));
  const low = state.timeLeftMs <= 20_000 && state.phase === "playing";

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score" value={state.score.toLocaleString()} />
        <Stat label="Correct" value={`${state.correctCount}`} />
        <Stat label="Best" value={best.toLocaleString()} />
      </div>
      {state.phase === "playing" && (
        <p className="hud__sub">{BONUS_EVERY_CORRECT - (state.correctCount % BONUS_EVERY_CORRECT)} correct until bonus</p>
      )}
      <div className="hud__timer">
        <div className="hud__timer-row">
          <span className="hud__phase hud__phase--recall">
            {state.phase === "playing" ? "Go" : state.phase === "over" ? "Time" : "Ready"}
          </span>
          <span className={`hud__clock ${low ? "is-low" : ""}`}>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="hud__bar" aria-hidden>
          <div className={`hud__bar-fill ${low ? "is-low" : ""}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay">
      <div className="overlay__card">{children}</div>
    </div>
  );
}
