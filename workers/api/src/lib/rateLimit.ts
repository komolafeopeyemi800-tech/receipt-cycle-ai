import { sql } from "drizzle-orm";
import type { Db } from "../types";
import { ApiError } from "./errors";

export type RateResult = { ok: boolean; count: number; limit: number; retryAfterSeconds: number };

/**
 * Count one hit against `key` in a fixed window and say whether it is still within `limit`.
 * One D1 statement, no read-modify-write race.
 */
export async function hit(db: Db, key: string, limit: number, windowMs: number): Promise<RateResult> {
  const now = Date.now();
  const cutoff = now - windowMs;
  const rows = await db.all<{ count: number; window_start: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, ${now}, 1)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN window_start <= ${cutoff} THEN 1 ELSE count + 1 END,
      window_start = CASE WHEN window_start <= ${cutoff} THEN ${now} ELSE window_start END
    RETURNING count, window_start`);
  const row = rows[0]!;
  return {
    ok: row.count <= limit,
    count: row.count,
    limit,
    retryAfterSeconds: Math.max(1, Math.ceil((row.window_start + windowMs - now) / 1000)),
  };
}

/** Throws a 429 when the limit is exceeded. */
export async function enforce(db: Db, key: string, limit: number, windowMs: number, message: string): Promise<void> {
  const r = await hit(db, key, limit, windowMs);
  if (!r.ok) throw new ApiError(429, `${message} Try again in ${Math.ceil(r.retryAfterSeconds / 60)} minute(s).`);
}
