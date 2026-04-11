import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "standardwebhooks";

function webhookSecretB64(raw: string): string {
  const s = raw.trim();
  if (typeof Buffer !== "undefined") {
    return Buffer.from(s, "utf8").toString("base64");
  }
  return btoa(s);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Best-effort Whop user id (`user_…`) from Standard Webhooks payload `data`. */
function extractWhopUserId(data: unknown): string | null {
  const d = asRecord(data);
  if (!d) return null;
  const direct = d.user_id ?? d.userId;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const user = asRecord(d.user);
  if (user && typeof user.id === "string" && user.id.length > 0) return user.id;

  const member = asRecord(d.member);
  if (member && typeof member.user_id === "string") return member.user_id;
  if (member && typeof member.userId === "string") return member.userId;

  return null;
}

function productMatches(data: unknown, allowed: Set<string>): boolean {
  if (allowed.size === 0) return true;
  const d = asRecord(data);
  if (!d) return false;
  const product = asRecord(d.product);
  const ids = [d.product_id, d.productId, product?.id].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  return ids.some((id) => allowed.has(id));
}

const http = httpRouter();

http.route({
  path: "/whop-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawSecret = process.env.WHOP_WEBHOOK_SECRET?.trim();
    if (!rawSecret) {
      return new Response("Webhook secret not configured", { status: 503 });
    }

    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    let payload: { type?: string; data?: unknown };
    try {
      const wh = new Webhook(webhookSecretB64(rawSecret));
      payload = wh.verify(body, headers) as { type?: string; data?: unknown };
    } catch {
      return new Response("Invalid webhook signature", { status: 400 });
    }

    const type = payload.type ?? "";
    const data = payload.data;

    const productFilter = process.env.WHOP_PRO_PRODUCT_IDS?.trim();
    const allowedProducts = new Set(
      productFilter
        ? productFilter
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    );

    const activateTypes = new Set(["membership.activated", "membership.went_valid"]);
    const deactivateTypes = new Set([
      "membership.deactivated",
      "membership.went_invalid",
      "refund.created",
    ]);

    if (activateTypes.has(type) || deactivateTypes.has(type)) {
      if (!productMatches(data, allowedProducts)) {
        return new Response("OK", { status: 200 });
      }
      const whopUserId = extractWhopUserId(data);
      if (whopUserId) {
        const pro = activateTypes.has(type);
        await ctx.runMutation(internal.whopWebhook.setProByWhopUserId, {
          whopUserId,
          proSubscriptionActive: pro,
          source: type,
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
