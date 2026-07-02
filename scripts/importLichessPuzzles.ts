/**
 * One-off script: converts a slice of the real Lichess puzzle database
 * (CC0-licensed, https://database.lichess.org) into this game's ChessPuzzle
 * format, respecting the existing rating tiers so harder puzzles land in
 * harder bands and easier puzzles land in easier bands.
 *
 * Requires: puzzles.csv.zst already downloaded to the scratch path below,
 * and `npm install --no-save fzstd` run first.
 */
import { readFileSync, writeFileSync } from "fs";
import { Decompress } from "fzstd";
import { loadFen, makeMove, toFen, parseSquare } from "../src/chess/engine";
import type { Move, PieceType } from "../src/chess/types";

const ZST_PATH =
  "C:/Users/12678/AppData/Local/Temp/claude/C--Users-12678-Downloads-GamesDev/fca29d4c-280a-4e51-b27d-254ca958754e/scratchpad/puzzles.csv.zst";

// Mirrors src/chess/puzzles.ts RATING_TIERS exactly.
const TIERS = [
  { difficulty: "beginner", min: 0, max: 400, idBase: 11000, want: 20 },
  { difficulty: "intermediate", min: 401, max: 800, idBase: 12000, want: 20 },
  { difficulty: "advanced", min: 801, max: 1200, idBase: 13000, want: 20 },
  { difficulty: "expert", min: 1201, max: 1600, idBase: 14000, want: 20 },
  { difficulty: "master", min: 1601, max: 2000, idBase: 15000, want: 20 },
  { difficulty: "grandmaster", min: 2001, max: 9999, idBase: 16000, want: 20 },
] as const;

function uciToMove(uci: string): Move {
  const from = parseSquare(uci.slice(0, 2));
  const to = parseSquare(uci.slice(2, 4));
  const promoChar = uci.length > 4 ? uci[4].toUpperCase() : undefined;
  const move: Move = { from, to };
  if (promoChar) move.promotion = promoChar as PieceType;
  return move;
}

/** Maps Lichess theme tags to this game's PuzzleType + a short display theme. */
function classify(themes: string[]): { puzzleType: string; theme: string } {
  const has = (t: string) => themes.includes(t);
  if (has("mateIn1") || has("mateIn2") || has("mateIn3") || has("mateIn4") || has("mateIn5") || has("mate"))
    return { puzzleType: "mate", theme: "checkmate" };
  if (has("fork")) return { puzzleType: "fork", theme: "fork" };
  if (has("pin")) return { puzzleType: "pin", theme: "pin" };
  if (has("skewer")) return { puzzleType: "skewer", theme: "skewer" };
  if (has("discoveredAttack")) return { puzzleType: "discovered", theme: "discovered attack" };
  if (has("promotion")) return { puzzleType: "promotion", theme: "promotion" };
  if (has("endgame")) return { puzzleType: "endgame", theme: "endgame" };
  if (has("defensiveMove")) return { puzzleType: "defensive", theme: "only move" };
  if (has("sacrifice")) return { puzzleType: "sacrifice", theme: "sacrifice" };
  if (has("hangingPiece") || has("advantage") || has("crushing"))
    return { puzzleType: "material", theme: "material win" };
  return { puzzleType: "tactic", theme: "tactic" };
}

const DESCRIPTIONS: Record<string, string> = {
  mate: "There is a forced checkmate — find it.",
  fork: "One move wins material by attacking two things at once. Find it.",
  pin: "A pinned piece can't be the only thing standing in your way. Find the winning move.",
  skewer: "Line up your attack to win material through a skewer. Find it.",
  discovered: "Move a piece out of the way to unleash a hidden attack.",
  promotion: "Push your advantage all the way to the back rank.",
  endgame: "Convert this endgame with precise, forcing play.",
  defensive: "Only one move keeps you in the game. Find it.",
  sacrifice: "Give up material now to win big later. Find the sacrifice.",
  material: "There's a way to win material here. Find it.",
  tactic: "There's a forcing combination here. Find it.",
};

function buildExplanation(puzzleType: string, theme: string, solveLen: number): string {
  const moveWord = solveLen === 1 ? "a single forcing move" : `a forced ${solveLen}-move sequence`;
  return `This position is won through ${moveWord} built around a ${theme}. The line above is the verified best play from the Lichess puzzle database.`;
}

