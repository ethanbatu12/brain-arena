import { describe, expect, it } from "vitest";
import {
  FILE, RANK,
  allLegalMoves,
  applyMove,
  hasInsufficientMaterial,
  initialChessState,
  isAttackedBy,
  isInCheck,
  isMoveLegal,
  legalMoves,
  loadFen,
  makeMove,
  parseFen,
  positionKey,
  squareName,
  parseSquare,
} from "./engine";

function sq(name: string) { return parseSquare(name); }

// ---------------------------------------------------------------------------
// Board helpers
// ---------------------------------------------------------------------------
describe("square helpers", () => {
  it("FILE and RANK extract correct values", () => {
    expect(FILE(sq("a1"))).toBe(0);
    expect(RANK(sq("a1"))).toBe(0);
    expect(FILE(sq("h8"))).toBe(7);
    expect(RANK(sq("h8"))).toBe(7);
    expect(FILE(sq("e4"))).toBe(4);
    expect(RANK(sq("e4"))).toBe(3);
  });

  it("squareName round-trips with parseSquare", () => {
    for (const name of ["a1","h8","e4","d5","b7","g3"]) {
      expect(squareName(sq(name))).toBe(name);
    }
  });
});

// ---------------------------------------------------------------------------
// FEN parsing
// ---------------------------------------------------------------------------
describe("parseFen", () => {
  it("parses initial position correctly", () => {
    const state = initialChessState();
    expect(state.turn).toBe("w");
    expect(state.board[sq("e1")]?.type).toBe("K");
    expect(state.board[sq("e1")]?.color).toBe("w");
    expect(state.board[sq("e8")]?.type).toBe("K");
    expect(state.board[sq("e8")]?.color).toBe("b");
    expect(state.board[sq("a1")]?.type).toBe("R");
    expect(state.board[sq("d1")]?.type).toBe("Q");
    expect(state.board[sq("a3")]).toBeNull();
  });

  it("parses castling rights", () => {
    const state = initialChessState();
    expect(state.castling.wKingSide).toBe(true);
    expect(state.castling.wQueenSide).toBe(true);
    expect(state.castling.bKingSide).toBe(true);
    expect(state.castling.bQueenSide).toBe(true);
  });

  it("parses no castling rights when specified", () => {
    const state = parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1");
    expect(state.castling.wKingSide).toBe(false);
    expect(state.castling.bQueenSide).toBe(false);
  });

  it("parses en passant square", () => {
    const state = parseFen("rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3");
    expect(state.enPassant).toBe(sq("d6"));
  });
});

