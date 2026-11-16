import { defineConfig, devices } from "@playwright/test";

/**
 * E-16: browser smoke + accessibility checks against the static export in `out/`.
 *
 *   npm run build        # produces out/
 *   npm run test:e2e     # serves out/ on :4173 (or reuses a running server) and runs tests/e2e
 *
 * Browser: on CI, run `npx playwright install --with-deps chromium` first.
 * Locally (Windows, ₹0), the installed Google Chrome is used so nothing extra is
 * downloaded; set PW_CHANNEL=msedge to use Edge, or PW_CHANNEL= (empty) for the
 * bundled Chromium.
 */
const channel = process.env.PW_CHANNEL ?? (process.env.CI ? undefined : "chrome");
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "tests/e2e/.results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "tests/e2e/.report" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    // 360 px Android phone is the launch reference (US-28, D2).
    ...devices["Pixel 5"],
    viewport: { width: 360, height: 780 },
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    channel: channel || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `node tests/e2e/static-server.mjs ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
