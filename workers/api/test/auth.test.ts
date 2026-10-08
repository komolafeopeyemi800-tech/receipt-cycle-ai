import bcrypt from "bcryptjs";
import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { googleVerifier } from "../src/lib/googleIdToken";
import { api } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const signUp = (email: string, password = "secret123", name = "Ada") =>
  api("POST", "/api/auth/sign-up/email", { body: { email, password, name } });
const signIn = (email: string, password: string) => api("POST", "/api/auth/sign-in/email", { body: { email, password } });

describe("email + password", () => {
  it("signs up, returns a bearer token that works on data routes, and creates a profile", async () => {
    const up = await signUp("ada@example.com");
    expect(up.status).toBe(200);
    expect(up.json.token).toBeTruthy();
    const me = await api("GET", "/api/me", { token: up.json.token });
    expect(me.json).toMatchObject({ email: "ada@example.com", name: "Ada" });
    expect((await api("GET", "/api/transactions", { token: up.json.token })).status).toBe(200);
    const sub = await api("GET", "/api/subscription", { token: up.json.token });
    expect(sub.json).toMatchObject({ phase: "trial", pro: false });

    const inn = await signIn("ada@example.com", "secret123");
    expect(inn.status).toBe(200);
    expect((await signIn("ada@example.com", "wrong-password")).status).toBe(401);
  });

  it("allows a blank name and rejects short passwords and duplicate emails", async () => {
    expect((await signUp("noname@example.com", "secret123", "")).status).toBe(200);
    expect((await signUp("short@example.com", "123")).status).toBeGreaterThanOrEqual(400);
    const dup = await signUp("noname@example.com");
    expect(dup.status).toBeGreaterThanOrEqual(400);
  });

  it("signing out kills the token", async () => {
    const { json } = await signUp("out@example.com");
    expect((await api("POST", "/api/auth/sign-out", { token: json.token, body: {} })).status).toBe(200);
    expect((await api("GET", "/api/me", { token: json.token })).status).toBe(401);
  });

  it("changes the password", async () => {
    const { json } = await signUp("chg@example.com");
    const res = await api("POST", "/api/auth/change-password", {
      token: json.token,
      body: { currentPassword: "secret123", newPassword: "better-pass-1", revokeOtherSessions: false },
    });
    expect(res.status).toBe(200);
    expect((await signIn("chg@example.com", "secret123")).status).toBe(401);
    expect((await signIn("chg@example.com", "better-pass-1")).status).toBe(200);
  });
});

describe("migrated Convex accounts", () => {
  it("accepts the old bcrypt password once and rehashes it", async () => {
    const now = Date.now();
    const hash = bcrypt.hashSync("old-password", 10);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES ('legacy-1', 'Old', 'old@example.com', 0, ?, ?)").bind(now, now),
      env.DB.prepare("INSERT INTO profile (user_id, pro_subscription_active) VALUES ('legacy-1', 1)"),
      env.DB.prepare("INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES ('acc-1', 'legacy-1', 'legacy-1', 'credential', ?, ?, ?)").bind(hash, now, now),
    ]);
    expect((await signIn("old@example.com", "nope")).status).toBe(401);
    const first = await signIn("old@example.com", "old-password");
    expect(first.status).toBe(200);
    expect(first.json.user.id).toBe("legacy-1");

    const row = await env.DB.prepare("SELECT password FROM account WHERE id = 'acc-1'").first<{ password: string }>();
    expect(row!.password.startsWith("$2")).toBe(false);
    expect((await signIn("old@example.com", "old-password")).status).toBe(200);
    expect((await signIn("old@example.com", "nope")).status).toBe(401);
    expect((await api("GET", "/api/subscription", { token: first.json.token })).json.pro).toBe(true);
  });
});