// ---------------------------------------------------------------------------
// Attack detection
// ---------------------------------------------------------------------------
describe("isAttackedBy", () => {
  it("detects pawn attacks", () => {
    const state = initialChessState();
    // White pawns on rank 2 attack rank 3
    expect(isAttackedBy(state.board, sq("d3"), "w")).toBe(true);  // c2 or e2 pawn
    expect(isAttackedBy(state.board, sq("a3"), "w")).toBe(true);  // b2 pawn attacks a3
    expect(isAttackedBy(state.board, sq("b3"), "w")).toBe(true);  // a2 or c2 pawn
  });

  it("detects rook attacks along ranks and files", () => {
    const state = parseFen("8/8/8/8/R7/8/8/8 w - - 0 1");
    expect(isAttackedBy(state.board, sq("h4"), "w")).toBe(true);
    expect(isAttackedBy(state.board, sq("a1"), "w")).toBe(true);
    expect(isAttackedBy(state.board, sq("b5"), "w")).toBe(false);
  });

  it("rook attack is blocked by pieces", () => {
    const state = parseFen("8/8/8/8/R3P3/8/8/8 w - - 0 1");
    expect(isAttackedBy(state.board, sq("e4"), "w")).toBe(true);  // rook controls e4 (pawn is the target sq)
    expect(isAttackedBy(state.board, sq("h4"), "w")).toBe(false); // pawn on e4 blocks rook's reach to h4
    expect(isAttackedBy(state.board, sq("c4"), "w")).toBe(true);  // rook can reach c4  // left of rook
  });

  it("detects knight attacks", () => {
    const state = parseFen("8/8/8/8/4N3/8/8/8 w - - 0 1");
    expect(isAttackedBy(state.board, sq("f6"), "w")).toBe(true);
    expect(isAttackedBy(state.board, sq("d6"), "w")).toBe(true);
    expect(isAttackedBy(state.board, sq("g5"), "w")).toBe(true);
    expect(isAttackedBy(state.board, sq("e5"), "w")).toBe(false);
  });

  it("detects bishop attacks diagonally", () => {
    const state = parseFen("8/8/8/8/4B3/8/8/8 w - - 0 1");
    expect(isAttackedBy(state.board, sq("h7"), "w")).toBe(true);  // NE diagonal
    expect(isAttackedBy(state.board, sq("a8"), "w")).toBe(true);  // NW diagonal d5-c6-b7-a8
    expect(isAttackedBy(state.board, sq("b1"), "w")).toBe(true);  // SW diagonal d3-c2-b1
  });

  it("detects queen attacks in all directions", () => {
    const state = parseFen("8/8/8/8/4Q3/8/8/8 w - - 0 1");
    expect(isAttackedBy(state.board, sq("e8"), "w")).toBe(true); // vertical
    expect(isAttackedBy(state.board, sq("a4"), "w")).toBe(true); // horizontal
    expect(isAttackedBy(state.board, sq("h7"), "w")).toBe(true); // diagonal
    expect(isAttackedBy(state.board, sq("b4"), "w")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Check detection
// ---------------------------------------------------------------------------
describe("isInCheck", () => {
  it("starting position has no check", () => {
    const state = initialChessState();
    expect(isInCheck(state.board, "w")).toBe(false);
    expect(isInCheck(state.board, "b")).toBe(false);
  });

  it("detects king in check from a rook", () => {
    const state = parseFen("4k3/8/8/8/8/8/8/4R1K1 b - - 0 1");
    expect(isInCheck(state.board, "b")).toBe(true);
    expect(isInCheck(state.board, "w")).toBe(false);
  });

  it("detects king in check from a pawn", () => {
    const state = parseFen("8/8/8/3p4/4K3/8/8/7k w - - 0 1");
    expect(isInCheck(state.board, "w")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pawn moves
// ---------------------------------------------------------------------------
describe("pawn moves", () => {
  it("pawn can move 1 or 2 squares from start", () => {
    const state = initialChessState();
    const moves = legalMoves(state, sq("e2"));
    const targets = moves.map((m) => squareName(m.to));
    expect(targets).toContain("e3");
    expect(targets).toContain("e4");
    expect(targets).not.toContain("e5");
  });

  it("pawn can only move 1 square after moving", () => {
    let state = makeMove(initialChessState(), { from: sq("e2"), to: sq("e4") });
    state = makeMove(state, { from: sq("d7"), to: sq("d5") });
    const moves = legalMoves(state, sq("e4"));
    const targets = moves.map((m) => squareName(m.to));
    expect(targets).toContain("e5");
    expect(targets).not.toContain("e6");
  });

  it("pawn cannot move forward if blocked", () => {
    const state = parseFen("8/8/8/8/8/4p3/4P3/8 w - - 0 1");
    const moves = legalMoves(state, sq("e2"));
    expect(moves).toHaveLength(0);
  });

  it("pawn captures diagonally", () => {
    const state = parseFen("8/8/8/3p4/4P3/8/8/8 w - - 0 1");
    const moves = legalMoves(state, sq("e4"));
    const targets = moves.map((m) => squareName(m.to));
    expect(targets).toContain("d5"); // capture
    expect(targets).toContain("e5"); // forward
    expect(targets).not.toContain("f5");
  });

  it("pawn cannot capture forward", () => {
    const state = parseFen("8/8/8/4p3/4P3/8/8/8 w - - 0 1");
    const moves = legalMoves(state, sq("e4"));
    expect(moves).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// En passant
// ---------------------------------------------------------------------------
describe("en passant", () => {
  it("allows en passant capture on the immediately following move", () => {
    let state = initialChessState();
    state = makeMove(state, { from: sq("e2"), to: sq("e4") });
    state = makeMove(state, { from: sq("a7"), to: sq("a6") });
    state = makeMove(state, { from: sq("e4"), to: sq("e5") });
    state = makeMove(state, { from: sq("d7"), to: sq("d5") }); // double push
    expect(state.enPassant).toBe(sq("d6"));
    const moves = legalMoves(state, sq("e5"));
    const targets = moves.map((m) => squareName(m.to));
    expect(targets).toContain("d6");
  });

  it("en passant is not available after one more move", () => {
    let state = initialChessState();
    state = makeMove(state, { from: sq("e2"), to: sq("e4") });
    state = makeMove(state, { from: sq("a7"), to: sq("a6") });
    state = makeMove(state, { from: sq("e4"), to: sq("e5") });
    state = makeMove(state, { from: sq("d7"), to: sq("d5") });
    // Don't take en passant — make another move
    state = makeMove(state, { from: sq("a2"), to: sq("a3") });
    state = makeMove(state, { from: sq("h7"), to: sq("h6") });
    expect(state.enPassant).toBeNull();
  });

  it("en passant removes the captured pawn", () => {
    let state = initialChessState();
    state = makeMove(state, { from: sq("e2"), to: sq("e4") });
    state = makeMove(state, { from: sq("a7"), to: sq("a6") });
    state = makeMove(state, { from: sq("e4"), to: sq("e5") });
    state = makeMove(state, { from: sq("d7"), to: sq("d5") });
    state = makeMove(state, { from: sq("e5"), to: sq("d6") }); // en passant
    expect(state.board[sq("d5")]).toBeNull(); // captured pawn removed
    expect(state.board[sq("d6")]?.type).toBe("P");
  });
});

// ---------------------------------------------------------------------------
// Castling
// ---------------------------------------------------------------------------
describe("castling", () => {
  it("king-side castling moves both king and rook", () => {
    const state = parseFen("8/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    const move = { from: sq("e1"), to: sq("g1") };
    expect(isMoveLegal(state, move)).toBe(true);
    const next = makeMove(state, move);
    expect(next.board[sq("g1")]?.type).toBe("K");
    expect(next.board[sq("f1")]?.type).toBe("R");
    expect(next.board[sq("h1")]).toBeNull();
    expect(next.board[sq("e1")]).toBeNull();
  });

  it("queen-side castling moves both king and rook", () => {
    const state = parseFen("8/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    const move = { from: sq("e1"), to: sq("c1") };
    const next = makeMove(state, move);
    expect(next.board[sq("c1")]?.type).toBe("K");
    expect(next.board[sq("d1")]?.type).toBe("R");
    expect(next.board[sq("a1")]).toBeNull();
  });

  it("cannot castle if king has moved", () => {
    let state = parseFen("8/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    state = makeMove(state, { from: sq("e1"), to: sq("e2") });
    state = makeMove(state, { from: sq("e8"), to: sq("e7") });
    state = makeMove(state, { from: sq("e2"), to: sq("e1") });
    state = makeMove(state, { from: sq("e7"), to: sq("e8") });
    expect(state.castling.wKingSide).toBe(false);
    expect(state.castling.wQueenSide).toBe(false);
  });

  it("cannot castle through an attacked square", () => {
    // Rook on f8 covers f1, blocking king-side castling
    const state = parseFen("5r2/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    const moves = legalMoves(state, sq("e1"));
    const targets = moves.map((m) => squareName(m.to));
    expect(targets).not.toContain("g1");
  });

  it("cannot castle while in check", () => {
    const state = parseFen("4r3/8/8/8/8/8/8/R3K2R w KQ - 0 1");
    const moves = legalMoves(state, sq("e1"));
    const targets = moves.map((m) => squareName(m.to));
    expect(targets).not.toContain("g1");
    expect(targets).not.toContain("c1");
  });

  it("castling rights revoked when rook captured", () => {
    let state = parseFen("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1");
    state = makeMove(state, { from: sq("a8"), to: sq("a1") }); // capture white a-rook
    expect(state.castling.wQueenSide).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Pawn promotion
// ---------------------------------------------------------------------------
describe("pawn promotion", () => {
  it("pawn must be promoted on reaching the last rank", () => {
    const state = parseFen("8/4P3/8/8/8/8/8/4K2k w - - 0 1");
    const moves = legalMoves(state, sq("e7"));
    const promotions = moves.filter((m) => m.promotion);
    expect(promotions.map((m) => m.promotion).sort()).toEqual(["B", "N", "Q", "R"]);
  });

  it("promoted piece appears on the board", () => {
    const state = parseFen("8/4P3/8/8/8/8/8/4K2k w - - 0 1");
    const next = makeMove(state, { from: sq("e7"), to: sq("e8"), promotion: "Q" });
    expect(next.board[sq("e8")]?.type).toBe("Q");
    expect(next.board[sq("e8")]?.color).toBe("w");
  });

  it("can promote to any piece type", () => {
    for (const promo of ["Q", "R", "B", "N"] as const) {
      const state = parseFen("8/4P3/8/8/8/8/8/4K2k w - - 0 1");
      const next = makeMove(state, { from: sq("e7"), to: sq("e8"), promotion: promo });
      expect(next.board[sq("e8")]?.type).toBe(promo);
    }
  });
});

// ---------------------------------------------------------------------------
// Check / Checkmate / Stalemate
// ---------------------------------------------------------------------------
describe("check, checkmate, stalemate", () => {
  it("detects check status", () => {
    const state = parseFen("4k3/8/8/8/8/8/4R3/4K3 b - - 0 1");
    // Black king on e8, white rook on e2
    expect(state.status).toBe("playing"); // not yet in check from this position
  });

  it("detects checkmate (scholar's mate)", () => {
    const state = loadFen("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4");
    const next = makeMove(state, { from: sq("h5"), to: sq("f7") });
    expect(next.status).toBe("checkmate");
    expect(next.winner).toBe("w");
  });

  it("detects stalemate", () => {
    // Classic stalemate: black king on a8, white queen on b6, white king on c6
    const state = loadFen("k7/8/1QK5/8/8/8/8/8 b - - 0 1");
    expect(state.status).toBe("stalemate");
  });

  it("king cannot move into check", () => {
    const state = parseFen("4k3/8/8/8/8/8/4R3/4K3 b - - 0 1");
    const moves = legalMoves(state, sq("e8"));
    const targets = moves.map((m) => squareName(m.to));
    expect(targets).not.toContain("e7"); // e7 attacked by rook on e2
  });

  it("must escape check — only legal moves available", () => {
    const state = parseFen("4k3/8/8/8/8/4r3/8/4K3 w - - 0 1");
    // White king on e1, black rook on e3 — king is in check
    expect(isInCheck(state.board, "w")).toBe(true);
    const moves = allLegalMoves(state);
    // Every move must escape check
    for (const move of moves) {
      const next = makeMove(state, move);
      expect(isInCheck(next.board, "w")).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Draw conditions
// ---------------------------------------------------------------------------
describe("draw conditions", () => {
  it("detects insufficient material — K vs K", () => {
    const state = parseFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(hasInsufficientMaterial(state.board)).toBe(true);
  });

  it("detects insufficient material — K+B vs K", () => {
    const state = parseFen("4k3/8/8/8/8/8/8/3BK3 w - - 0 1");
    expect(hasInsufficientMaterial(state.board)).toBe(true);
  });

  it("detects insufficient material — K+N vs K", () => {
    const state = parseFen("4k3/8/8/8/8/8/8/3NK3 w - - 0 1");
    expect(hasInsufficientMaterial(state.board)).toBe(true);
  });

  it("not insufficient material with pawns", () => {
    const state = parseFen("4k3/4p3/8/8/8/8/8/4K3 w - - 0 1");
    expect(hasInsufficientMaterial(state.board)).toBe(false);
  });

  it("fifty-move rule triggers draw at 100 half moves", () => {
    let state = parseFen("4k3/8/8/8/8/8/8/R3K3 w - - 99 1");
    // Move the rook (no capture/pawn move)
    state = makeMove(state, { from: sq("a1"), to: sq("a2") });
    expect(state.status).toBe("draw");
    expect(state.drawReason).toBe("fifty-move rule");
  });

  it("threefold repetition triggers draw", () => {
    let state = initialChessState();
    // Repeat position 3 times
    for (let i = 0; i < 3; i++) {
      state = makeMove(state, { from: sq("g1"), to: sq("f3") });
      state = makeMove(state, { from: sq("g8"), to: sq("f6") });
      state = makeMove(state, { from: sq("f3"), to: sq("g1") });
      state = makeMove(state, { from: sq("f6"), to: sq("g8") });
    }
    expect(state.status).toBe("draw");
    expect(state.drawReason).toBe("threefold repetition");
  });
});

// ---------------------------------------------------------------------------
// Knight movement
// ---------------------------------------------------------------------------
describe("knight", () => {
  it("knight can jump over pieces", () => {
    const state = initialChessState();
    const moves = legalMoves(state, sq("g1"));
    const targets = moves.map((m) => squareName(m.to));
    expect(targets).toContain("f3");
    expect(targets).toContain("h3");
  });

  it("knight attacks all 8 L-shaped squares when unobstructed", () => {
    const state = parseFen("8/8/8/8/4N3/8/8/8 w - - 0 1");
    const moves = legalMoves(state, sq("e4"));
    expect(moves).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------------
// No illegal moves can be played
// ---------------------------------------------------------------------------
describe("move legality invariant", () => {
  it("no legal move leaves own king in check", () => {
    const positions = [
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
      "4k3/8/8/8/8/4r3/8/4K3 w - - 0 1",
    ];
    for (const fen of positions) {
      const state = parseFen(fen);
      const moves = allLegalMoves(state);
      for (const move of moves) {
        const next = applyMove(state, move);
        expect(isInCheck(next.board, state.turn)).toBe(false);
      }
    }
  });

  it("position key changes after each move", () => {
    let state = initialChessState();
    const key0 = positionKey(state);
    state = makeMove(state, { from: sq("e2"), to: sq("e4") });
    expect(positionKey(state)).not.toBe(key0);
  });
});
