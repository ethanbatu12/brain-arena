// Vercel serverless function: proxies Overpass QL queries server-to-server.
// This exists purely to dodge browser CORS — Overpass's free public mirrors
// don't reliably send CORS headers for direct client-side requests, but a
// server calling another server has no CORS restriction at all. Still free,
// still no API key, just routed through our own domain first.

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const TIMEOUT_MS = 8_000;

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
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

  let lastError = "unknown error";
  for (const url of MIRRORS) {
    try {
      const upstream = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
      });
      if (!upstream.ok) {
        lastError = `${url} responded ${upstream.status}`;
        continue;
      }
      const data = await upstream.json();
      res.status(200).json(data);
      return;
    } catch (err) {
      lastError = `${url}: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  res.status(502).json({ error: "All Overpass mirrors failed", detail: lastError });
}
