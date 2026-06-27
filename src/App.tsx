import { useState } from "react";
import { AchievementToast } from "./components/AchievementToast";
import { AllGamesChallenge } from "./components/AllGamesChallenge";
import { AvatarEditor } from "./components/AvatarEditor";
import { BalloonGame } from "./components/BalloonGame";
import { ChessLobby } from "./components/ChessLobby";
import { DirectionChallenge } from "./components/DirectionChallenge";
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
import { WeeklyTournament } from "./components/WeeklyTournament";
import { TournamentHistoryPage } from "./components/TournamentHistoryPage";
import { LevelsPage } from "./components/LevelsPage";
import { PetShop } from "./components/PetShop";
import { SeasonPass } from "./components/SeasonPass";
import { SeasonHistoryPage } from "./components/SeasonHistoryPage";
import { PlayerProvider, usePlayerProfile } from "./player/PlayerContext";
import type { GameId } from "./player/types";
import { currentTournamentWeek } from "./tournament/schedule";

export type { GameId };
type Screen =
  | "hub"
  | "profile"
  | "levels"
  | "avatar-setup"
  | "avatar-edit"
  | "leaderboard"
  | "challenge"
  | "chess"
  | "chess-full"
  | "chess-puzzle"
  | "chess-rated"
  | "pattern-lobby"
  | "pattern-timed"
  | "pattern-rated"
  | "tournament"
  | "tournament-history"
  | "pet-shop"
  | "season-pass"
  | "season-history"
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
    setAvatarConfig,
    buyPet,
    equipPet,
    setPetAccessories,
    renamePet,
    claimSeasonReward,
  } = usePlayerProfile();
  const [screen, setScreen] = useState<Screen>("hub");
  const [petShopTab, setPetShopTab] = useState<"shop" | "collection" | "customize">("shop");
  const goHub = () => setScreen("hub");

  const handleCreateAccount = async (username: string, password: string) => {
    const result = await createAccount(username, password);
    if (result.ok) setScreen("avatar-setup");
    return result;
  };

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
        onCreateAccount={handleCreateAccount}
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
          onLeaderboard={() => setScreen("leaderboard")}
          onTournament={() => setScreen("tournament")}
          onPetShop={() => setScreen("pet-shop")}
          onSeasonPass={() => setScreen("season-pass")}
          onSignOut={signOut}
        />
      )}
      {screen === "pet-shop" && (
        <PetShop
          profile={profile}
          onBack={goHub}
          onBuyPet={buyPet}
          onEquipPet={equipPet}
          onSetPetAccessories={setPetAccessories}
          onRenamePet={renamePet}
          initialTab={petShopTab}
        />
      )}
      {screen === "season-pass" && (
        <SeasonPass
          profile={profile}
          onBack={goHub}
          onViewHistory={() => setScreen("season-history")}
          onClaimReward={claimSeasonReward}
        />
      )}
      {screen === "season-history" && <SeasonHistoryPage profile={profile} onBack={() => setScreen("season-pass")} />}
      {screen === "tournament" && (
        <WeeklyTournament
          profile={profile}
          onBack={goHub}
          onPlayFeaturedGame={() => setScreen(currentTournamentWeek().gameId)}
          onViewHistory={() => setScreen("tournament-history")}
        />
      )}
      {screen === "tournament-history" && <TournamentHistoryPage onBack={() => setScreen("tournament")} />}
      {screen === "profile" && (
        <Profile
          profile={profile}
          onBack={goHub}
          onEditAvatar={() => setScreen("avatar-edit")}
          onEditPet={() => {
            setPetShopTab("customize");
            setScreen("pet-shop");
          }}
          onViewLevels={() => setScreen("levels")}
          onSignOut={() => {
            signOut();
            goHub();
          }}
        />
      )}
      {screen === "levels" && <LevelsPage profile={profile} onBack={() => setScreen("profile")} />}
      {screen === "avatar-setup" && (
        <AvatarEditor
          initialConfig={profile.avatarConfig}
          playerLevel={profile.level}
          xp={profile.xp}
          ownedExclusives={new Set(profile.exclusiveCosmetics)}
          onSave={(config) => {
            setAvatarConfig(config);
            goHub();
          }}
        />
      )}
      {screen === "avatar-edit" && (
        <AvatarEditor
          initialConfig={profile.avatarConfig}
          playerLevel={profile.level}
          xp={profile.xp}
          ownedExclusives={new Set(profile.exclusiveCosmetics)}
          onSave={(config) => {
            setAvatarConfig(config);
            setScreen("profile");
          }}
          onCancel={() => setScreen("profile")}
        />
      )}
      {screen === "leaderboard" && (
        <Leaderboard
          profiles={allProfiles}
          currentUsername={profile.username}
          onBack={goHub}
        />
      )}
      {screen === "challenge" && (
        <AllGamesChallenge profile={profile} onExit={goHub} recordCombinedResult={recordCombinedResult} />
      )}
      {screen === "memory" && <MemoryGame onExit={goHub} />}
      {screen === "math" && <MathGame onExit={goHub} />}
      {screen === "logic" && <LogicGame onExit={goHub} />}
      {screen === "balloon" && <BalloonGame onExit={goHub} />}
      {screen === "reaction" && <ReactionGame onExit={goHub} />}
      {screen === "trivia" && <TriviaGame onExit={goHub} />}
      {screen === "direction" && <DirectionChallenge onExit={goHub} />}
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
