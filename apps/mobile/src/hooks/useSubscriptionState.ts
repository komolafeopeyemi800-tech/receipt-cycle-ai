import { useQuery } from "../lib/api";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export function useSubscriptionState() {
  const { token } = useAuth();
  return useQuery(api.subscription.getSubscriptionState, token ? { token } : "skip");
}
