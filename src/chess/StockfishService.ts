/**
 * Singleton wrapper around the Stockfish Web Worker.
 * Communicates via UCI protocol. Only one search runs at a time.
 */

const INIT_TIMEOUT_MS = 15_000;

interface PendingSearch {
  resolve: (move: string) => void;
  reject: (err: Error) => void;
}

class StockfishService {
  private worker: Worker | null = null;
  private ready = false;
  private initFailed = false;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  private rejectReady!: (err: Error) => void;
  private pending: PendingSearch | null = null;

  constructor() {
    this.readyPromise = new Promise((res, rej) => {
      this.resolveReady = res;
      this.rejectReady = rej;
    });
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker("/stockfish-worker.js");

      const timeout = setTimeout(() => {
        if (!this.ready) {
          this.initFailed = true;
          this.rejectReady(new Error("Stockfish worker timed out during init"));
          this.worker?.terminate();
          this.worker = null;
        }
      }, INIT_TIMEOUT_MS);

      this.worker.onmessage = (e: MessageEvent<string>) => {
        const line: string = typeof e.data === "string" ? e.data : String(e.data);
        this.handleLine(line, timeout);
      };

      this.worker.onerror = (e) => {
        clearTimeout(timeout);
        this.initFailed = true;
        this.rejectReady(new Error(`Stockfish worker error: ${e.message}`));
      };

      this.send("uci");
    } catch (err) {
      this.initFailed = true;
      this.rejectReady(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private handleLine(line: string, initTimeout?: ReturnType<typeof setTimeout>) {
    if (line === "uciok") {
      this.send("setoption name Hash value 16");
      this.send("isready");
    } else if (line === "readyok") {
      if (initTimeout !== undefined) clearTimeout(initTimeout);
      this.ready = true;
      this.resolveReady();
    } else if (line.startsWith("bestmove ")) {
      const parts = line.split(" ");
      const move = parts[1];
      const p = this.pending;
      this.pending = null;
      if (p) {
        if (move && move !== "(none)") {
          p.resolve(move);
        } else {
          p.reject(new Error("Stockfish: no valid move"));
        }
      }
    }
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  isAvailable(): boolean {
    return this.ready && !this.initFailed && this.worker !== null;
  }

  /**
   * Ask Stockfish for the best move at the given FEN and search depth.
   * Returns the move in UCI notation (e.g. "e2e4", "e7e8q").
   */
  async getBestMove(fen: string, depth: number): Promise<string> {
    if (this.initFailed) throw new Error("Stockfish unavailable");
    await this.readyPromise;

    // Cancel any in-flight search
    if (this.pending) {
      this.send("stop");
      this.pending.reject(new Error("Stockfish search cancelled"));
      this.pending = null;
    }

    return new Promise<string>((resolve, reject) => {
      this.pending = { resolve, reject };
      this.send("position fen " + fen);
      this.send("go depth " + depth);
    });
  }

  stop() {
    if (this.pending) {
      this.send("stop");
      this.pending.reject(new Error("Stockfish search stopped"));
      this.pending = null;
    }
  }

  destroy() {
    this.stop();
    this.send("quit");
    this.worker?.terminate();
    this.worker = null;
  }
}

let _instance: StockfishService | null = null;

export function getStockfish(): StockfishService {
  if (!_instance) {
    _instance = new StockfishService();
  }
  return _instance;
}
