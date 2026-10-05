import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { workspaceInvites, workspaceMembers, workspaces } from "../db/schema";
import { ApiError } from "../lib/errors";
import { parseBody } from "../lib/http";
import { isTeamKey, newId } from "../lib/scope";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

export const workspaceRoutes = new Hono<AppEnv>();
workspaceRoutes.use("*", requireUser);

const randomSuffix = (len: number) => crypto.randomUUID().replace(/-/g, "").slice(0, len);

/** Personal plus every team workspace the user owns or belongs to. */
workspaceRoutes.get("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("user").id;
  const out: { id: string; name: string; sub: "INDIVIDUAL" | "TEAM" }[] = [
    { id: "personal", name: "Personal", sub: "INDIVIDUAL" },
  ];
  const owned = await db.select().from(workspaces).where(eq(workspaces.ownerUserId, userId));
  const seen = new Set<string>();
  for (const w of owned) {
    seen.add(w.slug);
    out.push({ id: w.slug, name: w.name, sub: "TEAM" });
  }
  const memberships = await db
    .select({ slug: workspaces.slug, name: workspaces.name })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.slug, workspaceMembers.workspaceKey))
    .where(eq(workspaceMembers.userId, userId));
  for (const m of memberships) {
    if (seen.has(m.slug)) continue;
    seen.add(m.slug);
    out.push({ id: m.slug, name: m.name, sub: "TEAM" });
  }
  return c.json(out);
});

workspaceRoutes.post("/", async (c) => {
  const db = c.get("db");
  const userId = c.get("user").id;
  const { name } = await parseBody(c, z.object({ name: z.string().trim().min(1) }));
  const slug = `ws_${Date.now().toString(36)}_${randomSuffix(6)}`;
  const now = Date.now();
  await db.batch([
    db.insert(workspaces).values({ id: newId(), name: name.slice(0, 80), slug, kind: "team", ownerUserId: userId, createdAt: now }),
    db.insert(workspaceMembers).values({ id: newId(), workspaceKey: slug, userId, role: "owner" }),
  ]);
  return c.json({ slug }, 201);
});

workspaceRoutes.post("/:slug/invites", async (c) => {
  const db = c.get("db");
  const userId = c.get("user").id;
  const slug = c.req.param("slug");
  const { email } = await parseBody(c, z.object({ email: z.string().trim().email() }));
  if (slug === "personal") {
    throw new ApiError(400, "Personal workspace cannot send invites. Create and select a workspace first.");
  }
  if (!isTeamKey(slug)) throw new ApiError(400, "Invites are only available from a workspace you created.");
  const ws = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).get();
  if (!ws || ws.ownerUserId !== userId) throw new ApiError(403, "Only the workspace owner can invite members.");
  const token = `inv_${Date.now().toString(36)}_${randomSuffix(10)}`;
  await db.insert(workspaceInvites).values({
    id: newId(),
    workspaceKey: slug,
    email: email.toLowerCase(),
    token,
    status: "pending",
    invitedBy: userId,
    createdAt: Date.now(),
  });
  return c.json({ token }, 201);
});

workspaceRoutes.post("/accept-invite", async (c) => {
  const db = c.get("db");
  const userId = c.get("user").id;
  const { token } = await parseBody(c, z.object({ token: z.string().trim().min(1) }));
  const invite = await db.select().from(workspaceInvites).where(eq(workspaceInvites.token, token)).get();
  if (!invite || invite.status !== "pending") throw new ApiError(400, "Invalid or already used invite");
  if (invite.workspaceKey === "personal") throw new ApiError(400, "Personal workspace invites are not supported.");
  await db.batch([
    db
      .insert(workspaceMembers)
      .values({ id: newId(), workspaceKey: invite.workspaceKey, userId, role: "member" })
      .onConflictDoNothing(),
    db.update(workspaceInvites).set({ status: "accepted" }).where(eq(workspaceInvites.id, invite.id)),
  ]);
  return c.json({ workspaceKey: invite.workspaceKey });
});

/** Owner removes a team workspace. Transactions that reference the key are kept. */
workspaceRoutes.delete("/:slug", async (c) => {
  const db = c.get("db");
  const userId = c.get("user").id;
  const slug = c.req.param("slug");
  if (!isTeamKey(slug)) {
    throw new ApiError(400, "Only created workspaces (ws_…) can be removed. Personal cannot be deleted.");
  }
  const ws = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.slug, slug), eq(workspaces.ownerUserId, userId)))
    .get();
  if (!ws) throw new ApiError(403, "Only the workspace owner can remove this team.");
  await db.batch([
    db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceKey, slug)),
    db.delete(workspaceInvites).where(eq(workspaceInvites.workspaceKey, slug)),
    db.delete(workspaces).where(eq(workspaces.id, ws.id)),
  ]);
  return c.json({ ok: true });
});
