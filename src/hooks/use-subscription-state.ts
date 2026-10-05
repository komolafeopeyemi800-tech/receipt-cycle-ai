import { useQuery } from "@mobile-lib/api";
import { api } from "@mobile-lib/api";
import { useWebAuth } from "@/contexts/WebAuthContext";

/** Server-authoritative trial / Pro flags (7-day trial, 25 tx cap, export = Pro only). */
export function useSubscriptionState() {
  const { token } = useWebAuth();
  return useQuery(api.subscription.getSubscriptionState, token ? { token } : "skip");
}
