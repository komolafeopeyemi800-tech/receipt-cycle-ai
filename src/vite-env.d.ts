/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional — opens in new tab for Free tier; if unset, Free still goes to dashboard. */
  /** Origin of the API Worker, e.g. https://api.receiptcycle.com (dev falls back to http://localhost:8787). */
  readonly VITE_API_URL?: string;
  /** Google OAuth *web* client id for the Sign in with Google button. */
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
