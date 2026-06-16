import { useState } from "react";
import { AllGamesChallenge } from "./components/AllGamesChallenge";
import { BalloonGame } from "./components/BalloonGame";
import { DbViewer } from "./components/DbViewer";
import { Hub } from "./components/Hub";
import { LogicGame } from "./components/LogicGame";
import { MathGame } from "./components/MathGame";
import { MemoryGame } from "./components/MemoryGame";
import { Profile } from "./components/Profile";
import { SignIn } from "./components/SignIn";
import { PlayerProvider, usePlayerProfile } from "./player/PlayerContext";
import type { GameId } from "./player/types";

export type { GameId };
type Screen = "hub" | "profile" | "challenge" | "db" | GameId;

function AppShell() {
  const { profile, loading, createAccount, signIn, signOut, recordCombinedResult } = usePlayerProfile();
  const [screen, setScreen] = useState<Screen>("hub");
  const goHub = () => setScreen("hub");

  if (loading) {
    return (
      <div className="app__shell home">
        <p className="home__sub">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return <SignIn onCreateAccount={createAccount} onSignIn={signIn} />;
  }

  return (
    <div className="app">
      {screen === "hub" && (
        <Hub
          profile={profile}
          onPick={setScreen}
          onProfile={() => setScreen("profile")}
          onDb={() => setScreen("db")}
          onSignOut={signOut}
        />
      )}
      {screen === "profile" && (
        <Profile
          profile={profile}
          onBack={goHub}
          onSignOut={() => {
            signOut();
            goHub();
          }}
        />
      )}
      {screen === "db" && <DbViewer onBack={goHub} />}
      {screen === "challenge" && (
        <AllGamesChallenge profile={profile} onExit={goHub} recordCombinedResult={recordCombinedResult} />
      )}
      {screen === "memory" && <MemoryGame onExit={goHub} />}
      {screen === "math" && <MathGame onExit={goHub} />}
      {screen === "logic" && <LogicGame onExit={goHub} />}
      {screen === "balloon" && <BalloonGame onExit={goHub} />}
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  );
}
