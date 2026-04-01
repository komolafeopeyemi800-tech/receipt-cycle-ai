import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const dateFormat = v.union(v.literal("iso"), v.literal("us"), v.literal("eu"));

const location = v.object({
  id: v.string(),
  label: v.string(),
  address: v.string(),
});

const prefsFields = {
  currency: v.string(),
  dateFormat: dateFormat,
  merchants: v.array(v.string()),
  locations: v.array(location),
  reimbursements: v.optional(v.boolean()),
  txnNumber: v.optional(v.boolean()),
  scanPayment: v.optional(v.boolean()),
  requirePay: v.optional(v.boolean()),
  requireNotes: v.optional(v.boolean()),
};

export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    ...prefsFields,
  },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const doc = { userId, ...rest };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("userPreferences", doc);
  },
});
