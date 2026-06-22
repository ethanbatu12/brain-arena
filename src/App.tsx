import { useState } from "react";
import { AchievementToast } from "./components/AchievementToast";
import { AllGamesChallenge } from "./components/AllGamesChallenge";
import { BalloonGame } from "./components/BalloonGame";
import { ChessLobby } from "./components/ChessLobby";
import { DbViewer } from "./components/DbViewer";
import { FullChessGame } from "./components/FullChessGame";
import { Hub } from "./components/Hub";
import { Leaderboard } from "./components/Leaderboard";
import { LogicGame } from "./components/LogicGame";
import { MathGame } from "./components/MathGame";
import { MemoryGame } from "./components/MemoryGame";
import { PatternGame } from "./components/PatternGame";
import { PatternLobby } from "./components/PatternLobby";
import { Profile } from "./components/Profile";
import { ReactionGame } from "./components/ReactionGame";
import { TriviaGame } from "./components/TriviaGame";
import { RatedPatterns } from "./components/RatedPatterns";
import { PuzzleRush } from "./components/PuzzleRush";
import { RatedPuzzles } from "./components/RatedPuzzles";
import { SignIn } from "./components/SignIn";
import { PlayerProvider, usePlayerProfile } from "./player/PlayerContext";
import type { GameId } from "./player/types";

export type { GameId };
type Screen =
  | "hub"
  | "profile"
  | "leaderboard"
  | "challenge"
  | "db"
  | "chess"
  | "chess-full"
  | "chess-puzzle"
  | "chess-rated"
  | "pattern-lobby"
  | "pattern-timed"
  | "pattern-rated"
  | GameId;

function AppShell() {
  const {
    profile,
    loading,
    allProfiles,
    pendingAchievements,
    dismissPendingAchievements,
    bannedNotice,
    dismissBannedNotice,
    createAccount,
    signIn,
    signOut,
    recordCombinedResult,
    recordRatedPuzzle,
  } = usePlayerProfile();
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
    return (
      <SignIn
        onCreateAccount={createAccount}
        onSignIn={signIn}
        initialError={bannedNotice}
        onDismissInitialError={dismissBannedNotice}
      />
    );
  }

  // Show the first pending achievement as a toast; dismiss removes it from queue.
  const topAchievement = pendingAchievements[0] ?? null;

  return (
    <div className="app">
      {topAchievement && (
        <AchievementToast
          achievement={topAchievement}
          onDismiss={dismissPendingAchievements}
        />
      )}

      {screen === "hub" && (
        <Hub
          profile={profile}
          onPick={setScreen}
          onChess={() => setScreen("chess")}
          onProfile={() => setScreen("profile")}
          onDb={() => setScreen("db")}
          onLeaderboard={() => setScreen("leaderboard")}
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
      {screen === "leaderboard" && (
        <Leaderboard
          profiles={allProfiles}
          currentUsername={profile.username}
          onBack={goHub}
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
      {screen === "reaction" && <ReactionGame onExit={goHub} />}
      {screen === "trivia" && <TriviaGame onExit={goHub} />}
      {screen === "pattern" && (
        <PatternLobby
          ratedPatterns={profile.ratedPatterns}
          onTimed={() => setScreen("pattern-timed")}
          onRated={() => setScreen("pattern-rated")}
          onBack={goHub}
        />
      )}
      {screen === "pattern-lobby" && (
        <PatternLobby
          ratedPatterns={profile.ratedPatterns}
          onTimed={() => setScreen("pattern-timed")}
          onRated={() => setScreen("pattern-rated")}
          onBack={goHub}
        />
      )}
      {screen === "pattern-timed" && <PatternGame onExit={() => setScreen("pattern")} />}
      {screen === "pattern-rated" && <RatedPatterns onExit={() => setScreen("pattern")} />}
      {screen === "chess" && (
        <ChessLobby
          onFullChess={() => setScreen("chess-full")}
          onPuzzleRush={() => setScreen("chess-puzzle")}
          onRatedPuzzles={() => setScreen("chess-rated")}
          onBack={goHub}
        />
      )}
      {screen === "chess-full" && <FullChessGame onExit={() => setScreen("chess")} />}
      {screen === "chess-puzzle" && <PuzzleRush onExit={() => setScreen("chess")} />}
      {screen === "chess-rated" && (
        <RatedPuzzles
          ratedPuzzles={profile.ratedPuzzles}
          onExit={() => setScreen("chess")}
          onResult={recordRatedPuzzle}
        />
      )}
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
