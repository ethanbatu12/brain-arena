// Vercel serverless function: proxies Overpass QL queries server-to-server.
// This exists purely to dodge browser CORS — Overpass's free public mirrors
// don't reliably send CORS headers for direct client-side requests, but a
// server calling another server has no CORS restriction at all. Still free,
// still no API key, just routed through our own domain first.
//
// Vercel's free Hobby plan hard-caps function execution at 10 seconds, and
// the public Overpass mirrors occasionally take close to that long under
// load. Racing all mirrors in parallel (instead of trying them one at a
// time) means one slow mirror can't eat the whole budget before the others
// get a chance.

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const TIMEOUT_MS = 9_000;

async function fetchOne(url, query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const query = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? "");
  if (!query) {
    res.status(400).json({ error: "Missing Overpass query body" });
    return;
  }

  try {
    const data = await Promise.any(MIRRORS.map((url) => fetchOne(url, query)));
    res.status(200).json(data);
  } catch (err) {
    const detail = err && err.errors ? err.errors.map((e) => String(e)).join("; ") : String(err);
    res.status(502).json({ error: "All Overpass mirrors failed", detail });
  }
}
