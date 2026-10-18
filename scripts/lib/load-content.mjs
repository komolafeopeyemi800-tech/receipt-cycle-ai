/**
 * Bundles the TypeScript content modules (routes, schema, crawler-file generators) into one ESM module
 * that plain Node build scripts can import. No React, no DOM: these modules are framework-free by design.
 */
import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export async function loadContent() {
  const result = await esbuild({
    stdin: {
      contents: `export * from "./src/content/routesSeo.ts";\nexport * from "./src/lib/seoFiles.ts";\nexport { PAYWALL_PRICING } from "./src/lib/pricingPaywall.ts";`,
      resolveDir: ROOT,
      sourcefile: "seo-entry.ts",
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2020",
    write: false,
    logLevel: "silent",
  });
  const code = result.outputFiles[0].text;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code, "utf8").toString("base64")}`;
  return import(dataUrl);
}
