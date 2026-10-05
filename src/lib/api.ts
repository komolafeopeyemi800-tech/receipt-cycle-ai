import { ApiClient } from "@mobile-lib/api";
import { API_URL } from "@/lib/publicEnv";

/** Origin of the Receipt Cycle API Worker: see publicEnv.ts for how it is chosen. */
const baseUrl = API_URL;

export const apiClient = new ApiClient({
  baseUrl,
  webAppUrl: typeof window !== "undefined" ? window.location.origin : undefined,
});
