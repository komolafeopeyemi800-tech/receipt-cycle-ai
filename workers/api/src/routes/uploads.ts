import { and, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { uploadParses } from "../db/schema";
import { getRuntimeConfig } from "../lib/config";
import { ApiError } from "../lib/errors";
import { newId } from "../lib/scope";
import { computeSubscriptionState, sessionErrorMessage } from "../lib/subscription";
import { MAX_FILE_BYTES, type ParseResult, parseStatement } from "../docs/pipeline";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

/** Fresh (non-cached) AI-assisted uploads one account may run per day: a hard ceiling on spend. */
export const AI_UPLOADS_PER_DAY = 20;
/** D1 rows max out at 2 MB; stay well under so a big result is returned but simply not cached. */
const MAX_CACHED_JSON = 1_500_000;

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const uploadRoutes = new Hono<AppEnv>();
uploadRoutes.use("*", requireUser);

/**
 * Read a statement (Excel, CSV, PDF, Word) into transactions WITHOUT importing them. The client shows
 * the preview, then imports through POST /api/transactions/bulk-import in chunks of 500.
 * Send multipart/form-data with a `file` field. `?refresh=1` ignores the saved result.
 */
uploadRoutes.post("/statement", async (c) => {
  const db = c.get("db");
  const u = c.get("user");

  const cfg = await getRuntimeConfig(db);
  if (cfg.maintenanceMode) throw new ApiError(503, "System is in maintenance mode. Please try again later.");
  if (!cfg.uploadEnabled) throw new ApiError(403, "Upload flow is currently disabled by admin.");

  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) throw new ApiError(400, "Send the statement as a multipart `file` field.");
  if (file.size > MAX_FILE_BYTES) throw new ApiError(413, `Files up to ${MAX_FILE_BYTES / 1024 / 1024} MB are supported.`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) throw new ApiError(400, "That file is empty.");
  const fileHash = await sha256Hex(bytes);

  if (c.req.query("refresh") !== "1") {
    const hit = await db
      .select()
      .from(uploadParses)
      .where(and(eq(uploadParses.userId, u.id), eq(uploadParses.fileHash, fileHash)))
      .get();
    if (hit) return c.json({ ...(JSON.parse(hit.result) as ParseResult), fileHash, fileName: file.name, cached: true });
  }

  const sub = computeSubscriptionState(
    {
      createdAt: u.createdAt,
      proSubscriptionActive: u.profile.proSubscriptionActive,
      trialStartedAt: u.profile.trialStartedAt,
      trialLifetimeAdds: u.profile.trialLifetimeAdds,
    },
    Date.now(),
  );
  let allowAi = sub.canUseAiFeatures && !!c.env.OPENAI_API_KEY?.trim();
  const notes: string[] = [];
  if (!sub.canUseAiFeatures) notes.push(sessionErrorMessage(sub.phase) ?? "The AI helper is not available on your plan.");
  if (allowAi) {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const used = await db
      .select({ n: sql<number>`count(*)` })
      .from(uploadParses)
      .where(and(eq(uploadParses.userId, u.id), eq(uploadParses.source, "ai"), gte(uploadParses.createdAt, since)))
      .get();
    if ((used?.n ?? 0) >= AI_UPLOADS_PER_DAY) {
      allowAi = false;
      notes.push(`Daily limit reached for AI-assisted uploads (${AI_UPLOADS_PER_DAY}). Files that need no AI still work.`);
    }
  }

  const result = await parseStatement(bytes, { fileName: file.name, env: c.env, allowAi });
  if (notes.length && result.status !== "ok") result.warnings.push(...notes);

  if (result.status === "ok") {
    const json = JSON.stringify(result);
    if (json.length <= MAX_CACHED_JSON) {
      await db
        .insert(uploadParses)
        .values({
          id: newId(),
          userId: u.id,
          fileHash,
          fileName: file.name.slice(0, 200),
          fileType: result.fileType,
          source: result.source,
          rowCount: result.rows.length,
          result: json,
          createdAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: [uploadParses.userId, uploadParses.fileHash],
          set: { fileName: file.name.slice(0, 200), source: result.source, rowCount: result.rows.length, result: json, createdAt: Date.now() },
        });
    }
  }
  return c.json({ ...result, fileHash, fileName: file.name, cached: false });
});
