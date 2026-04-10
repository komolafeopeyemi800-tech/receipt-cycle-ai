import { stripTechnicalNoise } from "./userFacingErrors";

/**
 * Normalize Convex / network error text for matching.
 */
function normalizeAuthMessage(raw: string): string {
  let m = raw.trim();
  for (let i = 0; i < 6 && /^Uncaught Error:\s*/i.test(m); i++) {
    m = m.replace(/^Uncaught Error:\s*/i, "").trim();
  }
  m = stripTechnicalNoise(m);
  return m;
}

/**
 * Map known backend messages to clear, user-facing copy (web + mobile sign-in / sign-up).
 */
function mapKnownAuthMessage(normalized: string): string | null {
  const lower = normalized.toLowerCase();

  if (lower.includes("invalid email or password")) {
    return "Incorrect email or password. Double-check both fields and try again. If you don\u2019t have an account yet, create one below.";
  }
  if (lower.includes("email already registered")) {
    return "This email is already registered. Sign in with that email, or use a different one.";
  }
  if (lower.includes("enter a valid email")) {
    return "Please enter a valid email address.";
  }
  if (/password must be at least/i.test(lower) || /new password must be at least/i.test(lower)) {
    return "Your password must be at least 6 characters.";
  }
  if (lower.includes("current password is incorrect")) {
    return "That current password is incorrect. Try again or sign out and use forgot password from the app.";
  }
  if (lower.includes("session expired") && lower.includes("sign in")) {
    return "Your session expired. Please sign in again.";
  }
  if (lower.includes("reset link has expired")) {
    return "This password reset link has expired. Request a new one from the app.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("load failed") ||
    lower.includes("networkerror")
  ) {
    return "We couldn\u2019t reach the server. Check your connection and try again.";
  }
  if (lower.includes("convex") && (lower.includes("function") || lower.includes("server"))) {
    return "Sign-in is temporarily unavailable. Please try again in a moment.";
  }

  return null;
}

/**
 * Surface Convex action errors as readable, user-facing strings.
 */
export function formatAuthError(err: unknown): string {
  let normalized = "";
  if (err instanceof Error) {
    normalized = normalizeAuthMessage(err.message);
  } else if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string") normalized = normalizeAuthMessage(msg);
  }

  if (normalized) {
    const mapped = mapKnownAuthMessage(normalized);
    if (mapped) return mapped;
    if (normalized.length > 220 || /request id|argumentvalidation|validator/i.test(normalized)) {
      return "Something went wrong. Please try again.";
    }
    return normalized;
  }

  return "Something went wrong. Please try again.";
}
