/**
 * HTTP client for the Receipt Cycle API Worker. No React or React Native imports, so web, mobile and
 * plain scripts can all use it.
 */
import type { FnRef } from "./registry";

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export type ApiClientOptions = {
  /** Origin of the API Worker, e.g. https://api.receiptcycle.com (no trailing slash needed). */
  baseUrl: string;
  /** Public website origin; used for password-reset links. */
  webAppUrl?: string;
  /** Injected for tests or non-browser runtimes. */
  fetch?: typeof fetch;
};

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Multipart upload (files). Sent as-is; the runtime sets the multipart boundary. */
  form?: FormData;
  /** Explicit token wins over the one stored on the client (call sites still pass `token`). */
  token?: string;
  /** Admin dashboard secret, sent as `x-admin-secret`. */
  adminSecret?: string;
  /** Do not send any Authorization header. */
  anonymous?: boolean;
  /** Return this instead of throwing when the server answers 401. */
  onUnauthorized?: "throw" | "null";
  /** Return `null` instead of throwing on 404. */
  nullOn404?: boolean;
};

/** Better Auth error codes mapped to the wording the apps already show. */
const AUTH_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password.",
  USER_ALREADY_EXISTS: "Email already registered.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Email already registered.",
  PASSWORD_TOO_SHORT: "Password must be at least 6 characters.",
  INVALID_PASSWORD: "Current password is incorrect.",
  INVALID_TOKEN: "This reset link has expired. Request a new password reset.",
  SESSION_EXPIRED: "Session expired. Sign in again.",
};

export class ApiClient {
  readonly baseUrl: string;
  readonly webAppUrl: string;
  private token: string | null = null;
  private listeners = new Set<(token: string | null) => void>();
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.webAppUrl = (opts.webAppUrl ?? "https://receiptcycle.com").replace(/\/+$/, "");
    this.fetchImpl = opts.fetch ?? ((input, init) => fetch(input, init));
  }

  getToken(): string | null {
    return this.token;
  }

  /** Called by the auth context whenever the session changes. */
  setToken(token: string | null): void {
    if (token === this.token) return;
    this.token = token;
    for (const l of this.listeners) l(token);
  }

  onTokenChange(listener: (token: string | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = opts.anonymous ? null : (opts.token?.trim() || this.token);
    if (token) headers.Authorization = `Bearer ${token}`;
    if (opts.adminSecret) headers["x-admin-secret"] = opts.adminSecret;
    if (opts.body !== undefined && !opts.form) headers["Content-Type"] = "application/json";

    let res: Response;
    try {
      res = await this.fetchImpl(url.toString(), {
        method,
        headers,
        body: opts.form ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
      });
    } catch {
      throw new ApiRequestError(0, "Network error. Check your connection and try again.");
    }

    const text = await res.text();
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (res.status === 401 && opts.onUnauthorized === "null") return null as T;
    if (res.status === 404 && opts.nullOn404) return null as T;
    if (!res.ok) {
      const code: string | undefined = json?.code;
      const message =
        (code && AUTH_MESSAGES[code]) || json?.error || json?.message || text.slice(0, 200) || `Request failed (${res.status}).`;
      throw new ApiRequestError(res.status, message, code);
    }
    return json as T;
  }

  /** Download a protected file (a stored receipt) as a Blob so it can be shown with an object URL. */
  async requestBlob(path: string, opts: Pick<RequestOptions, "query" | "token"> = {}): Promise<Blob> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    const token = opts.token?.trim() || this.token;
    let res: Response;
    try {
      res = await this.fetchImpl(url.toString(), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch {
      throw new ApiRequestError(0, "Network error. Check your connection and try again.");
    }
    if (!res.ok) throw new ApiRequestError(res.status, res.status === 404 ? "Receipt not found" : `Request failed (${res.status}).`);
    return res.blob();
  }

  /** Convex-style helpers so non-hook code (backups, contact form) reads the same as before. */
  query<A, R>(ref: FnRef<A, R>, args: A): Promise<R> {
    return ref.run(this, args);
  }
  mutation<A, R>(ref: FnRef<A, R>, args: A): Promise<R> {
    return ref.run(this, args);
  }
  action<A, R>(ref: FnRef<A, R>, args: A): Promise<R> {
    return ref.run(this, args);
  }
}
