import { Hono } from "hono";
import { z } from "zod";
import { createCheckoutUrl, customerPortalUrl } from "../lib/polar";
import { parseBody } from "../lib/http";
import { requireUser } from "../middleware/auth";
import type { AppEnv } from "../types";

/** Signed-in billing actions: start a Polar checkout, open the customer portal. */
export const billingRoutes = new Hono<AppEnv>();
billingRoutes.use("*", requireUser);

billingRoutes.post("/checkout", async (c) => {
  const { plan, returnUrl } = await parseBody(c, z.object({ plan: z.enum(["monthly", "yearly"]), returnUrl: z.string().max(500).optional() }));
  const user = c.get("user");
  const web = (c.env.PUBLIC_WEB_APP_URL ?? "https://receiptcycle.com").replace(/\/$/, "");
  // Only our own site or the app's deep link may be used as the place to come back to.
  const safeReturn = returnUrl && (returnUrl.startsWith(`${web}/`) || returnUrl.startsWith("receiptcycle://")) ? returnUrl : null;
  const successUrl = safeReturn ?? `${web}/checkout-return?polar_checkout=1&checkout_id={CHECKOUT_ID}`;
  const url = await createCheckoutUrl(c.env, { plan, userId: user.id, email: user.email, name: user.name || undefined, successUrl });
  return c.json({ url });
});

billingRoutes.post("/portal", async (c) => {
  const user = c.get("user");
  return c.json({ url: await customerPortalUrl(c.env, { userId: user.id, email: user.email }) });
});
