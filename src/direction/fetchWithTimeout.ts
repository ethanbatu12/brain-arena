/**
 * fetch() has no built-in timeout — a single unresponsive server can hang a
 * request indefinitely. Every network call in this module aborts after a
 * fixed deadline so a slow/dead mirror fails fast instead of stalling the
 * whole game.
 */
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
