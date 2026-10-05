import { ApiClient } from "@mobile-lib/api";

/**
 * Origin of the Receipt Cycle API Worker. Set VITE_API_URL for deployed builds
 * (e.g. https://api.receiptcycle.com); local dev falls back to `wrangler dev`.
 */
const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8787" : "");

if (!baseUrl) {
  throw new Error("Receipt Cycle web app is missing its server URL. Set VITE_API_URL in the project configuration.");
}

export const apiClient = new ApiClient({
  baseUrl,
  webAppUrl: typeof window !== "undefined" ? window.location.origin : undefined,
});
