import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { hashPassword as defaultHash, verifyPassword as defaultVerify } from "better-auth/crypto";
import { bearer, emailOTP } from "better-auth/plugins";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { authAccount, profile, session, user, verification } from "../db/schema";
import { reconcileEntitlementForUser } from "../lib/entitlements";
import type { Db, Env } from "../types";

const SESSION_SECONDS = 30 * 24 * 60 * 60;
const RESET_SECONDS = 60 * 60;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Reset email with the same three ways in as before: web link, app deep link, and the raw token. */
async function sendResetEmail(env: Env, email: string, token: string): Promise<void> {
  const key = env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("RESEND_API_KEY is not set; password reset email was not sent.");
    return;
  }
  const webBase = env.PUBLIC_WEB_APP_URL?.trim().replace(/\/$/, "");
  const webLink = webBase ? `${webBase}/reset-password?token=${encodeURIComponent(token)}` : null;
  const deepLink = `receiptcycle://reset-password?token=${encodeURIComponent(token)}`;
  const html = `
      <p>You asked to reset your Receipt Cycle password.</p>
      ${webLink ? `<p><a href="${escapeHtml(webLink)}">Reset password on the web</a></p>` : ""}
      <p><a href="${escapeHtml(deepLink)}">Open the mobile app to reset</a> (if installed)</p>
      <p>If links don’t work, open Reset password in the app or on the web and paste this token:</p>
      <p style="font-family:monospace">${escapeHtml(token)}</p>
      <p>This link expires in 1 hour.</p>
    `;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL?.trim() || "Receipt Cycle <onboarding@resend.dev>",
      to: [email],
      subject: "Reset your Receipt Cycle password",
      html,
    }),
  });
  if (!res.ok) throw new Error(`Could not send reset email: ${(await res.text()) || res.statusText}`);
}

/** Sign-in code email: short, plain, and says what to do if it was not you. */
async function sendCodeEmail(env: Env, email: string, otp: string): Promise<void> {
  const key = env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("RESEND_API_KEY is not set; sign-in code email was not sent.");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL?.trim() || "Receipt Cycle <onboarding@resend.dev>",
      to: [email],
      subject: `${otp} is your Receipt Cycle sign-in code`,
      html: `
        <p>Your Receipt Cycle sign-in code is:</p>
        <p style="font-family:monospace;font-size:28px;letter-spacing:6px;margin:12px 0"><strong>${escapeHtml(otp)}</strong></p>
        <p>It works for 10 minutes. If you did not ask for it, you can ignore this email.</p>`,
      text: `Your Receipt Cycle sign-in code is ${otp}. It works for 10 minutes. If you did not ask for it, ignore this email.`,
    }),
  });
  if (!res.ok) throw new Error(`Could not send sign-in code: ${(await res.text()) || res.statusText}`);
}

/**
 * Better Auth instance. Building it is not free (plugins, validators), and Workers CPU time is
 * limited, so it is built once per isolate and reused while the bindings stay the same.
 */
let cached: { db: D1Database; passwords: boolean; auth: ReturnType<typeof build> } | null = null;

export function getAuth(env: Env, db: Db) {
  const passwords = env.PASSWORD_AUTH_ENABLED === "true";
  if (!cached || cached.db !== env.DB || cached.passwords !== passwords) cached = { db: env.DB, passwords, auth: build(env, db) };
  return cached.auth;
}

function build(env: Env, db: Db) {
  return betterAuth({
    appName: "Receipt Cycle",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: "/api/auth",
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user, session, account: authAccount, verification },
    }),
    trustedOrigins: [
      env.PUBLIC_WEB_APP_URL,
      "receiptcycle://",
      "exp://",
      ...(env.TRUSTED_ORIGINS ?? "").split(/[\s,]+/),
    ].filter(Boolean),
    session: { expiresIn: SESSION_SECONDS, updateAge: 24 * 60 * 60 },
    advanced: { database: { generateId: () => crypto.randomUUID() } },
    emailAndPassword: {
      enabled: env.PASSWORD_AUTH_ENABLED === "true",
      minPasswordLength: 6,
      autoSignIn: true,
      resetPasswordTokenExpiresIn: RESET_SECONDS,
      password: {
        hash: (password) => defaultHash(password),
        /**
         * Accounts migrated from Convex still carry bcrypt hashes ("$2a$..."). Accept them once and
         * immediately re-save the password in Better Auth's format (lazy rehash).
         */
        verify: async ({ hash, password }) => {
          if (!hash.startsWith("$2")) return defaultVerify({ hash, password });
          if (!(await bcrypt.compare(password, hash))) return false;
          await db
            .update(authAccount)
            .set({ password: await defaultHash(password) })
            .where(and(eq(authAccount.providerId, "credential"), eq(authAccount.password, hash)));
          return true;
        },
      },
      sendResetPassword: async ({ user: u, token }) => {
        await sendResetEmail(env, u.email, token);
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (u) => {
            await db.insert(profile).values({ userId: u.id }).onConflictDoNothing();
          },
        },
      },
      session: {
        create: {
          after: async (s) => {
            try {
              await reconcileEntitlementForUser(db, s.userId);
            } catch (error) {
              // Never block sign-in over a stale Whop entitlement.
              console.error("whop entitlement reconcile failed", { userId: s.userId, error });
            }
          },
        },
      },
    },
    plugins: [
      bearer(),
      // Passwordless sign-in: a 6-digit code by email. Codes are stored hashed (cheap), expire in
      // 10 minutes and lock after 5 wrong tries. The first successful code also creates the account.
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        storeOTP: "hashed",
        allowedAttempts: 5,
        sendVerificationOTP: async ({ email, otp }) => {
          await sendCodeEmail(env, email, otp);
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof getAuth>;
