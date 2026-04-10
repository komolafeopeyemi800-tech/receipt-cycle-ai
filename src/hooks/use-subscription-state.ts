import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useWebAuth } from "@/contexts/WebAuthContext";

/** Server-authoritative trial / Pro flags (7-day trial, 25 tx cap, export = Pro only). */
export function useSubscriptionState() {
  const { token } = useWebAuth();
  return useQuery(api.subscription.getSubscriptionState, token ? { token } : "skip");
}
