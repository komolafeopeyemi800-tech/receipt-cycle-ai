/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional — opens in new tab for Free tier; if unset, Free still goes to dashboard. */
  readonly VITE_WHOP_CHECKOUT_FREE_URL?: string;
  readonly VITE_WHOP_CHECKOUT_MONTHLY_URL?: string;
  readonly VITE_WHOP_CHECKOUT_YEARLY_URL?: string;
  /** Optional success return URL for Whop checkout (defaults to /dashboard on current origin). */
  readonly VITE_WHOP_CHECKOUT_SUCCESS_URL?: string;
  /** Optional: Whop customer hub / manage subscription */
  readonly VITE_WHOP_MANAGE_URL?: string;
  /** Origin of the API Worker, e.g. https://api.receiptcycle.com (dev falls back to http://localhost:8787). */
  readonly VITE_API_URL?: string;
  /** Google OAuth *web* client id for the Sign in with Google button. */
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
