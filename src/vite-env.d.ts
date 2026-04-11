/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHOP_CHECKOUT_MONTHLY_URL?: string;
  readonly VITE_WHOP_CHECKOUT_YEARLY_URL?: string;
  /** Optional: Whop customer hub / manage subscription */
  readonly VITE_WHOP_MANAGE_URL?: string;
  /** Public OAuth client id (app_xxx) for Sign in with Whop — must match Convex WHOP_OAUTH_CLIENT_ID / WHOP_CLIENT_ID */
  readonly VITE_WHOP_OAUTH_CLIENT_ID?: string;
  /** Alias for VITE_WHOP_OAUTH_CLIENT_ID */
  readonly VITE_WHOP_CLIENT_ID?: string;
  /** Full OAuth redirect URL — must match Whop dashboard exactly (e.g. https://receiptcycle.com/api/auth/callback/whop). */
  readonly VITE_WHOP_OAUTH_REDIRECT_URI?: string;
  /** Same as VITE_WHOP_OAUTH_REDIRECT_URI if you prefer this name (e.g. https://receiptcycle.com/api/auth/callback). */
  readonly VITE_WHOP_REDIRECT_URI?: string;
  /** When VITE_WHOP_OAUTH_REDIRECT_URI is unset and `window` is missing (SSR): origin + `/oauth/whop`. Prefer leaving unset in the browser so the tab origin is used (avoids www vs apex PKCE issues). */
  readonly VITE_WHOP_OAUTH_REDIRECT_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
