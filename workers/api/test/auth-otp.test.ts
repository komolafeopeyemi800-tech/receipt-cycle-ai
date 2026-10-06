import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { api } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

/** Capture the email the Worker sends through Resend and hand back the 6-digit code from it. */
function captureEmails() {
  const sent: { to: string; subject: string; html: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const b = JSON.parse(String(init.body));
      sent.push({ to: b.to[0], subject: b.subject, html: b.html });
      return new Response("{}", { status: 200 });
    }),
  );
  const lastCode = () => /letter-spacing:6px[^>]*><strong>(\d{6})</.exec([...sent].reverse().find((m) => /sign-in code/.test(m.subject))!.html)![1]!;
  return { sent, lastCode };
}

const sendCode = (email: string, headers: Record<string, string> = {}) =>
  api("POST", "/api/auth/email-otp/send-verification-otp", { body: { email, type: "sign-in" }, headers });
const signInWithCode = (email: string, otp: string, headers: Record<string, string> = {}) =>
  api("POST", "/api/auth/sign-in/email-otp", { body: { email, otp }, headers });

describe("emailed sign-in codes", () => {
  it("emails a code, signs in with it and creates the account", async () => {
    const mail = captureEmails();
    expect((await sendCode("New@Example.com")).status).toBe(200);
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0]).toMatchObject({ to: "new@example.com" });
    expect(mail.sent[0]!.subject).toMatch(/^\d{6} is your Receipt Cycle sign-in code$/);

    const res = await signInWithCode("new@example.com", mail.lastCode());
    expect(res.status).toBe(200);
    expect(res.json.token).toBeTruthy();
    expect((await api("GET", "/api/me", { token: res.json.token })).json).toMatchObject({ email: "new@example.com" });
    expect((await api("GET", "/api/subscription", { token: res.json.token })).json).toMatchObject({ phase: "trial" });
  });

  it("signs an existing account back in, and a code works only once", async () => {
    const mail = captureEmails();
    await sendCode("again@example.com");
    const first = await signInWithCode("again@example.com", mail.lastCode());
    const used = mail.lastCode();
    expect((await signInWithCode("again@example.com", used)).status).toBeGreaterThanOrEqual(400);

    await sendCode("again@example.com");
    const second = await signInWithCode("again@example.com", mail.lastCode());
    expect(second.json.user.id).toBe(first.json.user.id);
  });

  it("rejects a wrong code and locks the code after too many tries", async () => {
    const mail = captureEmails();
    await sendCode("lock@example.com");
    const real = mail.lastCode();
    const wrong = real === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) expect((await signInWithCode("lock@example.com", wrong)).status).toBeGreaterThanOrEqual(400);
    // Even the right code no longer works: the code was burned by the failed attempts.
    expect((await signInWithCode("lock@example.com", real)).status).toBeGreaterThanOrEqual(400);
  });

  it("only issues sign-in codes", async () => {
    const mail = captureEmails();
    const res = await api("POST", "/api/auth/email-otp/send-verification-otp", { body: { email: "x@example.com", type: "forget-password" } });
    expect(res.status).toBe(400);
    expect(mail.sent).toHaveLength(0);
  });

  it("limits how many codes one email can request per hour", async () => {
    const mail = captureEmails();
    for (let i = 0; i < 5; i++) expect((await sendCode("spam@example.com")).status).toBe(200);
    const blocked = await sendCode("spam@example.com");
    expect(blocked.status).toBe(429);
    expect(blocked.json.error).toMatch(/Too many codes/);
    expect(mail.sent).toHaveLength(5);
    // Another address is unaffected.
    expect((await sendCode("other@example.com")).status).toBe(200);
  });

  it("limits requests from one network", async () => {
    captureEmails();
    const ip = { "cf-connecting-ip": "203.0.113.9" };
    for (let i = 0; i < 20; i++) expect((await sendCode(`u${i}@example.com`, ip)).status).toBe(200);
    expect((await sendCode("u99@example.com", ip)).status).toBe(429);
  });
});

describe("password sign-in switch", () => {
  const off = { ...env, PASSWORD_AUTH_ENABLED: "false" };
  const call = async (path: string, body: unknown, e: typeof env) => {
    const res = await app.request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, e);
    return { status: res.status, json: (await res.json()) as any };
  };

  it("blocks every password endpoint with a clear message when off", async () => {
    for (const path of ["sign-up/email", "sign-in/email", "request-password-reset", "reset-password", "change-password"]) {
      const r = await call(`/api/auth/${path}`, { email: "a@b.com", password: "secret123", name: "A" }, off);
      expect(r.status, path).toBe(403);
      expect(r.json.error).toMatch(/Password sign-in is turned off/);
    }
  });

  it("still lets Google and emailed codes work when passwords are off", async () => {
    const mail = captureEmails();
    const send = await call("/api/auth/email-otp/send-verification-otp", { email: "free@example.com", type: "sign-in" }, off);
    expect(send.status).toBe(200);
    const code = /letter-spacing:6px[^>]*><strong>(\d{6})</.exec(mail.sent[0]!.html)![1]!;
    expect((await call("/api/auth/sign-in/email-otp", { email: "free@example.com", otp: code }, off)).status).toBe(200);
  });

  it("tells the apps which sign-in options to show", async () => {
    const on = await app.request("/api/config", {}, env);
    const onBody = (await on.json()) as any;
    expect(onBody.passwordAuthEnabled).toBe(true);
    expect(onBody.emailCodesEnabled).toBe(true);
    const noMail = await app.request("/api/config", {}, { ...env, RESEND_API_KEY: "" });
    expect(((await noMail.json()) as any).emailCodesEnabled).toBe(false);
    const disabled = await app.request("/api/config", {}, off);
    expect(((await disabled.json()) as any).passwordAuthEnabled).toBe(false);
  });
});
