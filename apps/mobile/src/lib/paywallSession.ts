/**
 * Remembers, for this app launch only, which sign-in the trial sheet has already been dealt with for.
 * A sign-in is identified by the account and its session token, so every new login counts as a new session.
 */
let onboardedFor: string | null = null;
let seenFor: string | null = null;

/** Called when onboarding finishes: that same session must not get the trial sheet. */
export function markOnboardedThisSession(userId: string, token: string | null) {
  onboardedFor = `${userId}:${token ?? ""}`;
}

/** True once per session, and never in the session in which the person finished onboarding. */
export function shouldShowTrialSheet(userId: string, token: string | null): boolean {
  const key = `${userId}:${token ?? ""}`;
  if (seenFor === key) return false;
  seenFor = key;
  return onboardedFor !== key;
}
