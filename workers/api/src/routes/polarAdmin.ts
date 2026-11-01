import { Hono } from "hono";
import { z } from "zod";
import { parseBody } from "../lib/http";
import { runPolarSetup } from "../lib/polarSetup";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";
import { audit, requireAdmin } from "./admin";

/**
 * Mounted at /api/admin/polar. Same rules as the rest of the admin API: signed in, allowlisted email and the dashboard secret.
 * POST /setup { apply: false } only checks. { apply: true } adds the missing webhook events and benefit links.
 */
export const polarAdminRoutes = new Hono<AppEnv>();
polarAdminRoutes.use("*", requireUser);

polarAdminRoutes.post("/setup", async (c) => {
  const actor = await requireAdmin(c);
  const { apply } = await parseBody(c, z.object({ apply: z.boolean().default(false) }));
  const steps = await runPolarSetup(c.env, { apply });
  if (apply) await audit(c.get("db"), "polar.setup", actor, { steps: steps.map((s) => ({ name: s.name, ok: s.ok, changed: s.changed })) });
  return c.json({ apply, ok: steps.every((s) => s.ok), steps });
});
