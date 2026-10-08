import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api, useAction } from "./api";
import { openHttpsOrExternalUrl } from "./openExternalUrl";

/** After paying, Polar sends the customer here; the page hands them back to the app. */
const RETURN_URL = "https://receiptcycle.com/checkout-return?polar_checkout=1&screen=Records&checkout_id={CHECKOUT_ID}";

/** Start Polar checkout / open the Polar customer portal. Both resolve to an error message (or null when the page opened). */
export function useBillingActions() {
  const { token } = useAuth();
  const checkout = useAction(api.billing.checkout);
  const portal = useAction(api.billing.portal);

  const startCheckout = useCallback(
    async (plan: "monthly" | "yearly"): Promise<string | null> => {
      if (!token) return "Sign in first, then choose a plan.";
      try {
        const { url } = await checkout({ token, plan, returnUrl: RETURN_URL });
        await openHttpsOrExternalUrl(url);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Could not start checkout. Please try again.";
      }
    },
    [token, checkout],
  );

  const openPortal = useCallback(async (): Promise<string | null> => {
    if (!token) return "Sign in first.";
    try {
      const { url } = await portal({ token });
      await openHttpsOrExternalUrl(url);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Could not open the billing portal.";
    }
  }, [token, portal]);

  return { startCheckout, openPortal };
}
