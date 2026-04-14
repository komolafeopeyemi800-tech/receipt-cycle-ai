import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";
import {
  TRIAL_MAX_TRANSACTIONS,
  type UserSubDoc,
  computeSubscriptionState,
  sessionErrorMessage,
} from "./_subscriptionLogic";

/** @public Re-export for UI copy / admin. */
export { TRIAL_MS, TRIAL_MAX_TRANSACTIONS } from "./_subscriptionLogic";

function normKey(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

async function collectTransactionsForUserKeys(
  ctx: {
    db: {
      query: (t: "transactions") => {
        withIndex: (name: string, fn: (q: { eq: (f: string, v: string) => unknown }) => unknown) => {
          collect: () => Promise<{ _id: string }[]>;
        };
      };
    };
  },
  userId: string,
  email: string | undefined,
) {
  const merged = new Map<string, unknown>();
  const push = async (key: string) => {
    if (!key.trim()) return;
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user_workspace", (q: { eq: (f: string, val: string) => unknown }) => q.eq("userId", key))
      .collect();
    for (const r of rows) merged.set(r._id, r);
  };
  await push(userId.trim());
  const em = email?.trim();
  if (em && normKey(em) !== normKey(userId)) {
    await push(em);
    if (em.toLowerCase() !== em) await push(em.toLowerCase());
  }
  return merged.size;
}

/** Node actions: check session + subscription for AI/export gates. */
export const evaluateForAction = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = (await ctx.runQuery(api.auth.me, { token: token.trim() })) as { id?: string } | null;
    if (!me?.id) {
      return { ok: false as const, code: "auth" as const };
    }
    const user = (await ctx.db.get(me.id as never)) as UserSubDoc | null;
    if (!user) return { ok: false as const, code: "user" as const };

    const now = Date.now();
    const st = computeSubscriptionState(user, now);
    return {
      ok: true as const,
      userId: user._id as string,
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
      blockReason: sessionErrorMessage(st.phase, st.trialAddsUsed),
    };
  },
});

export const getSubscriptionState = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = (await ctx.runQuery(api.auth.me, { token: token.trim() })) as { id?: string } | null;
    if (!me?.id) return null;
    const user = (await ctx.db.get(me.id as never)) as UserSubDoc | null;
    if (!user) return null;
    const now = Date.now();
    const st = computeSubscriptionState(user, now);
    return {
      userId: user._id as string,
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
      blockReason: sessionErrorMessage(st.phase, st.trialAddsUsed),
    };
  },
});

export const bootstrapSubscription = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = (await ctx.runQuery(api.auth.me, { token: token.trim() })) as { id?: string } | null;
    if (!me?.id) return { ok: false as const };
    const userId = me.id as Id<"users">;
    // Keep subscription status in sync even when webhook lands after the user session started.
    await ctx.runMutation(internal.whopWebhook.reconcileEntitlementForUser, { userId });
    const user = (await ctx.db.get(userId as never)) as UserSubDoc | null;
    if (!user) return { ok: false as const };
    if (user.proSubscriptionActive === true) return { ok: true as const };

    const patch: { trialLifetimeAdds?: number; trialStartedAt?: number } = {};
    if (user.trialLifetimeAdds === undefined) {
      const n = await collectTransactionsForUserKeys(ctx, user._id as string, user.email);
      patch.trialLifetimeAdds = Math.min(n, TRIAL_MAX_TRANSACTIONS);
    }
    if (user.trialStartedAt == null) {
      patch.trialStartedAt = user._creationTime;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }
    return { ok: true as const };
  },
});
