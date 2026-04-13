import type { Id } from "./_generated/dataModel";

export const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;
export const TRIAL_MAX_TRANSACTIONS = 25;

/** Owner / comped accounts — always full Pro regardless of Whop billing. */
export const LIFETIME_PRO_EMAILS = ["owner@example.com"] as const;

export function isLifetimeProEmail(email: string): boolean {
  const k = email.trim().toLowerCase();
  return (LIFETIME_PRO_EMAILS as readonly string[]).some((e) => e.toLowerCase() === k);
}

export type UserSubDoc = {
  _id: Id<"users">;
  _creationTime: number;
  email: string;
  proSubscriptionActive?: boolean;
  trialStartedAt?: number;
  trialLifetimeAdds?: number;
};

export function computeSubscriptionState(user: UserSubDoc, now: number) {
  const pro = user.proSubscriptionActive === true || isLifetimeProEmail(user.email);
  const trialStartMs = user.trialStartedAt ?? user._creationTime;
  const trialEndsAt = trialStartMs + TRIAL_MS;
  const trialTimeActive = now < trialEndsAt;
  const addsUsed = Math.min(Math.max(0, Math.floor(user.trialLifetimeAdds ?? 0)), TRIAL_MAX_TRANSACTIONS);
  const atTrialCap = !pro && addsUsed >= TRIAL_MAX_TRANSACTIONS;
  /** Remaining trial slots (meaningless when `pro`; use `pro` check for unlimited). */
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

export function sessionErrorMessage(
  phase: SubscriptionComputed["phase"],
  trialAddsUsed: number,
): string | null {
  if (phase === "expired") {
    return "Your 7-day trial ended. Upgrade to Pro to add transactions, scan, use voice and smart helpers, edit data, and export CSV.";
  }
  if (phase === "trial_exhausted") {
    return `You've used all ${TRIAL_MAX_TRANSACTIONS} trial transactions. Upgrade to Pro for unlimited records, optional smart helpers, and CSV export.`;
  }
  return null;
}

export function assertCanCreateTransaction(state: SubscriptionComputed): void {
  if (state.canCreateTransaction) return;
  const msg = sessionErrorMessage(state.phase, state.trialAddsUsed);
  throw new Error(msg ?? "Upgrade to Pro to add transactions.");
}

export function assertCanEditTransaction(state: SubscriptionComputed): void {
  if (state.canEditOrDeleteTransaction) return;
  throw new Error(
    "Your trial ended. Upgrade to Pro to edit or delete transactions. You can still view your records.",
  );
}

export function assertCanExportCsv(state: SubscriptionComputed): void {
  if (state.canExportCsv) return;
  throw new Error("CSV export is available for Pro subscribers. Upgrade to download all your transactions.");
}

export function assertCanMutateBudget(state: SubscriptionComputed): void {
  if (state.canMutateBudgets) return;
  const msg = sessionErrorMessage(state.phase, state.trialAddsUsed);
  throw new Error(msg ?? "Upgrade to Pro to manage budgets.");
}

export async function incrementTrialAddsIfNeeded(
  ctx: { db: { get: (id: Id<"users">) => Promise<unknown>; patch: (id: Id<"users">, p: { trialLifetimeAdds: number }) => Promise<void> } },
  convexUserId: Id<"users">,
) {
  const user = (await ctx.db.get(convexUserId)) as UserSubDoc | null;
  if (!user || user.proSubscriptionActive === true || isLifetimeProEmail(user.email)) return;
  const cur = Math.max(0, Math.floor(user.trialLifetimeAdds ?? 0));
  await ctx.db.patch(convexUserId, { trialLifetimeAdds: cur + 1 });
}
