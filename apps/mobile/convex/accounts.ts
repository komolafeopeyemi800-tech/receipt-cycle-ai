import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const workspaceV = v.string();

const DEFAULT_ACCOUNTS: { name: string; balance: number; iconKey: string }[] = [
  { name: "Card", balance: 0, iconKey: "credit-card" },
  { name: "Cash", balance: 0, iconKey: "money-bill-wave" },
  { name: "Savings", balance: 0, iconKey: "piggy-bank" },
];

export const list = query({
  args: { workspace: workspaceV },
  handler: async (ctx, { workspace }) => {
    const rows = await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspace", workspace))
      .collect();
    return rows.map((r) => ({
      id: r._id,
      name: r.name,
      balance: r.balance,
      iconKey: r.iconKey ?? "wallet",
    }));
  },
});

export const get = query({
  args: { id: v.id("accounts"), workspace: workspaceV },
  handler: async (ctx, { id, workspace }) => {
    const r = await ctx.db.get(id);
    if (!r || r.workspace !== workspace) return null;
    return {
      id: r._id,
      name: r.name,
      balance: r.balance,
      iconKey: r.iconKey ?? "wallet",
    };
  },
});

export const ensureSeed = mutation({
  args: { workspace: workspaceV },
  handler: async (ctx, { workspace }) => {
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_workspace", (q) => q.eq("workspace", workspace))
      .collect();
    if (existing.length > 0) return;
    for (const a of DEFAULT_ACCOUNTS) {
      await ctx.db.insert("accounts", {
        workspace,
        name: a.name,
        balance: a.balance,
        iconKey: a.iconKey,
      });
    }
  },
});

export const create = mutation({
  args: {
    workspace: workspaceV,
    name: v.string(),
    balance: v.optional(v.number()),
    iconKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workspace, name, balance, iconKey } = args;
    return await ctx.db.insert("accounts", {
      workspace,
      name,
      balance: balance ?? 0,
      iconKey: iconKey ?? "wallet",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    balance: v.optional(v.number()),
    iconKey: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, balance, iconKey }) => {
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Account not found");
    const patch: { name?: string; balance?: number; iconKey?: string } = {};
    if (name !== undefined) patch.name = name.trim().slice(0, 80);
    if (balance !== undefined) patch.balance = balance;
    if (iconKey !== undefined) patch.iconKey = iconKey;
    await ctx.db.patch(id, patch);
  },
});
