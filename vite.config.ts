import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
}));
