import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiProvider } from "@mobile-lib/api";
import { apiClient } from "@/lib/api";
import { WebAuthProvider } from "@/contexts/WebAuthContext";
import Pricing from "./Pricing";

const queryClient = new QueryClient();

/** Public plans render without private workspace/onboarding gates; checkout keeps its auth context. */
export default function PublicPricing() {
  return <QueryClientProvider client={queryClient}><ApiProvider client={apiClient}><WebAuthProvider><Pricing /></WebAuthProvider></ApiProvider></QueryClientProvider>;
}
