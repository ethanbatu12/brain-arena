interface ChessLobbyProps {
  onFullChess: () => void;
  onPuzzleRush: () => void;
  onRatedPuzzles: () => void;
  onBack: () => void;
}

export function ChessLobby({ onFullChess, onPuzzleRush, onRatedPuzzles, onBack }: ChessLobbyProps) {
  return (
    <div className="app__shell home">
      <div className="app__head">
        <h1 className="app__logo">Chess<span>.</span></h1>
        <button className="app__back" onClick={onBack}>‹ Hub</button>
      </div>

      <div className="home__grid" style={{ marginTop: "2rem" }}>
        <button className="gamecard gamecard--featured" style={{ ["--card-accent" as string]: "var(--chess)" }}
          onClick={onFullChess}>
          <span className="gamecard__tag">Strategy</span>
          <span className="gamecard__name">Full Chess</span>
          <span className="gamecard__blurb">
            Play a complete game against the AI. Choose your color and difficulty.
            All official rules — castling, en passant, promotion and more.
          </span>
          <span className="gamecard__cta">Play ›</span>
        </button>

        <button className="gamecard gamecard--featured" style={{ ["--card-accent" as string]: "var(--chess-puzzle)" }}
          onClick={onPuzzleRush}>
          <span className="gamecard__tag">Tactics · 60 s</span>
          <span className="gamecard__name">Puzzle Rush</span>
          <span className="gamecard__blurb">
            Solve as many chess puzzles as possible in 60 seconds.
            Forks, pins, skewers, checkmates and more — increasing difficulty.
          </span>
          <span className="gamecard__cta">Rush ›</span>
        </button>

        <button className="gamecard gamecard--featured" style={{ ["--card-accent" as string]: "var(--chess-rated, #a78bfa)" }}
          onClick={onRatedPuzzles}>
          <span className="gamecard__tag">Rating · 1000+</span>
          <span className="gamecard__name">Rated Puzzles</span>
          <span className="gamecard__blurb">
            Solve puzzles and earn a rating. Faster solutions earn more points.
            Track your progress with your personal rating history.
          </span>
          <span className="gamecard__cta">Solve ›</span>
        </button>
      </div>
    </div>
  );
}
