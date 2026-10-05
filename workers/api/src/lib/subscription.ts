/**
 * Port of apps/mobile/convex/_subscriptionLogic.ts. Pure functions: no DB, no env access.
 * Behavior is pinned by apps/mobile/convex/_subscriptionLogic.test.ts and test/subscription.test.ts.
 */
import { ApiError } from "./errors";

export const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;
export const TRIAL_MAX_TRANSACTIONS = 25;

export type SubscriptionInput = {
  /** Account creation time (unix ms). Used when `trialStartedAt` is unset. */
  createdAt: number;
  proSubscriptionActive?: boolean | null;
  trialStartedAt?: number | null;
  trialLifetimeAdds?: number | null;
};

export function parseEmailList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[\n,]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isLifetimeProEmail(email: string, envList: string | undefined): boolean {
  const key = email.trim().toLowerCase();
  return ["owner@example.com", ...parseEmailList(envList)].includes(key);
}

export function computeSubscriptionState(user: SubscriptionInput, now: number) {
  const pro = user.proSubscriptionActive === true;
  const trialStartMs = user.trialStartedAt ?? user.createdAt;
  const trialEndsAt = trialStartMs + TRIAL_MS;
  const trialTimeActive = now < trialEndsAt;
  const addsUsed = Math.min(Math.max(0, Math.floor(user.trialLifetimeAdds ?? 0)), TRIAL_MAX_TRANSACTIONS);
  const atTrialCap = !pro && addsUsed >= TRIAL_MAX_TRANSACTIONS;
  const trialAddsRemaining = pro ? 999_999 : Math.max(0, TRIAL_MAX_TRANSACTIONS - addsUsed);

  const canCreateTransaction = pro || (trialTimeActive && !atTrialCap);
  const canUseAiFeatures = pro || (trialTimeActive && !atTrialCap);
  const canExportCsv = pro;
  const canEditOrDeleteTransaction = pro || trialTimeActive;
  const canMutateBudgets = pro || (trialTimeActive && !atTrialCap);
  const viewOnlyLocked = !pro && !trialTimeActive;

  let phase: "pro" | "trial" | "trial_exhausted" | "expired";
  if (pro) phase = "pro";
  else if (!trialTimeActive) phase = "expired";
  else if (atTrialCap) phase = "trial_exhausted";
  else phase = "trial";

  return {
    pro,
    trialEndsAt,
    trialTimeActive,
    trialAddsUsed: addsUsed,
    trialAddsLimit: TRIAL_MAX_TRANSACTIONS,
    trialAddsRemaining,
    canCreateTransaction,
    canUseAiFeatures,
    canExportCsv,
    canEditOrDeleteTransaction,
    canMutateBudgets,
    viewOnlyLocked,
    phase,
  };
}

export type SubscriptionComputed = ReturnType<typeof computeSubscriptionState>;

export function sessionErrorMessage(phase: SubscriptionComputed["phase"]): string | null {
  if (phase === "expired") {
    return "Your 7-day trial ended. Upgrade to Pro to add transactions, scan, use voice and smart helpers, edit data, and export CSV.";
  }
  if (phase === "trial_exhausted") {
    return `You've used all ${TRIAL_MAX_TRANSACTIONS} trial transactions. Upgrade to Pro for unlimited records, optional smart helpers, and CSV export.`;
  }
  return null;
}

/** HTTP 402 so clients can show the upgrade prompt. */
const paywall = (message: string) => new ApiError(402, message);

export function assertCanCreateTransaction(state: SubscriptionComputed): void {
  if (state.canCreateTransaction) return;
  throw paywall(sessionErrorMessage(state.phase) ?? "Upgrade to Pro to add transactions.");
}

export function assertCanEditTransaction(state: SubscriptionComputed): void {
  if (state.canEditOrDeleteTransaction) return;
  throw paywall("Your trial ended. Upgrade to Pro to edit or delete transactions. You can still view your records.");
}

export function assertCanExportCsv(state: SubscriptionComputed): void {
  if (state.canExportCsv) return;
  throw paywall("CSV export is available for Pro subscribers. Upgrade to download all your transactions.");
}

export function assertCanMutateBudget(state: SubscriptionComputed): void {
  if (state.canMutateBudgets) return;
  throw paywall(sessionErrorMessage(state.phase) ?? "Upgrade to Pro to manage budgets.");
}

/** Shape returned by GET /api/subscription (same fields the Convex query returned). */
export function subscriptionPayload(userId: string, st: SubscriptionComputed) {
  return {
    userId,
    pro: st.pro,
    trialEndsAt: st.trialEndsAt,
    trialTimeActive: st.trialTimeActive,
    trialAddsUsed: st.trialAddsUsed,
    trialAddsLimit: st.trialAddsLimit,
    trialAddsRemaining: st.trialAddsRemaining,
    canCreateTransaction: st.canCreateTransaction,
    canUseAiFeatures: st.canUseAiFeatures,
    canExportCsv: st.canExportCsv,
    canEditOrDeleteTransaction: st.canEditOrDeleteTransaction,
    canMutateBudgets: st.canMutateBudgets,
    viewOnlyLocked: st.viewOnlyLocked,
    phase: st.phase,
    blockReason: sessionErrorMessage(st.phase),
  };
}
