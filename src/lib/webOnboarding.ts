/**
 * Web onboarding is shown only after a **new registration** (email sign-up or OAuth account creation).
 * `pending` is set on first successful registration; cleared when onboarding is completed or can be abandoned via skip.
 */
const PENDING_PREFIX = "receiptcycle_web_ob_pending_";
const DONE_PREFIX = "receiptcycle_web_ob_done_";

export function setPendingWebOnboarding(userId: string): void {
  try {
    localStorage.setItem(PENDING_PREFIX + userId, "1");
  } catch {
    /* ignore */
  }
}

export function markWebOnboardingComplete(userId: string): void {
  try {
    localStorage.removeItem(PENDING_PREFIX + userId);
    localStorage.setItem(DONE_PREFIX + userId, "1");
  } catch {
    /* ignore */
  }
}

/** True when this user must see onboarding (new registration, not finished). */
export function needsWebOnboarding(userId: string): boolean {
  try {
    const done = localStorage.getItem(DONE_PREFIX + userId);
    if (done === "1") return false;
    return localStorage.getItem(PENDING_PREFIX + userId) === "1";
  } catch {
    return false;
  }
}
