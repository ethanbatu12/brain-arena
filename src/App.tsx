import { useState } from "react";
import { Home } from "./components/Home";
import { MathGame } from "./components/MathGame";
import { MemoryGame } from "./components/MemoryGame";

export type GameId = "memory" | "math";
type Screen = "home" | GameId;

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const goHome = () => setScreen("home");

  return (
    <div className="app">
      {screen === "home" && <Home onPick={setScreen} />}
      {screen === "memory" && <MemoryGame onExit={goHome} />}
      {screen === "math" && <MathGame onExit={goHome} />}
    </div>
  );
}
