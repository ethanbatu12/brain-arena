/**
 * Google Maps Platform key — restricted (in the Google Cloud console) to
 * this site's domain and to exactly the 4 APIs this module uses: Maps
 * JavaScript API, Places API, Geocoding API, Directions API.
 *
 * Read from an environment variable rather than hardcoded: unlike a
 * publishable anon key meant to live in source, this key shouldn't be
 * permanently baked into git history — set VITE_GOOGLE_MAPS_API_KEY in
 * Vercel's project settings (and a local .env.local for dev).
 */
export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";

export function isGoogleMapsConfigured(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY);
}
