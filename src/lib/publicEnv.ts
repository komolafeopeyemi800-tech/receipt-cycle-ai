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

/**
 * Firebase *web* app settings for browser notifications. These are public by design (they ship in every Firebase website).
 * Fill them in from Firebase console > Project settings > Your apps > Web app, or set the VITE_FIREBASE_* variables.
 */
const fb = (key: string, fallback = "") => ((import.meta.env as Record<string, string | undefined>)[key] ?? "").trim() || fallback;
export const FIREBASE_WEB_CONFIG = {
  apiKey: fb("VITE_FIREBASE_API_KEY", "AIzaSyDSBrkGfcJ3rHukgNyJ9OjgXELrEX5sSnI"),
  authDomain: fb("VITE_FIREBASE_AUTH_DOMAIN", "receiptcycleapp.firebaseapp.com"),
  projectId: fb("VITE_FIREBASE_PROJECT_ID", "receiptcycleapp"),
  storageBucket: fb("VITE_FIREBASE_STORAGE_BUCKET", "receiptcycleapp.firebasestorage.app"),
  messagingSenderId: fb("VITE_FIREBASE_MESSAGING_SENDER_ID", "1045047345639"),
  appId: fb("VITE_FIREBASE_APP_ID", "1:1045047345639:web:69f137c4ee62b500a43d42"),
};
/** Firebase console > Project settings > Cloud Messaging > Web Push certificates > Key pair (public key). */
export const FIREBASE_VAPID_KEY = fb("VITE_FIREBASE_VAPID_KEY", "BLvyaATesqfZqSXR5KWQIIQkXyXYVJuZOh_hA_9I_zur22foiO8nR4UwoeP4wt2DPQzgELDNHq8tcQGFdRzFvk8");
export const webPushConfigured = () => Boolean(FIREBASE_WEB_CONFIG.apiKey && FIREBASE_WEB_CONFIG.projectId && FIREBASE_WEB_CONFIG.appId && FIREBASE_VAPID_KEY);
