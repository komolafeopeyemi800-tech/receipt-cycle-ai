import { hit } from "./rateLimit";
import type { Db } from "../types";

export type DailyKind = "scan" | "voice" | "upload" | "assistant";

const WHAT: Record<DailyKind, string> = {
  scan: "receipt scanning",
  voice: "voice entry",
  upload: "document upload",
  assistant: "the AI assistant",
};
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Counts one use of a paid AI feature for this person over a rolling 24 hours.
 * The cap comes from the admin dashboard and is never shown to the person, only "come back tomorrow".
 */
export async function useDaily(db: Db, userId: string, kind: DailyKind, limit: number): Promise<{ ok: true } | { ok: false; message: string }> {
  const r = await hit(db, `daily:${kind}:${userId}`, limit, DAY_MS);
  if (r.ok) return { ok: true };
  return { ok: false, message: `You have reached today's limit for ${WHAT[kind]}. Please come back tomorrow.` };
}
