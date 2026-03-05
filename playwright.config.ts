import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Global setup and teardown */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : 4,
  /* Global timeout for each test */
  timeout: 60000, // 60 seconds per test — increased from 30s to prevent cold-start browser context failures
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { open: "never" }],
    ["./e2e/custom-reporter.ts"], // Deterministic reporter — no exit code forcing
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:5173",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    /* Record video for all tests */
    video: "off",
    /* Navigation timeout — prevents waitForLoadState('networkidle') from hanging
     * indefinitely when Vite's HMR SSE connection blocks the 500ms quiet period.
     * Tests that rely on 'networkidle' will fail quickly (at 30s) and retry.
     * Tests using 'load' or 'domcontentloaded' complete in 2-5s and are unaffected. */
    navigationTimeout: 30000,
    /* Set environment variables for tests */
    env: {
      ...process.env,
      VITE_API_BASE_URL: "https://api.tokens.biatec.io/",
    },
    /* Ignore console errors that don't affect test functionality */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: process.env.CI
    ? [
        // On CI, only test on Chromium for faster execution
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        // Locally, test on all browsers
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },

        {
          name: "firefox",
          use: { ...devices["Desktop Firefox"] },
        },

        {
          name: "webkit",
          use: { ...devices["Desktop Safari"] },
        },

        /* Test against mobile viewports. */
        {
          name: "Mobile Chrome",
          use: { ...devices["Pixel 5"] },
        },
        {
          name: "Mobile Safari",
          use: { ...devices["iPhone 12"] },
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
