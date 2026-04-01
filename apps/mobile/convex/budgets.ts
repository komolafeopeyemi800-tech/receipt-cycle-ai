import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const workspaceV = v.string();

export const listForMonth = query({
  args: { workspace: workspaceV, month: v.string() },
  handler: async (ctx, { workspace, month }) => {
    const rows = await ctx.db
      .query("budgets")
      .withIndex("by_workspace_month", (q) => q.eq("workspace", workspace).eq("month", month))
      .collect();
    return rows.map((r) => ({
      id: r._id,
      category: r.category,
      month: r.month,
      limitAmount: r.limitAmount,
    }));
  },
});

export const upsert = mutation({
  args: {
    workspace: workspaceV,
    category: v.string(),
    month: v.string(),
    limitAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const { workspace, category, month, limitAmount } = args;
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_workspace_month", (q) => q.eq("workspace", workspace).eq("month", month))
      .filter((q) => q.eq(q.field("category"), category))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { limitAmount });
      return existing._id;
    }
    return await ctx.db.insert("budgets", { workspace, category, month, limitAmount });
  },
});
