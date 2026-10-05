import { ApiClient } from "./api";

/**
 * Origin of the Receipt Cycle API Worker. Set EXPO_PUBLIC_API_URL in apps/mobile/.env
 * (for a phone on the same Wi-Fi as `wrangler dev`, use your computer's LAN address).
 */
const baseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!baseUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_URL. Add it to apps/mobile/.env.");
}

export const apiClient = new ApiClient({
  baseUrl,
  webAppUrl: process.env.EXPO_PUBLIC_WEB_APP_URL || "https://receiptcycle.com",
});
