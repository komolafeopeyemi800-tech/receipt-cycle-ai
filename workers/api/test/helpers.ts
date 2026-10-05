import { env } from "cloudflare:test";
import app from "../src/index";

let counter = 0;

/** Insert a user, a profile and a live session; returns the bearer token. */
export async function makeUser(opts: { email?: string; pro?: boolean; createdAt?: number; trialAdds?: number } = {}) {
  counter += 1;
  const id = `user-${counter}`;
  const email = opts.email ?? `u${counter}@example.com`;
  const now = Date.now();
  const createdAt = opts.createdAt ?? now;
  const token = `token-${id}`;
  await env.DB.batch([
    env.DB.prepare("INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, '', ?, 0, ?, ?)").bind(
      id,
      email,
      createdAt,
      createdAt,
    ),
    env.DB.prepare("INSERT INTO profile (user_id, pro_subscription_active, trial_lifetime_adds) VALUES (?, ?, ?)").bind(
      id,
      opts.pro ? 1 : 0,
      opts.trialAdds ?? null,
    ),
    env.DB.prepare("INSERT INTO session (id, user_id, token, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").bind(
      `s-${id}`,
      id,
      token,
      now + 86_400_000,
      now,
      now,
    ),
  ]);
  return { id, email, token };
}

export async function api(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const res = await app.request(
    path,
    { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) },
    env,
  );
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}
