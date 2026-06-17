import { describe, it } from "vitest";
import { legalMoves, loadFen, makeMove, parseSquare } from "./engine";

function sq(n: string) { return parseSquare(n); }

interface Cand { tag: string; fen: string; line: [string, string][]; }

// Candidate replacement puzzles. line = [from,to] pairs (player, reply, player, …).
const CANDS: Cand[] = [
  { tag: "204 skewer Rh4+", fen: "4k3/7r/8/8/R4K2/8/8/8 b - - 0 1", line: [["h7","h4"]] },
  { tag: "209 royal fork Nc7+", fen: "r3k3/pp6/8/3N4/8/8/8/4K3 w - - 0 1", line: [["d5","c7"]] },
  // hanging queen / rook captures (material)
  { tag: "301 win Q (skewer Re1+)", fen: "4k3/8/8/8/8/8/4q3/R3K3 w - - 0 1", line: [["a1","a2"]] },
  { tag: "302 fork Nf6+ win Q", fen: "4k3/8/8/4q3/5N2/8/8/4K3 w - - 0 1", line: [["f4","g6"]] },
  // mate-in-1 candidates
  { tag: "304 Arabian-ish Rh8#", fen: "6rk/6pp/8/8/8/8/7R/5N1K w - - 0 1", line: [["h2","h7"]] },
  { tag: "305 Q+N mate Qg7#", fen: "5rk1/5ppp/8/8/8/8/5PPP/3Q2KN w - - 0 1", line: [["d1","d8"]] },
  { tag: "406 two-rook mate", fen: "6k1/R7/6K1/8/8/8/8/1R6 w - - 0 1", line: [["b1","b8"]] },
  // mate-in-2 candidates (verify ends in checkmate)
  { tag: "410 m2 Qsac", fen: "5rk1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1", line: [["e1","e8"],["f8","e8"]] },
  { tag: "502 back-rank Re8+", fen: "4r1k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1", line: [["e1","e8"],["g8","h7"]] },
  // clean hanging-piece wins
  { tag: "603 win R Rd8+", fen: "3rk3/8/8/8/8/8/8/3RK3 w - - 0 1", line: [["d1","d8"]] },
  { tag: "605 pin win Q Re-file", fen: "4k3/8/8/4q3/8/8/8/4R1K1 w - - 0 1", line: [["e1","e5"]] },
  { tag: "607 royal fork Nd6+", fen: "r3k3/8/8/8/4N3/8/8/4K3 w - - 0 1", line: [["e4","d6"]] },
];

describe("verify candidates", () => {
  it("reports legality and final status", () => {
    for (const c of CANDS) {
      let state = loadFen(c.fen);
      let ok = true;
      let detail = "";
      for (let i = 0; i < c.line.length; i++) {
        const [from, to] = c.line[i];
        const match = legalMoves(state, sq(from)).find((m) => m.to === sq(to));
        if (!match) { ok = false; detail = `ILLEGAL move ${i} ${from}->${to}`; break; }
        const captured = state.board[sq(to)];
        state = makeMove(state, match);
        detail += ` ${from}${to}${captured ? "x" + captured.type : ""}[${state.status}]`;
      }
      // eslint-disable-next-line no-console
      console.log(`${ok ? "OK  " : "BAD "} ${c.tag} =>${detail}`);
    }
  });
});
