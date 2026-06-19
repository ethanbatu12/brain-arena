/**
 * Verify every puzzle in puzzles.ts using Stockfish at depth 20.
 * Outputs: puzzle id, expected move, Stockfish best move, and PASS/FAIL.
 *
 * Run with: node scripts/verify-puzzles.mjs
 */

import { createRequire } from "module";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Inline the puzzle data (mirrors puzzles.ts) ───────────────────────────────
function sq(name) {
  const file = name.charCodeAt(0) - 97;
  const rank = parseInt(name[1]) - 1;
  return rank * 8 + file;
}
function sqName(idx) {
  return String.fromCharCode(97 + (idx % 8)) + (Math.floor(idx / 8) + 1);
}
function moveToUci(m) {
  return sqName(m.from) + sqName(m.to) + (m.promotion ? m.promotion.toLowerCase() : "");
}

const PUZZLES = [
  // BEGINNER
  { id: 101, fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", solution: [{ from: sq("h5"), to: sq("f7") }] },
  { id: 102, fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", solution: [{ from: sq("a1"), to: sq("a8") }] },
  { id: 103, fen: "6k1/8/6K1/8/8/8/8/7Q w - - 0 1", solution: [{ from: sq("h1"), to: sq("h7") }] },
  { id: 104, fen: "6k1/R7/8/8/8/8/8/1R4K1 w - - 0 1", solution: [{ from: sq("b1"), to: sq("b8") }] },
  { id: 105, fen: "3k4/3Q4/3K4/8/8/8/8/8 w - - 0 1", solution: [{ from: sq("d7"), to: sq("c7") }] },
  { id: 106, fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", solution: [{ from: sq("f3"), to: sq("e5") }] },
  { id: 107, fen: "rnb1kbnr/pppp1ppp/8/4p3/6q1/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 1", solution: [{ from: sq("f3"), to: sq("g4") }] },
  { id: 108, fen: "k7/2K5/8/8/8/8/6Q1/8 w - - 0 1", solution: [{ from: sq("g2"), to: sq("a2") }] },
  { id: 109, fen: "8/8/8/8/8/6k1/6p1/K7 b - - 0 1", solution: [{ from: sq("g2"), to: sq("g1"), promotion: "Q" }] },
  { id: 110, fen: "2k5/8/2K5/R7/8/8/8/8 w - - 0 1", solution: [{ from: sq("a5"), to: sq("a8") }] },
  { id: 111, fen: "8/P5k1/8/8/8/8/8/6K1 w - - 0 1", solution: [{ from: sq("a7"), to: sq("a8"), promotion: "Q" }] },
  { id: 112, fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", solution: [{ from: sq("f7"), to: sq("f8") }] },
  // INTERMEDIATE
  { id: 201, fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", solution: [{ from: sq("f3"), to: sq("g5") }] },
  { id: 202, fen: "r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P3/2NP4/PPP2PPP/R2QK2R w KQkq - 0 7", solution: [{ from: sq("c4"), to: sq("f7") }] },
  { id: 203, fen: "4k3/8/8/8/8/8/4q3/4R1K1 w - - 0 1", solution: [{ from: sq("e1"), to: sq("e2") }] },
  { id: 205, fen: "r5k1/5ppp/8/8/8/8/5PPP/3RK1R1 w - - 0 1", solution: [{ from: sq("d1"), to: sq("d8") }] },
  { id: 206, fen: "r1bq1rk1/pppp1ppp/2n2n2/2b5/3NP3/2P5/PP3PPP/RNBQKB1R w KQ - 0 7", solution: [{ from: sq("d4"), to: sq("c6") }] },
  { id: 207, fen: "3k4/3r4/8/3R4/8/3K4/8/8 w - - 0 1", solution: [{ from: sq("d5"), to: sq("d7") }] },
  { id: 208, fen: "r1b1kb1r/pppp1ppp/2n2q2/4p3/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 5", solution: [{ from: sq("d4"), to: sq("e5") }] },
  { id: 210, fen: "r3k2r/pp1b1ppp/2p1pn2/q2p2B1/3P4/2NB1N2/PPP2PPP/R2QK2R w KQkq - 0 9", solution: [{ from: sq("g5"), to: sq("f6") }] },
  { id: 211, fen: "4k3/8/8/3q4/4N3/8/8/4K3 w - - 0 1", solution: [{ from: sq("e4"), to: sq("f6") }] },
  { id: 212, fen: "8/3P1k2/3K4/8/8/8/8/8 w - - 0 1", solution: [{ from: sq("d7"), to: sq("d8"), promotion: "Q" }] },
  // ADVANCED
  { id: 303, fen: "4r1k1/pp3ppp/8/3q4/3P4/2PQ4/PP4PP/5RK1 b - - 0 1", solution: [{ from: sq("e8"), to: sq("e1") }] },
  { id: 306, fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 9", solution: [{ from: sq("d4"), to: sq("f5") }] },
  { id: 307, fen: "r4rk1/pp3ppp/2p5/8/2B5/8/PP3PPP/3R2K1 w - - 0 1", solution: [{ from: sq("d1"), to: sq("d8") }] },
  { id: 308, fen: "2r3k1/1p3ppp/p7/3p4/3P4/P4N2/1P3PPP/2R3K1 w - - 0 1", solution: [{ from: sq("c1"), to: sq("c8") }] },
  { id: 309, fen: "3r2k1/pp4pp/2p2p2/4p3/4P3/2P2P2/PP4PP/3R2K1 w - - 0 1", solution: [{ from: sq("d1"), to: sq("d8") }] },
  { id: 310, fen: "r3k2r/pp1n1ppp/2pb1n2/3pp1q1/3PP1b1/2NB1N2/PPP1QPPP/R1B1K2R w KQkq - 0 9", solution: [{ from: sq("f3"), to: sq("e5") }] },
  // EXPERT
  { id: 401, fen: "r4rk1/ppp2ppp/2nq1n2/3pp1B1/1b1PP1b1/2NQ1N2/PPP2PPP/R3R1K1 w - - 0 9", solution: [{ from: sq("g5"), to: sq("f6") }] },
  { id: 402, fen: "3r2k1/pp3ppp/2b5/8/2B5/1P6/P4PPP/3R2K1 b - - 0 1", solution: [{ from: sq("d8"), to: sq("d1") }] },
  { id: 403, fen: "2r3k1/1p3ppp/p7/8/8/1P6/P4PPP/3R2K1 w - - 0 1", solution: [{ from: sq("d1"), to: sq("d8") }] },
  { id: 404, fen: "r2q1rk1/1p1b1ppp/p2bpn2/3p4/3P4/1BNQBN2/PP3PPP/R3R1K1 w - - 0 12", solution: [{ from: sq("e3"), to: sq("g5") }] },
  { id: 405, fen: "1rb2rk1/p4ppp/1pn1p3/3pP3/q2P1B2/2RQ2N1/PP3PPP/4RBK1 w - - 0 1", solution: [{ from: sq("g3"), to: sq("f5") }] },
  { id: 407, fen: "3r1r1k/1p3ppp/p1n1p3/2q5/3P4/1BN1Q3/PP3PPP/R4RK1 w - - 0 1", solution: [{ from: sq("e3"), to: sq("h6") }] },
  { id: 408, fen: "r4rk1/1bqn1ppp/pp2p3/2pp4/3P4/P1N1PN2/BP3PPP/R2Q1RK1 w - - 0 12", solution: [{ from: sq("c3"), to: sq("d5") }] },
  { id: 409, fen: "2rq1rk1/1b2bppp/p2ppn2/1p6/3NP3/1BN1B3/PPP2PPP/R2Q1RK1 w - - 0 11", solution: [{ from: sq("d4"), to: sq("c6") }] },
  { id: 411, fen: "5r1k/6pp/7N/3Q4/8/8/6PP/6K1 w - - 0 1", solution: [{ from: sq("d5"), to: sq("g8") }, { from: sq("f8"), to: sq("g8") }, { from: sq("h6"), to: sq("f7") }] },
  // MASTER
  { id: 501, fen: "r2q1rk1/pp2ppbp/2n3p1/3pNb2/3P4/2N1B3/PP2BPPP/R2Q1RK1 w - - 0 11", solution: [{ from: sq("e5"), to: sq("d7") }] },
  { id: 503, fen: "r1b2rk1/pp3ppp/1qnbpn2/3p4/2PP4/P1N1PN2/1PB2PPP/R1BQ1RK1 w - - 0 10", solution: [{ from: sq("c4"), to: sq("d5") }] },
  { id: 504, fen: "2r1r1k1/1bqn1ppp/p2bp3/1p2N3/3P4/PBN1B3/1PP2PPP/R2QR1K1 w - - 0 14", solution: [{ from: sq("e5"), to: sq("f7") }] },
  { id: 505, fen: "r3r1k1/1ppq1ppp/p2b1n2/3Np1b1/2BPP3/2P2N2/PP3PPP/R1BQR1K1 w - - 0 13", solution: [{ from: sq("d5"), to: sq("f6") }] },
  { id: 506, fen: "2rq1rk1/pp2bppp/2n1p3/3pNb2/3P1B2/2N5/PP2BPPP/R2Q1RK1 w - - 0 12", solution: [{ from: sq("e5"), to: sq("f7") }] },
  { id: 507, fen: "1r2r1k1/p4ppp/bqnbpn2/1pp5/3P1B2/2PBPN2/PP1N1PPP/R2QR1K1 w - - 0 13", solution: [{ from: sq("d2"), to: sq("c4") }] },
  { id: 508, fen: "r4rk1/1pp1qppp/p2b1n2/3pN3/3P2b1/P1N1B3/1PP1BPPP/R2QR1K1 w - - 0 14", solution: [{ from: sq("e5"), to: sq("g4") }] },
  { id: 509, fen: "r2q1rk1/5ppp/p2p1n2/1pb1p1b1/2B1P3/1PN2N2/PBP2PPP/R2Q1RK1 w - - 0 13", solution: [{ from: sq("f3"), to: sq("e5") }] },
  { id: 510, fen: "r1bq1r1k/pp4pp/2nb1p2/3pp3/2PP4/1PN1PN2/PB3PPP/R2QKB1R w KQ - 0 11", solution: [{ from: sq("d4"), to: sq("e5") }] },
  // GRANDMASTER
  { id: 601, fen: "r2q1rk1/1b2bppp/p3pn2/1ppp4/3P1B2/P1N1PN2/1PP1BPPP/R2Q1RK1 w - - 0 11", solution: [{ from: sq("f4"), to: sq("e5") }] },
  { id: 602, fen: "r3r1k1/pp1q1ppp/2nb1n2/3pp1B1/2PP1B2/P1N1PN2/1P3PPP/R2QK2R w KQ - 0 13", solution: [{ from: sq("g5"), to: sq("f6") }] },
  { id: 604, fen: "2r1r1k1/pp2qppp/2np1n2/3bp1B1/2B1P3/2N1QN2/PPP2PPP/R3R1K1 w - - 0 12", solution: [{ from: sq("g5"), to: sq("h6") }] },
  { id: 606, fen: "r1bq1rk1/pp3ppp/2n1p3/3pN1b1/2BP4/2N5/PP3PPP/R1BQK2R w KQ - 0 11", solution: [{ from: sq("e5"), to: sq("d7") }] },
  { id: 608, fen: "r2q1rk1/1pp2ppp/p1nb1n2/4p1B1/1bBPP3/2N2N2/PPP2PPP/R2QK2R w KQ - 0 9", solution: [{ from: sq("d4"), to: sq("d5") }] },
  { id: 609, fen: "r3r1k1/ppqn1ppp/2pbpn2/3p4/2PP4/P1NBPN2/1PQ2PPP/R1B2RK1 w - - 0 12", solution: [{ from: sq("c3"), to: sq("d5") }] },
  { id: 610, fen: "r1b2rk1/pp2qppp/2nppn2/8/2BNP3/2N1B3/PPP2PPP/R2QK2R w KQ - 0 10", solution: [{ from: sq("d4"), to: sq("f5") }] },
];

// ── Stockfish UCI wrapper ─────────────────────────────────────────────────────
function createStockfish() {
  const asmPath = path.join(__dirname, "../node_modules/stockfish/bin/stockfish-18-asm.js");
  const sf = spawn("node", [asmPath], { stdio: ["pipe", "pipe", "ignore"] });
  let buffer = "";
  const listeners = [];

  sf.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      for (const cb of listeners) cb(line.trim());
    }
  });

  const onLine = (cb) => { listeners.push(cb); return () => listeners.splice(listeners.indexOf(cb), 1); };

  const send = (cmd) => sf.stdin.write(cmd + "\n");

  const waitFor = (pred, timeout = 30000) => new Promise((res, rej) => {
    const t = setTimeout(() => { off(); rej(new Error("timeout")); }, timeout);
    const off = onLine((line) => { if (pred(line)) { clearTimeout(t); off(); res(line); } });
  });

  return { send, waitFor, onLine, kill: () => sf.kill() };
}

async function getBestMove(sf, fen, depth = 20) {
  sf.send(`position fen ${fen}`);
  sf.send(`go depth ${depth}`);
  const line = await sf.waitFor((l) => l.startsWith("bestmove "), 60000);
  return line.split(" ")[1];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const sf = createStockfish();

  // Init
  sf.send("uci");
  await sf.waitFor((l) => l === "uciok");
  sf.send("setoption name Hash value 32");
  sf.send("isready");
  await sf.waitFor((l) => l === "readyok");

  console.log(`\n${"ID".padEnd(6)} ${"Expected".padEnd(10)} ${"Stockfish".padEnd(10)} Status`);
  console.log("─".repeat(50));

  const failures = [];

  for (const puzzle of PUZZLES) {
    const expected = moveToUci(puzzle.solution[0]);
    let best;
    try {
      best = await getBestMove(sf, puzzle.fen, 20);
    } catch (e) {
      best = "ERROR";
    }
    const pass = best === expected;
    const status = pass ? "✓ PASS" : "✗ FAIL";
    console.log(`#${String(puzzle.id).padEnd(5)} ${expected.padEnd(10)} ${(best || "?").padEnd(10)} ${status}`);
    if (!pass) failures.push({ id: puzzle.id, fen: puzzle.fen, expected, stockfish: best });
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`${PUZZLES.length - failures.length}/${PUZZLES.length} passed`);
  if (failures.length > 0) {
    console.log("\nFailed puzzles:");
    for (const f of failures) {
      console.log(`  #${f.id}: expected ${f.expected}, Stockfish says ${f.stockfish}`);
      console.log(`    FEN: ${f.fen}`);
    }
  }

  sf.kill();
}

main().catch(console.error);
