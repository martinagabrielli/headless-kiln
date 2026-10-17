import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a production build in fixture mode.
 *
 *   npm run build && npm run test:e2e
 */
const port = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
      },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    // Fixture mode: no WordPress needed.
    env: { GRAPHQL_ENDPOINT: "", NEXT_PUBLIC_SITE_URL: `http://localhost:${port}` },
  },
});
