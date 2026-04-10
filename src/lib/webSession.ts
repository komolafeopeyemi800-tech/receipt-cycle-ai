/** Same key as `apps/mobile/src/lib/sessionStorage.ts` — one session for web + Expo web. */
export const WEB_SESSION_TOKEN_KEY = "receiptcycle_session_token";
export const WEB_SESSION_USER_KEY = "receiptcycle_session_user";
export const WEB_LAST_EMAIL_KEY = "receiptcycle_last_signin_email";

type SessionUser = { id: string; email: string; name: string | null };

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
  } catch {
    /* ignore */
  }
}

export function clearWebSessionToken(): void {
  try {
    localStorage.removeItem(WEB_SESSION_TOKEN_KEY);
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
    };
  } catch {
    return null;
  }
}

export function setWebSessionUser(user: SessionUser): void {
  try {
    localStorage.setItem(WEB_SESSION_USER_KEY, JSON.stringify(user));
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
