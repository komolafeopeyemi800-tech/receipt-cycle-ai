import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "node:url";
import { componentTagger } from "lovable-tagger";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  /** Same directory as this file, so env files are found when `process.cwd()` is not the repo root. */
  loadEnv(mode, repoRoot, ["VITE_"]);
  const define: Record<string, string> = {};

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
      // apps/mobile has its own React 19; the web app must use exactly one React (18) everywhere.
      dedupe: ["react", "react-dom", "@tanstack/react-query"],
      alias: {
        react: path.resolve(repoRoot, "node_modules/react"),
        "react-dom": path.resolve(repoRoot, "node_modules/react-dom"),
        "@tanstack/react-query": path.resolve(repoRoot, "node_modules/@tanstack/react-query"),
        "@": path.resolve(repoRoot, "./src"),
        "@mobile-lib": path.resolve(repoRoot, "./apps/mobile/src/lib"),
      },
    },
    // wasm-bindgen packages locate their .wasm with import.meta.url, which pre-bundling would break.
    optimizeDeps: { exclude: ["@firecrawl/anydoc-wasm"] },
    define,
  };
});
