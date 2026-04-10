import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

export function useSubscriptionState() {
  const { token } = useAuth();
  return useQuery(api.subscription.getSubscriptionState, token ? { token } : "skip");
}
