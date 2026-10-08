import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { verifyPassword as defaultVerify } from "better-auth/crypto";
import { bearer, emailOTP } from "better-auth/plugins";
import { dash } from "@better-auth/infra";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { authAccount, profile, session, user, verification } from "../db/schema";
import { reconcileEntitlementForUser } from "../lib/entitlements";
import { hashPbkdf2, isPbkdf2, verifyPbkdf2 } from "../lib/passwordHash";
import { escapeHtml, layout, mailEnabled, sendMail } from "../lib/mailer";
import type { Db, Env } from "../types";

const SESSION_SECONDS = 30 * 24 * 60 * 60;
const RESET_SECONDS = 60 * 60;

/** Reset email with the same three ways in as before: web link, app deep link, and the raw token. */
async function sendResetEmail(env: Env, email: string, token: string): Promise<void> {
  const webBase = env.PUBLIC_WEB_APP_URL?.trim().replace(/\/$/, "");
  const webLink = webBase ? `${webBase}/reset-password?token=${encodeURIComponent(token)}` : null;
  const deepLink = `receiptcycle://reset-password?token=${encodeURIComponent(token)}`;
  await sendMail(env, {
    to: email,
    subject: "Reset your Receipt Cycle password",
    html: layout(
      "Reset your password",
      `<p>You asked to reset your Receipt Cycle password.</p>
      ${webLink ? `<p><a href="${escapeHtml(webLink)}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a></p>` : ""}
      <p><a href="${escapeHtml(deepLink)}">Open the mobile app to reset</a> (if installed)</p>
      <p style="font-size:13px;color:#475569">If the links don’t work, paste this token on the reset page:</p>
      <p style="word-break:break-all;font-family:monospace">${escapeHtml(token)}</p>
      <p style="font-size:13px;color:#475569">This link expires in 1 hour. If you did not ask for this, ignore this email — your password is unchanged.</p>`,
    ),
    text: `Reset your Receipt Cycle password: ${webLink ?? deepLink}
Token: ${token}
Expires in 1 hour. If you did not ask for this, ignore this email.`,
  });
}

/** Sign-in code email: short, plain, and says what to do if it was not you. */
async function sendCodeEmail(env: Env, email: string, otp: string): Promise<void> {
  await sendMail(env, {
    to: email,
    subject: `${otp} is your Receipt Cycle sign-in code`,
    html: layout(
      "Your sign-in code",
      `<p>Use this code to sign in to Receipt Cycle:</p>
      <p style="font-family:monospace;font-size:32px;letter-spacing:6px;margin:14px 0"><strong>${escapeHtml(otp)}</strong></p>
      <p style="font-size:13px;color:#475569">It works for 10 minutes. If you did not ask for it, you can ignore this email.</p>`,
    ),
    text: `Your Receipt Cycle sign-in code is ${otp}. It works for 10 minutes. If you did not ask for it, ignore this email.`,
  });
}

/** Sent once, right after an account is created. Never blocks sign-up if email fails. */
async function sendWelcomeEmail(env: Env, email: string, name: string): Promise<void> {
  if (!mailEnabled(env)) return;
  const base = env.PUBLIC_WEB_APP_URL?.trim().replace(/\/$/, "") || "https://receiptcycle.com";
  const hello = name.trim() ? `Welcome, ${escapeHtml(name.trim().split(/\s+/)[0])}!` : "Welcome!";
  try {
    await sendMail(env, {
      to: email,
      subject: "Welcome to Receipt Cycle",
      html: layout(
        hello,
        `<p>Your Receipt Cycle account is ready. Scan receipts, import statements and see where your money goes.</p>
        <p><a href="${escapeHtml(base)}/dashboard" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Open your dashboard</a></p>
        <p style="font-size:13px;color:#475569">Signed up by mistake or need help? Reply to this email.</p>`,
      ),
      text: `Welcome to Receipt Cycle! Your account is ready: ${base}/dashboard`,
    });
  } catch (error) {
    console.error("welcome email failed", error);
  }
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
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: RESET_SECONDS,
      password: {
        hash: (password) => hashPbkdf2(password),
        /**
         * Accounts migrated from Convex still carry bcrypt hashes ("$2a$..."). Accept them once and
         * immediately re-save the password in Better Auth's format (lazy rehash).
         */
        verify: async ({ hash, password }) => {
          if (isPbkdf2(hash)) return verifyPbkdf2(hash, password);
          if (!hash.startsWith("$2")) return defaultVerify({ hash, password });
          if (!(await bcrypt.compare(password, hash))) return false;
          await db
            .update(authAccount)
            .set({ password: await hashPbkdf2(password) })
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
            await sendWelcomeEmail(env, u.email, u.name ?? "");
          },
        },
      },
      session: {
        create: {
          after: async (s) => {
            try {
              await reconcileEntitlementForUser(db, s.userId);
            } catch (error) {
              // Never block sign-in over a stale billing entitlement.
              console.error("billing entitlement reconcile failed", { userId: s.userId, error });
            }
          },
        },
      },
    },
    plugins: [
      bearer(),
      // Optional Better Auth dashboard (users, sessions, audit log). Only on when BETTER_AUTH_API_KEY is set.
      ...(env.BETTER_AUTH_API_KEY?.trim() ? [dash({ apiKey: env.BETTER_AUTH_API_KEY.trim() })] : []),
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
