"use node";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function makeToken() {
  return randomBytes(32).toString("hex");
}

type AuthResult = {
  token: string;
  user: { id: string; email: string; name: string | null };
  /** True when this session started a brand-new account (email sign-up or first-time OAuth user). */
  isNewRegistration?: boolean;
};

export const signUp = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AuthResult> => {
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Enter a valid email.");
    if (args.password.length < 6) throw new Error("Password must be at least 6 characters.");

    const existing = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (existing) throw new Error("Email already registered.");

    const passwordHash = await bcrypt.hash(args.password, 10);
    const userId: Id<"users"> = await ctx.runMutation(internal.auth.insertUser, {
      email,
      passwordHash,
      name: args.name?.trim() || undefined,
    });

    const token = makeToken();
    const expiresAt = Date.now() + SESSION_MS;
    await ctx.runMutation(internal.auth.insertSession, { userId, token, expiresAt });

    return {
      token,
      user: { id: userId as string, email, name: args.name?.trim() ?? null },
      isNewRegistration: true,
    };
  },
});

export const signIn = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<AuthResult> => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (!user) throw new Error("Invalid email or password.");
    const ok = await bcrypt.compare(args.password, user.passwordHash);
    if (!ok) throw new Error("Invalid email or password.");

    const token = makeToken();
    const expiresAt = Date.now() + SESSION_MS;
    await ctx.runMutation(internal.auth.insertSession, {
      userId: user._id,
      token,
      expiresAt,
    });

    return {
      token,
      user: { id: user._id as string, email: user.email, name: user.name ?? null },
      isNewRegistration: false,
    };
  },
});

export const changePassword = action({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: true }> => {
    if (args.newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
    const row = await ctx.runQuery(internal.auth.getUserForPasswordChange, { token: args.token });
    if (!row) throw new Error("Session expired. Sign in again.");
    const ok = await bcrypt.compare(args.currentPassword, row.passwordHash);
    if (!ok) throw new Error("Current password is incorrect.");
    const passwordHash = await bcrypt.hash(args.newPassword, 10);
    await ctx.runMutation(internal.auth.patchUserPassword, { userId: row.userId, passwordHash });
    return { ok: true };
  },
});

const RESET_MS = 60 * 60 * 1000;

function googleAudiences(): string[] {
  const ios = process.env.GOOGLE_IOS_CLIENT_ID?.trim();
  const android = process.env.GOOGLE_ANDROID_CLIENT_ID?.trim();
  return [ios, android].filter((x): x is string => Boolean(x));
}

export const signInWithGoogle = action({
  args: { idToken: v.string() },
  handler: async (ctx, args): Promise<AuthResult> => {
    const audiences = googleAudiences();
    if (audiences.length === 0) {
      throw new Error("Google sign-in is not configured on the server (missing GOOGLE_IOS_CLIENT_ID / GOOGLE_ANDROID_CLIENT_ID).");
    }
    const client = new OAuth2Client();
    let payload: TokenPayload | undefined;
    try {
      const ticket = await client.verifyIdToken({
        idToken: args.idToken,
        audience: audiences,
      });
      payload = ticket.getPayload();
    } catch {
      throw new Error("Google sign-in failed. Please try again.");
    }
    if (!payload?.sub) throw new Error("Google sign-in failed: missing account id.");
    if (!payload.email) throw new Error("Google did not share an email with this app.");
    if (payload.email_verified === false) {
      throw new Error("Verify your Google email address, then try again.");
    }
    const email = String(payload.email).trim().toLowerCase();
    const googleSub = payload.sub;
    const name = payload.name ? String(payload.name).trim() : undefined;

    const bySub = await ctx.runQuery(internal.auth.getUserByGoogleSub, { googleSub });
    if (bySub) {
      const token = makeToken();
      const expiresAt = Date.now() + SESSION_MS;
      await ctx.runMutation(internal.auth.insertSession, {
        userId: bySub._id,
        token,
        expiresAt,
      });
      return {
        token,
        user: { id: bySub._id as string, email: bySub.email, name: bySub.name ?? null },
        isNewRegistration: false,
      };
    }

    const byEmail = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (byEmail) {
      if (!byEmail.googleSub) {
        throw new Error(
          "This email is already registered with a password. Sign in with email and password, or use a different Google account.",
        );
      }
      if (byEmail.googleSub !== googleSub) {
        throw new Error("Google sign-in could not be completed for this account. Try a different sign-in method.");
      }
      const token = makeToken();
      const expiresAt = Date.now() + SESSION_MS;
      await ctx.runMutation(internal.auth.insertSession, {
        userId: byEmail._id,
        token,
        expiresAt,
      });
      return {
        token,
        user: { id: byEmail._id as string, email: byEmail.email, name: byEmail.name ?? null },
        isNewRegistration: false,
      };
    }

    const placeholderHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
    const userId: Id<"users"> = await ctx.runMutation(internal.auth.insertUser, {
      email,
      passwordHash: placeholderHash,
      name,
      googleSub,
    });

    const token = makeToken();
    const expiresAt = Date.now() + SESSION_MS;
    await ctx.runMutation(internal.auth.insertSession, { userId, token, expiresAt });

    return {
      token,
      user: { id: userId as string, email, name: name ?? null },
      isNewRegistration: true,
    };
  },
});

type WhopUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
};

function whopOAuthClientId(): string {
  return (
    process.env.WHOP_OAUTH_CLIENT_ID?.trim() ||
    process.env.WHOP_CLIENT_ID?.trim() ||
    ""
  );
}

function whopOAuthClientSecret(): string | undefined {
  return (
    process.env.WHOP_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.WHOP_CLIENT_SECRET?.trim() ||
    undefined
  );
}

/**
 * When set (Convex env), `redirect_uri` from the browser must match one entry (comma- or newline‑separated).
 * Use the same value(s) you register in Whop and expose as `VITE_WHOP_REDIRECT_URI` / `VITE_WHOP_OAUTH_REDIRECT_URI` on the web.
 */
function assertAllowedWhopRedirectUri(redirectUri: string): void {
  const raw =
    process.env.WHOP_REDIRECT_URIS?.trim() ||
    process.env.WHOP_REDIRECT_URI?.trim() ||
    "";
  if (!raw) return;
  const allowed = raw
    .split(/[\n,]+/)
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const normalized = redirectUri.trim().replace(/\/$/, "");
  if (!allowed.some((a) => normalized === a.replace(/\/$/, ""))) {
    throw new Error("Whop redirect URI is not allowed for this deployment.");
  }
}

export const signInWithWhop = action({
  args: {
    code: v.string(),
    redirectUri: v.string(),
    codeVerifier: v.string(),
  },
  handler: async (ctx, args): Promise<AuthResult> => {
    const clientId = whopOAuthClientId();
    if (!clientId) {
      throw new Error(
        "Whop sign-in is not configured (set WHOP_OAUTH_CLIENT_ID or WHOP_CLIENT_ID in Convex env).",
      );
    }

    assertAllowedWhopRedirectUri(args.redirectUri);

    const clientSecret = whopOAuthClientSecret();
    const tokenBody: Record<string, string> = {
      grant_type: "authorization_code",
      code: args.code.trim(),
      redirect_uri: args.redirectUri.trim(),
      client_id: clientId,
      code_verifier: args.codeVerifier.trim(),
    };
    if (clientSecret) tokenBody.client_secret = clientSecret;

    const tokenRes = await fetch("https://api.whop.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenBody),
    });

    if (!tokenRes.ok) {
      const err = (await tokenRes.json().catch(() => ({}))) as { error_description?: string };
      throw new Error(err.error_description ?? `Whop token exchange failed (${tokenRes.status}).`);
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokens.access_token?.trim();
    if (!accessToken) throw new Error("Whop did not return an access token.");

    const uiRes = await fetch("https://api.whop.com/oauth/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!uiRes.ok) {
      throw new Error(`Whop userinfo failed (${uiRes.status}).`);
    }
    const info = (await uiRes.json()) as WhopUserInfo;
    const whopSub = info.sub?.trim();
    if (!whopSub) throw new Error("Whop did not return a user id.");

    const rawEmail = info.email?.trim();
    if (!rawEmail) throw new Error("Whop did not share an email. Grant email scope and try again.");
    if (info.email_verified === false) {
      throw new Error("Verify your Whop email, then try again.");
    }
    const email = rawEmail.toLowerCase();
    const name = info.name?.trim() || info.preferred_username?.trim() || undefined;

    const bySub = await ctx.runQuery(internal.auth.getUserByWhopSub, { whopSub });
    if (bySub) {
      const token = makeToken();
      const expiresAt = Date.now() + SESSION_MS;
      await ctx.runMutation(internal.auth.insertSession, {
        userId: bySub._id,
        token,
        expiresAt,
      });
      return {
        token,
        user: { id: bySub._id as string, email: bySub.email, name: bySub.name ?? null },
        isNewRegistration: false,
      };
    }

    const byEmail = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (byEmail) {
      if (byEmail.whopSub && byEmail.whopSub !== whopSub) {
        throw new Error("Whop sign-in could not be completed for this account.");
      }
      if (byEmail.googleSub && !byEmail.whopSub) {
        throw new Error("This email is linked to Google. Use Google sign-in or a different Whop account.");
      }
      if (!byEmail.googleSub && !byEmail.whopSub) {
        throw new Error(
          "This email already has a password account. Sign in with email and password, or use a different Whop account.",
        );
      }
      if (byEmail.whopSub === whopSub) {
        const token = makeToken();
        const expiresAt = Date.now() + SESSION_MS;
        await ctx.runMutation(internal.auth.insertSession, {
          userId: byEmail._id,
          token,
          expiresAt,
        });
        return {
          token,
          user: { id: byEmail._id as string, email: byEmail.email, name: byEmail.name ?? null },
          isNewRegistration: false,
        };
      }
    }

    const placeholderHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
    const userId: Id<"users"> = await ctx.runMutation(internal.auth.insertUser, {
      email,
      passwordHash: placeholderHash,
      name,
      whopSub,
    });

    const token = makeToken();
    const expiresAt = Date.now() + SESSION_MS;
    await ctx.runMutation(internal.auth.insertSession, { userId, token, expiresAt });

    return {
      token,
      user: { id: userId as string, email, name: name ?? null },
      isNewRegistration: true,
    };
  },
});

