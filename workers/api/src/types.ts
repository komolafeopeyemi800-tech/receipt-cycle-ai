import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "./db/schema";

export type Db = DrizzleD1Database<typeof schema>;

/** Worker bindings, vars and secrets. Secrets are set with `wrangler secret put`. */
export type Env = {
  DB: D1Database;
  FILES: R2Bucket;
  /** Cloudflare Email Sending binding (`[[send_email]]` in wrangler.toml). */
  EMAIL?: { send(message: { from: string; to: string; subject: string; html?: string; text?: string }): Promise<unknown> };
  /** From address, e.g. "Receipt Cycle <no-reply@receiptcycle.com>". */
  MAIL_FROM?: string;
  PUBLIC_WEB_APP_URL: string;
  /** Public origin of this API (used for Better Auth links), e.g. https://api.receiptcycle.com */
  BETTER_AUTH_URL?: string;
  /** Signing secret for Better Auth (`wrangler secret put BETTER_AUTH_SECRET`, 32+ random chars). */
  BETTER_AUTH_SECRET?: string;
  /** Key from the Better Auth dashboard (dash.better-auth.com); enables the admin dashboard plugin. */
  BETTER_AUTH_API_KEY?: string;
  /** Extra browser origins allowed to call the auth endpoints, comma separated. */
  TRUSTED_ORIGINS?: string;
  /**
   * "true" turns on email + password sign-in. Off by default: password hashing is deliberately slow and
   * does not fit the Workers free plan's CPU limit. Sign-in then uses Google and emailed one-time codes.
   */
  PASSWORD_AUTH_ENABLED?: string;
  GOOGLE_WEB_CLIENT_ID?: string;
  GOOGLE_IOS_CLIENT_ID?: string;
  GOOGLE_ANDROID_CLIENT_ID?: string;
  /** Comma or newline separated emails treated as lifetime Pro / admin allowlist. */
  LIFETIME_PRO_EMAILS?: string;
  WHOP_WEBHOOK_SECRET?: string;
  WHOP_PRO_PRODUCT_IDS?: string;
  ADMIN_DASHBOARD_SECRET?: string;
  ADMIN_DASHBOARD_ADMIN_EMAILS?: string;
  OPENAI_API_KEY?: string;
  OPENAI_VISION_MODEL?: string;
  OPENAI_VISION_MAX_TOKENS?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_GEMINI_MODEL?: string;
  OPENROUTER_HTTP_REFERER?: string;
  GEMINI_API_KEY?: string;
  LANDING_AI_API_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_SUPPORT_EMAIL?: string;
};

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
  /** Unix ms; used as the trial start when `profile.trialStartedAt` is unset. */
  createdAt: number;
  profile: {
    plan: string | null;
    proSubscriptionActive: boolean;
    trialStartedAt: number | null;
    trialLifetimeAdds: number | null;
    role: string | null;
    status: string | null;
  };
};

export type AppVariables = {
  db: Db;
  user: AuthedUser;
};

export type AppEnv = { Bindings: Env; Variables: AppVariables };
