import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  /** Public OAuth app id only — same value as Convex WHOP_OAUTH_CLIENT_ID; never use client_secret here. */
  const whopPublicClientId = [
    env.VITE_WHOP_OAUTH_CLIENT_ID,
    env.VITE_WHOP_CLIENT_ID,
    env.WHOP_OAUTH_CLIENT_ID,
    env.WHOP_CLIENT_ID,
  ]
    .map((s) => s?.trim())
    .find(Boolean);

  return {
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
        "@": path.resolve(__dirname, "./src"),
        // Shared Convex backend (lives under apps/mobile per monorepo layout)
        "@convex": path.resolve(__dirname, "./apps/mobile/convex"),
        "@mobile-lib": path.resolve(__dirname, "./apps/mobile/src/lib"),
      },
    },
    define: whopPublicClientId
      ? {
          "import.meta.env.VITE_WHOP_OAUTH_CLIENT_ID": JSON.stringify(whopPublicClientId),
        }
      : {},
  };
});
