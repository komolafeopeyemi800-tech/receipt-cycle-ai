/**
 * Public settings of the website. Both values are public (they ship inside the website code anyway), so
 * they have built-in defaults: a build made anywhere, including Cloudflare's own build from GitHub,
 * works without extra settings. Set VITE_API_URL / VITE_GOOGLE_WEB_CLIENT_ID to override them.
 */
export const PRODUCTION_API_URL = "https://api.receiptcycle.com";

/** Google OAuth *web* client id for "Continue with Google" (origins are allow-listed in Google Cloud). */
export const GOOGLE_WEB_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined)?.trim() ||
  "257702962892-m2m0terd11tbn8049umc5bltp5sjqqr1.apps.googleusercontent.com";

/** `npm run dev` talks to a local API (`wrangler dev`); every other build talks to the live one. */
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  (import.meta.env.DEV ? "http://localhost:8787" : PRODUCTION_API_URL);
