import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const workspaceKey = v.string();

export const listAll = query({
  args: { ownerUserId: v.optional(v.string()) },
  handler: async (ctx, { ownerUserId }) => {
    const defaults = [{ id: "personal" as const, name: "Personal", sub: "INDIVIDUAL" as const }];
    if (!ownerUserId) return defaults;

    const custom = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", ownerUserId))
      .collect();

    const extra = custom.map((w) => ({
      id: w.slug,
      name: w.name,
      sub: "TEAM" as const,
    }));

    const ownedSlugs = new Set(custom.map((w) => w.slug));
    const memberRows = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", ownerUserId))
      .collect();

    const fromMembership: { id: string; name: string; sub: "TEAM" }[] = [];
    for (const m of memberRows) {
      if (m.workspaceKey === "personal") continue;
      if (ownedSlugs.has(m.workspaceKey)) continue;
      const ws = await ctx.db
        .query("workspaces")
        .withIndex("by_slug", (q) => q.eq("slug", m.workspaceKey))
        .unique();
      if (ws) {
        fromMembership.push({ id: ws.slug, name: ws.name, sub: "TEAM" });
      }
    }

    return [...defaults, ...extra, ...fromMembership];
  },
});

export const acceptInvite = mutation({
  args: {
    token: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { token, userId }) => {
    const invite = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_token", (q) => q.eq("token", token.trim()))
      .unique();
    if (!invite || invite.status !== "pending") {
      throw new Error("Invalid or already used invite");
    }
    if (invite.workspaceKey === "personal") {
      throw new Error("Personal workspace invites are not supported.");
    }

    const already = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) => q.eq("userId", userId).eq("workspaceKey", invite.workspaceKey))
      .unique();
    if (!already) {
      await ctx.db.insert("workspaceMembers", {
        workspaceKey: invite.workspaceKey,
        userId,
        role: "member",
      });
    }
    await ctx.db.patch(invite._id, { status: "accepted" });
    return { workspaceKey: invite.workspaceKey };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    ownerUserId: v.optional(v.string()),
  },
  handler: async (ctx, { name, ownerUserId }) => {
    const slug = `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await ctx.db.insert("workspaces", {
      name: name.trim().slice(0, 80),
      slug,
      kind: "team",
      ownerUserId,
    });
    if (ownerUserId) {
      const existing = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_user_workspace", (q) => q.eq("userId", ownerUserId).eq("workspaceKey", slug))
        .unique();
      if (!existing) {
        await ctx.db.insert("workspaceMembers", {
          workspaceKey: slug,
          userId: ownerUserId,
          role: "owner",
        });
      }
    }
    return slug;
  },
});

export const createInvite = mutation({
  args: {
    workspaceKey: workspaceKey,
    email: v.string(),
    invitedBy: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceKey: ws, email, invitedBy }) => {
    /** Personal is solo — only created team workspaces (ws_*) can invite. */
    if (ws === "personal") {
      throw new Error("Personal workspace cannot send invites. Create and select a workspace first.");
    }
    if (!ws.startsWith("ws_")) {
      throw new Error("Invites are only available from a workspace you created.");
    }
    const token = `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await ctx.db.insert("workspaceInvites", {
      workspaceKey: ws,
      email: email.trim().toLowerCase(),
      token,
      status: "pending",
      invitedBy,
      createdAt: Date.now(),
    });
    return token;
  },
});

/** Owner removes a team workspace (slug ws_*). Does not delete transactions referencing that key. */
export const removeTeamWorkspace = mutation({
  args: { slug: v.string(), userId: v.string() },
  handler: async (ctx, { slug, userId }) => {
    if (!slug.startsWith("ws_")) {
      throw new Error("Only created workspaces (ws_…) can be removed. Personal cannot be deleted.");
    }
    const ws = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!ws || ws.ownerUserId !== userId) {
      throw new Error("Only the workspace owner can remove this team.");
    }
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceKey", slug))
      .collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }
    const invites = await ctx.db.query("workspaceInvites").collect();
    for (const inv of invites) {
      if (inv.workspaceKey === slug) await ctx.db.delete(inv._id);
    }
    await ctx.db.delete(ws._id);
  },
});
