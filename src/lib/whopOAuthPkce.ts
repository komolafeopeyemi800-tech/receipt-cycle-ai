/** PKCE helpers for Whop OAuth (web). See https://docs.whop.com/developer/guides/oauth */

const STORAGE_KEY = "receiptcycle_whop_pkce";

function base64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(len: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(len)));
}

async function sha256base64url(str: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return base64url(new Uint8Array(hash));
}

export function getWhopWebRedirectUri(): string {
  const full =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHOP_OAUTH_REDIRECT_URI?.trim()) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHOP_REDIRECT_URI?.trim()) ||
    "";
  if (full) return full.replace(/\/$/, "");

  const origin =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHOP_OAUTH_REDIRECT_ORIGIN?.trim()) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin.replace(/\/$/, "")}/oauth/whop`;
}

export function getWhopPublicClientId(): string {
  const id =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHOP_OAUTH_CLIENT_ID?.trim()) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHOP_CLIENT_ID?.trim()) ||
    "";
  return id;
}

export async function startWhopOAuthWeb(): Promise<void> {
  const clientId = getWhopPublicClientId();
  if (!clientId) {
    throw new Error("Whop sign-in is not configured (VITE_WHOP_OAUTH_CLIENT_ID).");
  }
  const redirectUri = getWhopWebRedirectUri();
  const pkce = {
    codeVerifier: randomString(32),
    state: randomString(16),
    nonce: randomString(16),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pkce));
  const codeChallenge = await sha256base64url(pkce.codeVerifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state: pkce.state,
    nonce: pkce.nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  window.location.href = `https://api.whop.com/oauth/authorize?${params.toString()}`;
}

export function consumeWhopPkceState(expectedState: string): { codeVerifier: string } | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as { state?: string; codeVerifier?: string };
    if (!stored.codeVerifier || stored.state !== expectedState) return null;
    return { codeVerifier: stored.codeVerifier };
  } catch {
    return null;
  }
}
