import { api, useAction } from "@mobile-lib/api";
import { useWebAuth } from "@/contexts/WebAuthContext";

/** Starts Polar checkout / opens the Polar customer portal for the signed-in user. Both return an error message instead of throwing. */
export function useBilling() {
  const { token } = useWebAuth();
  const checkout = useAction(api.billing.checkout);
  const portal = useAction(api.billing.portal);

  async function startCheckout(plan: "monthly" | "yearly"): Promise<string | null> {
    if (!token) return "Sign in first, then choose a plan.";
    try {
      const { url } = await checkout({ token, plan });
      window.location.assign(url);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Could not start checkout. Please try again.";
    }
  }

  async function openPortal(): Promise<string | null> {
    if (!token) return "Sign in first.";
    try {
      const { url } = await portal({ token });
      window.open(url, "_blank", "noopener,noreferrer");
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Could not open the billing portal.";
    }
  }

  return { startCheckout, openPortal };
}