export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: true; emailSent: boolean; devToken?: string }> => {
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("Enter a valid email address.");

    const user = await ctx.runQuery(internal.auth.getUserByEmail, { email });
    if (!user) {
      return { ok: true, emailSent: false };
    }

    await ctx.runMutation(internal.auth.deletePasswordResetsForUser, { userId: user._id });
    const rawToken = randomBytes(24).toString("hex");
    const expiresAt = Date.now() + RESET_MS;
    await ctx.runMutation(internal.auth.insertPasswordReset, {
      userId: user._id,
      token: rawToken,
      expiresAt,
    });

    const resendKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM_EMAIL?.trim() || "Receipt Cycle <onboarding@resend.dev>";
    if (!resendKey) {
      return { ok: true, emailSent: false, devToken: rawToken };
    }

    const deepLink = `receiptcycle://reset-password?token=${encodeURIComponent(rawToken)}`;
    const webBase = process.env.PUBLIC_WEB_APP_URL?.trim().replace(/\/$/, "");
    const webLink = webBase
      ? `${webBase}/reset-password?token=${encodeURIComponent(rawToken)}`
      : null;
    const body = `
      <p>You asked to reset your Receipt Cycle password.</p>
      ${webLink ? `<p><a href="${webLink}">Reset password on the web</a></p>` : ""}
      <p><a href="${deepLink}">Open the mobile app to reset</a> (if installed)</p>
      <p>If links don’t work, open Reset password in the app or on the web and paste this token:</p>
      <p style="font-family:monospace">${rawToken}</p>
      <p>This link expires in 1 hour.</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Reset your Receipt Cycle password",
        html: body,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Could not send reset email: ${t || res.statusText}`);
    }

    return { ok: true, emailSent: true };
  },
});

export const resetPasswordWithToken = action({
  args: { token: v.string(), newPassword: v.string() },
  handler: async (ctx, args): Promise<{ ok: true }> => {
    const t = args.token.trim();
    if (t.length < 16) throw new Error("Invalid or expired reset link. Request a new one.");
    if (args.newPassword.length < 6) throw new Error("Password must be at least 6 characters.");

    const row = await ctx.runQuery(internal.auth.getPasswordReset, { token: t });
    if (!row || row.expiresAt < Date.now()) {
      throw new Error("This reset link has expired. Request a new password reset.");
    }

    const passwordHash = await bcrypt.hash(args.newPassword, 10);
    await ctx.runMutation(internal.auth.patchUserPassword, { userId: row.userId, passwordHash });
    await ctx.runMutation(internal.auth.deletePasswordReset, { id: row._id });
    await ctx.runMutation(internal.auth.deletePasswordResetsForUser, { userId: row.userId });

    return { ok: true };
  },
});
