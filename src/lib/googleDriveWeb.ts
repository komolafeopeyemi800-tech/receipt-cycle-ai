import { DRIVE_FILE_SCOPE } from "@mobile-lib/export/googleSheets";
import { GOOGLE_WEB_CLIENT_ID } from "@/lib/publicEnv";

/** Reasons the Google sign-in step can fail before anything is uploaded. */
export type GoogleWebAuthCode = "not_configured" | "load_failed" | "popup_blocked" | "popup_closed" | "denied" | "unknown";

export class GoogleWebAuthError extends Error {
  readonly code: GoogleWebAuthCode;
  constructor(code: GoogleWebAuthCode, message: string) {
    super(message);
    this.name = "GoogleWebAuthError";
    this.code = code;
  }
}

type TokenResponse = { access_token?: string; error?: string; error_description?: string; scope?: string };
type TokenClient = { requestAccessToken: (overrides?: { prompt?: string }) => void };
type OAuth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type?: string; message?: string }) => void;
  }) => TokenClient;
  hasGrantedAllScopes?: (r: TokenResponse, ...scopes: string[]) => boolean;
};

const GIS_SRC = "https://accounts.google.com/gsi/client";
let gisLoading: Promise<void> | null = null;

function oauth2(): OAuth2 | undefined {
  return (window as unknown as { google?: { accounts?: { oauth2?: OAuth2 } } }).google?.accounts?.oauth2;
}

/** Load Google's sign-in script once. Safe to call early (for example on page load) so the click stays instant. */
export function preloadGoogleIdentity(): Promise<void> {
  if (oauth2()) return Promise.resolve();
  gisLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisLoading = null;
      script.remove();
      reject(new GoogleWebAuthError("load_failed", "Could not load Google sign-in. Check your connection (or an ad blocker) and try again."));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

export function isGoogleSaveConfigured(): boolean {
  return Boolean(GOOGLE_WEB_CLIENT_ID);
}

/**
 * Ask the person to sign in with Google and allow the limited drive.file permission.
 * Call this straight from a click handler. The token lives only in the returned promise: it is never stored.
 */
export async function requestDriveAccessToken(): Promise<string> {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new GoogleWebAuthError("not_configured", "Saving to Google is not set up for this site yet. You can still download the report.");
  }
  await preloadGoogleIdentity();
  const api = oauth2();
  if (!api) throw new GoogleWebAuthError("load_failed", "Could not load Google sign-in. Please try again.");

  return new Promise<string>((resolve, reject) => {
    const client = api.initTokenClient({
      client_id: GOOGLE_WEB_CLIENT_ID,
      scope: DRIVE_FILE_SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) {
          const denied = r.error === "access_denied";
          reject(
            new GoogleWebAuthError(
              denied ? "denied" : "unknown",
              denied
                ? "Google access was not allowed. To save to Google Sheets, allow Receipt Cycle to create files in your Drive."
                : "Google sign-in did not finish. Please try again.",
            ),
          );
          return;
        }
        if (api.hasGrantedAllScopes && !api.hasGrantedAllScopes(r, DRIVE_FILE_SCOPE)) {
          reject(new GoogleWebAuthError("denied", "Google access was not allowed. To save to Google Sheets, allow Receipt Cycle to create files in your Drive."));
          return;
        }
        resolve(r.access_token);
      },
      error_callback: (e) => {
        if (e?.type === "popup_failed_to_open") {
          reject(new GoogleWebAuthError("popup_blocked", "Your browser blocked the Google window. Allow pop-ups for this site and try again."));
        } else if (e?.type === "popup_closed") {
          reject(new GoogleWebAuthError("popup_closed", "The Google window was closed before you finished. Try again when you are ready."));
        } else {
          reject(new GoogleWebAuthError("unknown", "Google sign-in did not finish. Please try again."));
        }
      },
    });
    client.requestAccessToken({ prompt: "" });
  });
}
