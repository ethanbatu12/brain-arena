/**
 * Test candidate replacement positions with Stockfish at depth 15.
 * Run with: node scripts/test-candidates.mjs
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CANDIDATES = [
  // ── BEGINNER replacements ────────────────────────────────────────────
  // C01: KQK - Qa7#
  { id:"C01", fen:"k7/2K5/8/8/8/8/8/Q7 w - - 0 1", want:"a1a7" },
  // C02: back-rank queen mate
  { id:"C02", fen:"6k1/5ppp/8/8/8/8/8/5QK1 w - - 0 1", want:"f1f8" },
  // C03: fix #112 (Qg7#)
  { id:"C03", fen:"7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", want:"f7g7" },
  // C04: two-rook back rank
  { id:"C04", fen:"k7/8/KR6/8/8/8/8/8 w - - 0 1", want:"b6b8" },
  // C05: rook + knight blocks back rank mate
  { id:"C05", fen:"5k2/4nppp/8/8/8/8/8/3R2K1 w - - 0 1", want:"d1d8" },
  // C06: free queen - pawn takes queen off guard
  { id:"C06", fen:"rnb1kbnr/ppppqppp/8/4p3/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 2 3", want:"d3e4" },
  // C07: KRK ladder mate
  { id:"C07", fen:"8/8/8/8/8/k7/8/KR6 b - - 0 1", want:"a3a2" },
  // C08: promotion mate
  { id:"C08", fen:"8/8/8/8/8/7k/7p/7K b - - 0 1", want:"h2h1q" },

  // ── INTERMEDIATE replacements ────────────────────────────────────────
  // C10: knight royal fork (king + rook)
  { id:"C10", fen:"r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1", want:"d5c7" },
  // C11: bishop skewer (king behind queen)
  { id:"C11", fen:"4k3/8/8/8/1b6/8/8/4KR2 b - - 0 1", want:"b4e1" },
  // C12: rook pin - rook pins piece to king
  { id:"C12", fen:"4k3/4r3/4q3/8/8/4R3/8/4K3 w - - 0 1", want:"e3e6" },
  // C13: queen fork - attacks rook and knight
  { id:"C13", fen:"r2k4/8/8/8/8/8/8/3QK3 w - - 0 1", want:"d1a4" },
  // C14: pawn fork wins two pieces
  { id:"C14", fen:"r1b1k3/ppp2ppp/2n5/3pp3/8/3P4/PPP2PPP/R1B1K3 w - - 0 1", want:"d3e4" },
  // C15: discovered check wins queen
  { id:"C15", fen:"r2qk2r/ppp2ppp/8/8/4N3/8/PPP2PPP/R1BQK2R w KQkq - 0 1", want:"e4f6" },

  // ── ADVANCED replacements ────────────────────────────────────────────
  // C20: back rank - rook invasion wins material
  { id:"C20", fen:"5rk1/pp3ppp/8/2q5/8/2Q5/PP3PPP/5RK1 b - - 0 1", want:"f8f1" },
  // C21: queen sac into mate
  { id:"C21", fen:"r4rk1/ppp1nppp/8/3Q4/8/8/PPP2PPP/5RK1 w - - 0 1", want:"d5h5" },
  // C22: double rook invasion
  { id:"C22", fen:"r4rk1/pp3ppp/8/8/8/8/PP3PPP/3R1RK1 w - - 0 1", want:"d1d8" },
  // C23: endgame pawn push wins
  { id:"C23", fen:"8/1p6/8/pP6/k7/8/8/1K6 b - - 0 1", want:"a5a4" },

  // ── EXPERT replacements ────────────────────────────────────────────
  // C30: clearance sacrifice
  { id:"C30", fen:"3r2k1/pp3ppp/2p5/8/8/2P5/PP3PPP/3R2K1 w - - 0 1", want:"d1d8" },
  // C31: queen deflection
  { id:"C31", fen:"r5k1/pp3ppp/8/8/8/8/PP3PPP/3R2K1 w - - 0 1", want:"d1d8" },
  // C32: smothered mate setup
  { id:"C32", fen:"5r1k/6pp/7N/3Q4/8/8/6PP/6K1 w - - 0 1", want:"d5g8" },

  // ── MASTER replacements ────────────────────────────────────────────
  // C40: back-rank weakness exploit
  { id:"C40", fen:"2r1r1k1/5ppp/p7/1p6/3P4/1B6/PP3PPP/3R1RK1 w - - 0 1", want:"d1d8" },
  // C41: knight fork winning queen
  { id:"C41", fen:"r2qkb1r/ppp2ppp/8/3Np3/8/8/PPP2PPP/R2QKB1R w KQkq - 0 1", want:"d5f6" },

  // ── GRANDMASTER replacements ────────────────────────────────────────
  // C50: deep combination
  { id:"C50", fen:"r1bq1rk1/pp3ppp/2n5/3Np3/8/2N5/PPP2PPP/R1BQK2R w KQ - 0 1", want:"d5f6" },
];

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
  return { send, waitFor, kill: () => sf.kill() };
}

async function main() {
  const sf = createStockfish();
  sf.send("uci");
  await sf.waitFor((l) => l === "uciok");
  sf.send("setoption name Hash value 32");
  sf.send("isready");
  await sf.waitFor((l) => l === "readyok");

  console.log(`\n${"ID".padEnd(5)} ${"Want".padEnd(8)} ${"Got".padEnd(10)} Status`);
  console.log("─".repeat(45));

  const results = [];
  for (const c of CANDIDATES) {
    sf.send(`position fen ${c.fen}`);
    sf.send("go depth 15");
    let best = "ERROR";
    try {
      const line = await sf.waitFor((l) => l.startsWith("bestmove "), 20000);
      best = line.split(" ")[1];
    } catch { best = "TIMEOUT"; }
    const pass = best === c.want;
    console.log(`${c.id.padEnd(5)} ${c.want.padEnd(8)} ${best.padEnd(10)} ${pass ? "✓" : "✗"} ${pass ? "" : `← SF wants ${best}`}`);
    results.push({ ...c, got: best, pass });
  }

  console.log(`\n${"─".repeat(45)}`);
  const passed = results.filter(r => r.pass);
  const failed = results.filter(r => !r.pass);
  console.log(`Passed: ${passed.length}/${results.length}`);
  if (failed.length) {
    console.log("\nFailed (use SF's move as solution instead):");
    for (const f of failed) {
      if (f.got !== "TIMEOUT" && f.got !== "ERROR" && f.got !== "(none)") {
        console.log(`  ${f.id}: FEN="${f.fen}" → use ${f.got}`);
      } else {
        console.log(`  ${f.id}: FEN="${f.fen}" → ${f.got} (discard this position)`);
      }
    }
  }
  sf.kill();
}

main().catch(console.error);
