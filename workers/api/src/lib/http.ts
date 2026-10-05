import type { Context } from "hono";
import type { ZodType } from "zod";
import { ApiError } from "./errors";
import type { AppEnv } from "../types";

/** Parse and validate a JSON body; invalid input becomes a 400 with the first issue. */
export async function parseBody<T>(c: Context<AppEnv>, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? ` (${issue.path.join(".")})` : "";
    throw new ApiError(400, `${issue?.message ?? "Invalid request"}${where}`);
  }
  return parsed.data;
}

export function workspaceParam(c: Context<AppEnv>): string {
  return (c.req.query("workspace") ?? "personal").trim() || "personal";
}
