import { and, eq } from "drizzle-orm";
import { workspaceMembers, workspaces } from "../db/schema";
import type { Db } from "../types";
import { ApiError } from "./errors";

export const newId = () => crypto.randomUUID();

const TEAM_PREFIX = "ws_";

export function isTeamKey(workspaceKey: string): boolean {
  return workspaceKey.startsWith(TEAM_PREFIX);
}

async function isTeamMember(db: Db, userId: string, slug: string): Promise<boolean> {
  const member = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceKey, slug)))
    .get();
  if (member) return true;
  const owned = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.slug, slug), eq(workspaces.ownerUserId, userId)))
    .get();
  return !!owned;
}

/**
 * Map a client workspace key ("personal", "business", "ws_xxx") to the storage scope used by
 * accounts, categories and budgets. Personal/business keys are private to the user; team keys
 * require membership. This replaces Convex, where every user shared the "personal" rows.
 */
export async function resolveScope(db: Db, userId: string, workspaceKey: string): Promise<string> {
  const key = workspaceKey.trim() || "personal";
  if (isTeamKey(key)) {
    if (!(await isTeamMember(db, userId, key))) throw new ApiError(403, "You do not have access to this workspace.");
    return `ws:${key}`;
  }
  return `u:${userId}:${key}`;
}

/** True when the scope string belongs to the user (own personal scope or a team they belong to). */
export async function canAccessScope(db: Db, userId: string, scope: string): Promise<boolean> {
  if (scope.startsWith(`u:${userId}:`)) return true;
  if (scope.startsWith("ws:")) return isTeamMember(db, userId, scope.slice(3));
  return false;
}
