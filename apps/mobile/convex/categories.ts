import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const workspaceV = v.string();

const DEFAULTS: { name: string; kind: "expense" | "income"; color: string }[] = [
  { name: "Food & Dining", kind: "expense", color: "#ef4444" },
  { name: "Shopping", kind: "expense", color: "#2563eb" },
  { name: "Transportation", kind: "expense", color: "#7c3aed" },
  { name: "Bills", kind: "expense", color: "#16a34a" },
  { name: "Health", kind: "expense", color: "#f97316" },
  { name: "Entertainment", kind: "expense", color: "#db2777" },
  { name: "Education", kind: "expense", color: "#0ea5e9" },
  { name: "Home", kind: "expense", color: "#ea580c" },
  { name: "Salary", kind: "income", color: "#0f766e" },
  { name: "Other", kind: "expense", color: "#64748b" },
];

export const list = query({
  args: { workspace: workspaceV },
  handler: async (ctx, { workspace }) => {
    const rows = await ctx.db
      .query("categories")
      .withIndex("by_workspace", (q) => q.eq("workspace", workspace))
      .collect();
    return rows.map((r) => ({
      id: r._id,
      name: r.name,
      kind: r.kind,
      color: r.color,
    }));
  },
});

export const ensureSeed = mutation({
  args: { workspace: workspaceV },
  handler: async (ctx, { workspace }) => {
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_workspace", (q) => q.eq("workspace", workspace))
      .collect();
    if (existing.length > 0) return;
    for (const c of DEFAULTS) {
      await ctx.db.insert("categories", { workspace, ...c });
    }
  },
});

export const create = mutation({
  args: {
    workspace: workspaceV,
    name: v.string(),
    kind: v.union(v.literal("expense"), v.literal("income")),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const { workspace, name, kind, color } = args;
    const trimmed = name.trim();
    if (trimmed.length < 1) throw new Error("Category name required");
    const all = await ctx.db
      .query("categories")
      .withIndex("by_workspace", (q) => q.eq("workspace", workspace))
      .collect();
    if (all.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error("A category with this name already exists.");
    }
    return await ctx.db.insert("categories", { workspace, name: trimmed, kind, color });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("expense"), v.literal("income"))),
  },
  handler: async (ctx, { id, name, color, kind }) => {
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Category not found");
    const patch: { name?: string; color?: string; kind?: "expense" | "income" } = {};
    if (name !== undefined) patch.name = name.trim().slice(0, 80);
    if (color !== undefined) patch.color = color;
    if (kind !== undefined) patch.kind = kind;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
