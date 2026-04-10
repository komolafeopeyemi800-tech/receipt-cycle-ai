/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHOP_CHECKOUT_MONTHLY_URL?: string;
  readonly VITE_WHOP_CHECKOUT_YEARLY_URL?: string;
  /** Optional: Whop customer hub / manage subscription */
  readonly VITE_WHOP_MANAGE_URL?: string;
  /** Public OAuth client id (app_xxx) for Sign in with Whop — must match Convex WHOP_OAUTH_CLIENT_ID */
  readonly VITE_WHOP_OAUTH_CLIENT_ID?: string;
  /** Optional override for OAuth redirect origin (default: window.location.origin) */
  readonly VITE_WHOP_OAUTH_REDIRECT_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
