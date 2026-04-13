import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "node:url";
import { componentTagger } from "lovable-tagger";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  /** Same directory as this file — avoids missing Whop keys when `process.cwd()` is not the repo root. */
  const env = loadEnv(mode, repoRoot, ["VITE_", "WHOP_"]);
  /** Public OAuth app id only — same value as Convex WHOP_OAUTH_CLIENT_ID; never use client_secret here. */
  const whopPublicClientId = [
    env.VITE_WHOP_OAUTH_CLIENT_ID,
    env.VITE_WHOP_CLIENT_ID,
    env.WHOP_OAUTH_CLIENT_ID,
    env.WHOP_CLIENT_ID,
  ]
    .map((s) => s?.trim())
    .find(Boolean);

  /** Public Whop checkout links — copy plan checkout URLs from your Whop dashboard. */
  const checkoutFree =
    env.VITE_WHOP_CHECKOUT_FREE_URL?.trim() || env.WHOP_CHECKOUT_FREE_URL?.trim();
  const checkoutMonthly =
    env.VITE_WHOP_CHECKOUT_MONTHLY_URL?.trim() || env.WHOP_CHECKOUT_MONTHLY_URL?.trim();
  const checkoutYearly =
    env.VITE_WHOP_CHECKOUT_YEARLY_URL?.trim() || env.WHOP_CHECKOUT_YEARLY_URL?.trim();
  const manageUrl = env.VITE_WHOP_MANAGE_URL?.trim() || env.WHOP_MANAGE_URL?.trim();

  const define: Record<string, string> = {};
  if (whopPublicClientId) {
    define["import.meta.env.VITE_WHOP_OAUTH_CLIENT_ID"] = JSON.stringify(whopPublicClientId);
  }
  if (checkoutFree) {
    define["import.meta.env.VITE_WHOP_CHECKOUT_FREE_URL"] = JSON.stringify(checkoutFree);
  }
  if (checkoutMonthly) {
    define["import.meta.env.VITE_WHOP_CHECKOUT_MONTHLY_URL"] = JSON.stringify(checkoutMonthly);
  }
  if (checkoutYearly) {
    define["import.meta.env.VITE_WHOP_CHECKOUT_YEARLY_URL"] = JSON.stringify(checkoutYearly);
  }
  if (manageUrl) {
    define["import.meta.env.VITE_WHOP_MANAGE_URL"] = JSON.stringify(manageUrl);
  }

  return {
    envDir: repoRoot,
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(repoRoot, "./src"),
        // Shared Convex backend (lives under apps/mobile per monorepo layout)
        "@convex": path.resolve(repoRoot, "./apps/mobile/convex"),
        "@mobile-lib": path.resolve(repoRoot, "./apps/mobile/src/lib"),
      },
    },
    define,
  };
});