async function decompressPartial(path: string): Promise<string> {
  const compressed = readFileSync(path);
  const chunks: Uint8Array[] = [];
  const dec = new Decompress((chunk) => chunks.push(chunk));
  try {
    dec.push(compressed, true);
  } catch {
    // Expected: we only have a byte-range slice, so the final zstd block
    // is truncated. Whatever decoded before the error is still valid CSV.
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(out);
}

function parseCsvLine(line: string): string[] {
  // Lichess puzzle CSV has no quoted/escaped commas in these columns — safe to split.
  return line.split(",");
}

interface Candidate {
  entry: string;
  puzzleType: string;
}

async function main() {
  console.log("Decompressing Lichess puzzle slice...");
  const text = await decompressPartial(ZST_PATH);
  const lines = text.split("\n");
  // Drop header and the last (likely truncated) line.
  const rows = lines.slice(1, -1);
  console.log(`Parsed ${rows.length} candidate puzzle rows.`);

  // Phase 1: gather a generous candidate pool per tier (not just the first N),
  // so we can pick for tactic-type variety instead of whatever appears first.
  const pool: Record<string, Candidate[]> = {};
  for (const t of TIERS) pool[t.difficulty] = [];
  const POOL_CAP = 300;

  let seen = 0;
  let skipped = 0;

  for (const row of rows) {
    const cols = parseCsvLine(row);
    if (cols.length < 8) continue;
    const [, fen, movesStr, ratingStr, , , , themesStr] = cols;
    const rating = Number(ratingStr);
    if (!fen || !movesStr || Number.isNaN(rating)) continue;

    const tier = TIERS.find((t) => rating >= t.min && rating <= t.max);
    if (!tier) continue;
    if (pool[tier.difficulty].length >= POOL_CAP) continue;

    const uciMoves = movesStr.trim().split(" ");
    if (uciMoves.length < 2) continue; // need at least setup + 1 solving move

    try {
      let state = loadFen(fen);
      const setupMove = uciToMove(uciMoves[0]);
      const before = toFen(state);
      state = makeMove(state, setupMove);
      const puzzleFen = toFen(state);
      if (puzzleFen === before) { skipped++; continue; } // illegal setup move — skip

      const solutionUci = uciMoves.slice(1);
      const solution: Move[] = [];
      let replay = state;
      let valid = true;
      for (const uci of solutionUci) {
        const mv = uciToMove(uci);
        const prevFen = toFen(replay);
        replay = makeMove(replay, mv);
        if (toFen(replay) === prevFen) { valid = false; break; } // illegal move per our engine
        solution.push(mv);
      }
      if (!valid || solution.length === 0) { skipped++; continue; }

      const themes = (themesStr ?? "").split(" ").filter(Boolean);
      const { puzzleType, theme } = classify(themes);
      const description = DESCRIPTIONS[puzzleType] ?? DESCRIPTIONS.tactic;
      const explanation = buildExplanation(puzzleType, theme, solution.length);

      const solutionCode = solution
        .map((m) => {
          const from = `sq("${squareName(m.from)}")`;
          const to = `sq("${squareName(m.to)}")`;
          const promo = m.promotion ? `, promotion: "${m.promotion}"` : "";
          return `{ from: ${from}, to: ${to}${promo} }`;
        })
        .join(", ");

      // id assigned later once we know final selection order
      const entryTemplate = `  {
    id: __ID__, ratingMin: ${tier.min}, ratingMax: ${tier.max},
    fen: "${puzzleFen}",
    solution: [${solutionCode}],
    difficulty: "${tier.difficulty}", puzzleType: "${puzzleType}", theme: "${theme}",
    description: "${description}",
    explanation: "${explanation}",
  },`;

      pool[tier.difficulty].push({ entry: entryTemplate, puzzleType });
      seen++;
    } catch {
      skipped++;
      continue;
    }
  }

  console.log(`Validated ${seen} legal puzzles, skipped ${skipped} invalid rows.`);
  for (const t of TIERS) console.log(`  ${t.difficulty} pool: ${pool[t.difficulty].length}`);

  // Phase 2: select `want` per tier, capping any single tactic type so the
  // final set is varied (round-robin across distinct types present).
  const collected: Record<string, string[]> = {};
  for (const t of TIERS) {
    const candidates = pool[t.difficulty];
    const byType = new Map<string, Candidate[]>();
    for (const c of candidates) {
      if (!byType.has(c.puzzleType)) byType.set(c.puzzleType, []);
      byType.get(c.puzzleType)!.push(c);
    }
    const types = Array.from(byType.keys());
    const chosen: Candidate[] = [];
    let round = 0;
    while (chosen.length < t.want && types.some((ty) => byType.get(ty)!.length > 0)) {
      for (const ty of types) {
        const bucket = byType.get(ty)!;
        if (bucket.length > 0 && chosen.length < t.want) chosen.push(bucket.shift()!);
      }
      round++;
      if (round > 50) break;
    }
    collected[t.difficulty] = chosen.map((c, i) => c.entry.replace("__ID__", String(t.idBase + i)));
  }

  const outPath = "scripts/lichessPuzzlesOutput.txt";
  let out = "";
  for (const t of TIERS) {
    out += `\n  // ═══ Lichess-sourced ${t.difficulty.toUpperCase()} (${t.min}-${t.max}) ═══\n`;
    out += collected[t.difficulty].join("\n") + "\n";
  }
  writeFileSync(outPath, out, "utf-8");
  console.log(`\nWrote generated puzzle entries to ${outPath}`);
}

function squareName(sq: number): string {
  const file = sq % 8;
  const rank = Math.floor(sq / 8);
  return String.fromCharCode(97 + file) + (rank + 1);
}

main();
