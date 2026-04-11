import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** Whop `user_…` id from OAuth `sub` — stored on `users.whopSub`. */
export const setProByWhopUserId = internalMutation({
  args: {
    whopUserId: v.string(),
    proSubscriptionActive: v.boolean(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, { whopUserId, proSubscriptionActive, source }) => {
    const id = whopUserId.trim();
    if (!id) return { ok: false as const, reason: "empty_id" as const };

    const user = await ctx.db
      .query("users")
      .withIndex("by_whop_sub", (q) => q.eq("whopSub", id))
      .unique();

    if (!user) {
      // Paid before linking Whop to Receipt Cycle — Pro applies after they sign in with Whop once.
      return { ok: false as const, reason: "no_user" as const };
    }

    await ctx.db.patch(user._id, { proSubscriptionActive });
    await ctx.db.insert("adminAuditLogs", {
      action: "whop.webhook_pro",
      actor: "whop_webhook",
      details: JSON.stringify({
        whopUserId: id,
        proSubscriptionActive,
        source: source ?? null,
      }),
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});