describe("password reset", () => {
  it("emails a token that resets the password", async () => {
    await signUp("reset@example.com");
    let html = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        html = JSON.parse(String(init.body)).html;
        return new Response("{}", { status: 200 });
      }),
    );
    const req = await api("POST", "/api/auth/request-password-reset", {
      body: { email: "reset@example.com", redirectTo: "http://localhost/reset-password" },
    });
    expect(req.status).toBe(200);
    const token = /font-family:monospace">([^<]+)</.exec(html)?.[1];
    expect(token).toBeTruthy();
    expect(html).toContain("receiptcycle://reset-password?token=");

    const done = await api("POST", "/api/auth/reset-password", { body: { token, newPassword: "fresh-pass-9" } });
    expect(done.status).toBe(200);
    expect((await signIn("reset@example.com", "fresh-pass-9")).status).toBe(200);
    const reuse = await api("POST", "/api/auth/reset-password", { body: { token, newPassword: "again-pass-9" } });
    expect(reuse.status).toBeGreaterThanOrEqual(400);
  });

  it("does not reveal whether an email exists", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await api("POST", "/api/auth/request-password-reset", {
      body: { email: "ghost@example.com", redirectTo: "http://localhost/x" },
    });
    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("Google sign-in", () => {
  const claims = { sub: "g-123", email: "Gina@Example.com", email_verified: true, name: "Gina" };

  it("creates an account, then signs the same person back in", async () => {
    vi.spyOn(googleVerifier, "verify").mockResolvedValue(claims);
    const first = await api("POST", "/api/social/google", { body: { idToken: "tok" } });
    expect(first.json).toMatchObject({ isNewRegistration: true, user: { email: "gina@example.com", name: "Gina" } });
    expect((await api("GET", "/api/me", { token: first.json.token })).json.email).toBe("gina@example.com");
    const second = await api("POST", "/api/social/google", { body: { idToken: "tok" } });
    expect(second.json).toMatchObject({ isNewRegistration: false, user: { id: first.json.user.id } });
  });

  it("refuses to take over an email/password account", async () => {
    await signUp("gina@example.com");
    vi.spyOn(googleVerifier, "verify").mockResolvedValue(claims);
    const res = await api("POST", "/api/social/google", { body: { idToken: "tok" } });
    expect(res.status).toBe(409);
    expect(res.json.error).toMatch(/already registered with a password/);
  });

  it("accepts web, iOS and Android client ids as the token audience", async () => {
    const verify = vi.spyOn(googleVerifier, "verify").mockResolvedValue(claims);
    await api("POST", "/api/social/google", { body: { idToken: "tok" } });
    expect(verify).toHaveBeenCalledWith("tok", ["web-client.apps.googleusercontent.com", "android-client.apps.googleusercontent.com"]);
  });

  it("offers no sign-in provider besides Google", async () => {
    expect((await api("POST", "/api/social/whop", { body: { code: "c", redirectUri: "x", codeVerifier: "v" } })).status).toBe(404);
  });

  it("rejects a bad token and an unverified email", async () => {
    vi.spyOn(googleVerifier, "verify").mockRejectedValueOnce(new Error("bad"));
    expect((await api("POST", "/api/social/google", { body: { idToken: "tok" } })).status).toBe(401);
    vi.spyOn(googleVerifier, "verify").mockResolvedValueOnce({ ...claims, email_verified: false });
    expect((await api("POST", "/api/social/google", { body: { idToken: "tok" } })).status).toBe(400);
  });
});

describe("account data", () => {
  it("resets data and deletes the account with everything it owns", async () => {
    const { json } = await signUp("gone@example.com");
    const token = json.token as string;
    await api("POST", "/api/accounts/ensure-seed", { token, body: { workspace: "personal" } });
    await api("POST", "/api/transactions", {
      token,
      body: { workspace: "personal", amount: 5, type: "expense", category: "Other", date: "2026-10-01" },
    });
    const ws = await api("POST", "/api/workspaces", { token, body: { name: "Team" } });
    await api("POST", "/api/accounts", { token, body: { workspace: ws.json.slug, name: "Till" } });

    expect((await api("POST", "/api/me/reset-data", { token })).status).toBe(200);
    expect((await api("GET", "/api/transactions", { token })).json).toEqual([]);
    expect((await api("GET", "/api/accounts?workspace=personal", { token })).json).toHaveLength(3);

    expect((await api("DELETE", "/api/me", { token })).status).toBe(200);
    expect((await api("GET", "/api/me", { token })).status).toBe(401);
    for (const t of ["user", "profile", "session", "account", "accounts", "workspaces", "workspace_members"]) {
      const n = await env.DB.prepare(`SELECT count(*) AS n FROM ${t}`).first<{ n: number }>();
      expect(n!.n, t).toBe(0);
    }
  });
});
