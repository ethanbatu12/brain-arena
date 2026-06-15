# Brain Arena

A brain-training app — a home menu of quick games that measure how your mind
performs. Built test-first.

## Games

### 1. Memory Matrix — visual memory

1. A grid of tiles appears and some light up for **3 seconds** (**4 seconds** on
   bigger 5×5+ boards, which have more to memorize).
2. The lights vanish — tap every tile that was lit.
3. **Recall the whole pattern → the board grows** one row & column, and you score.
4. **One wrong tap → the round ends, the board shrinks**, no points.
5. You have **60 seconds total**. Bigger boards are worth far more
   (`score = size² × 10`), so growing the board is the way to a high score.

Points are awarded **only for fully completed rounds** — partial recall scores nothing.

### 2. Mental Math — speed sprint

Two problems are **always on screen** (left & right). Solve **either one** —
type its answer and press **Enter**; the input matches against both, so you
pick whichever is faster for you.

- Starts easy (`15 + 24`); operations unlock as you climb: `+`, `−`, `×`, `÷`.
- **Adaptive difficulty:** the level behaves like a rating that drifts toward
  your true ability (up on correct, gently down on wrong), so questions stay at
  the edge of what you can do quickly — up to **2-digit × 1-digit**.
- **Harder problems are worth more** (`15+24` ≈ 10 pts, `87×9` ≈ 60 pts), so the
  final score weights difficulty *and* speed — a fair proxy for mental-math
  ability over a 60-second sprint. Division is always exact; subtraction never
  goes negative.

## Run it

```bash
npm install
npm run dev      # http://localhost:5180
npm test         # run the test suite (Vitest)
npm run build    # type-check + production build
```

## Design / architecture

The game rules are isolated as **pure, deterministic functions** so they can be
exhaustively unit-tested with no DOM or timers:

| File | Responsibility |
|------|----------------|
| `src/game/*` | Memory Matrix: logic, reducer, cell-state, tests |
| `src/math/*` | Mental Math: problem generation, scoring, reducer, tests |
| `src/game/rng.ts` | Seeded PRNG (mulberry32) — shared, for deterministic tests |
| `src/hooks/*` | Thin React shells: timers + best-score persistence |
| `src/components/*` | Presentational UI (Home menu, Grid, Cell, HUD, bubbles) |

Randomness is injected (`Rng`), so every rule — growth/shrink clamping, scoring,
"points only on full rounds", timeout-from-any-phase, no double-counting — is
covered by deterministic tests in `src/game/*.test.ts`.

### Tech

Vite · React 18 · TypeScript (strict) · Vitest + Testing Library.

## Roadmap (other brain games)

The pure-reducer + injected-rng pattern is the template for the next games
(math sprint, reaction, sequence) — drop a new `game/` module and a thin shell.
