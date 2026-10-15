/** Same key as `apps/mobile/src/lib/sessionStorage.ts` — one session for web + Expo web. */
export const WEB_SESSION_TOKEN_KEY = "receiptcycle_session_token";
export const WEB_SESSION_USER_KEY = "receiptcycle_session_user";
export const WEB_LAST_EMAIL_KEY = "receiptcycle_last_signin_email";
/** When this browser last had a confirmed sign-in (ms since epoch). Used to remember sign-in for 30 days. */
export const WEB_SESSION_AT_KEY = "receiptcycle_session_at";
export const REMEMBER_SIGN_IN_MS = 30 * 24 * 60 * 60 * 1000;

type SessionUser = { id: string; email: string; name: string | null; image?: string | null };

export function getWebSessionToken(): string | null {
  try {
    return localStorage.getItem(WEB_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setWebSessionToken(token: string): void {
  try {
    localStorage.setItem(WEB_SESSION_TOKEN_KEY, token);
    localStorage.setItem(WEB_SESSION_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function clearWebSessionToken(): void {
  try {
    localStorage.removeItem(WEB_SESSION_TOKEN_KEY);
    localStorage.removeItem(WEB_SESSION_AT_KEY);
  } catch {
    /* ignore */
  }
}

export function getWebSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(WEB_SESSION_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
    return {
      id: parsed.id,
      email: parsed.email,
      name: typeof parsed.name === "string" || parsed.name === null ? parsed.name : null,
      image: typeof parsed.image === "string" ? parsed.image : null,
    };
  } catch {
    return null;
  }
}

export function setWebSessionUser(user: SessionUser): void {
  try {
    localStorage.setItem(WEB_SESSION_USER_KEY, JSON.stringify(user));
    // The server just confirmed this session (or the user just signed in): the 30 days start again.
    if (localStorage.getItem(WEB_SESSION_TOKEN_KEY)) localStorage.setItem(WEB_SESSION_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function clearWebSessionUser(): void {
  try {
    localStorage.removeItem(WEB_SESSION_USER_KEY);
  } catch {
    /* ignore */
  }
}

export function getWebLastEmail(): string {
  try {
    return localStorage.getItem(WEB_LAST_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setWebLastEmail(email: string): void {
  try {
    const v = email.trim().toLowerCase();
    if (v) localStorage.setItem(WEB_LAST_EMAIL_KEY, v);
    else localStorage.removeItem(WEB_LAST_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * True when this browser holds a session that was confirmed within the last 30 days.
 * Works without any provider, so marketing pages and the sign-in/sign-up pages can use it.
 * Sessions saved before the timestamp existed are accepted and stamped now.
 */
export function hasRememberedSession(): boolean {
  try {
    if (!localStorage.getItem(WEB_SESSION_TOKEN_KEY)) return false;
    const raw = localStorage.getItem(WEB_SESSION_AT_KEY);
    const at = raw ? Number(raw) : NaN;
    if (!Number.isFinite(at)) {
      localStorage.setItem(WEB_SESSION_AT_KEY, String(Date.now()));
      return true;
    }
    return Date.now() - at < REMEMBER_SIGN_IN_MS;
  } catch {
    return false;
  }
}
