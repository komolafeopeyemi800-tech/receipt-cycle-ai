import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, "migrations"));
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            WHOP_WEBHOOK_SECRET: "whsec_test_secret",
            ADMIN_DASHBOARD_SECRET: "admin-secret",
            ADMIN_DASHBOARD_ADMIN_EMAILS: "boss@example.com",
            BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123",
            BETTER_AUTH_URL: "http://localhost",
            RESEND_API_KEY: "re_test",
            GOOGLE_ANDROID_CLIENT_ID: "android-client.apps.googleusercontent.com",
            GOOGLE_WEB_CLIENT_ID: "web-client.apps.googleusercontent.com",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/setup.ts"],
      include: ["test/**/*.test.ts"],
      // Better Auth rejects a detached promise with its APIError for every expected 4xx (wrong
      // password, duplicate email, bad token). The HTTP response is still correct and asserted in
      // the tests, so ignore only that error type and keep failing on anything else.
      onUnhandledError: (error: { name?: string }) => (error.name === "APIError" ? false : undefined),
    },
  };
});
