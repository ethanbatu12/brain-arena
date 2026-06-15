import type { GameId } from "../App";

const GAMES: { id: GameId; name: string; tag: string; blurb: string; accent: string }[] = [
  {
    id: "memory",
    name: "Memory Matrix",
    tag: "Visual memory",
    blurb: "Recall the pattern of lit tiles. Clear it and the board grows.",
    accent: "var(--accent)",
  },
  {
    id: "math",
    name: "Mental Math",
    tag: "Speed & arithmetic",
    blurb: "Two problems at once — solve either. Faster and harder scores more.",
    accent: "var(--good)",
  },
];

export function Home({ onPick }: { onPick: (id: GameId) => void }) {
  return (
    <div className="app__shell home">
      <div className="home__head">
        <h1 className="home__title">
          Brain<span>Arena</span>
        </h1>
        <p className="home__sub">Quick games that measure how your mind performs.</p>
      </div>

      <div className="home__grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className="gamecard"
            style={{ ["--card-accent" as string]: g.accent }}
            onClick={() => onPick(g.id)}
          >
            <span className="gamecard__tag">{g.tag}</span>
            <span className="gamecard__name">{g.name}</span>
            <span className="gamecard__blurb">{g.blurb}</span>
            <span className="gamecard__cta">Play ›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
