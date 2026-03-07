/**
 * E2E Tests: Auth-First Guided Launch Confidence Hardening
 *
 * New deterministic E2E coverage for this hardening slice.
 * Directly proves each acceptance criterion with browser-level evidence.
 *
 * AC #1  Canonical route /launch/guided is enforced — /create/wizard redirects to it
 * AC #2  Top-nav: guest sees Sign In, no wallet/network artifact in guest or auth state
 * AC #3  Route guard: guest is redirected; authenticated user lands on /launch/guided
 * AC #4  Accessibility: page has h1, main landmark, nav aria-label, progressbar ARIA
 * AC #5  Error/empty states use human language, not raw technical strings
 *
 * Zero waitForTimeout() — all waits are semantic (expect().toBeVisible / waitForFunction).
 * Zero CI-only test.skip() — every test is designed to run deterministically in CI.
 *
 * Auth model: email/password only — no wallet connectors.
 * Auth seeding via canonical withAuth() helper (validates ARC76 contract before seeding).
 *
 * Issue: Vision: complete auth-first guided launch confidence hardening for enterprise-ready MVP
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { test, expect } from "@playwright/test";
import { withAuth, suppressBrowserErrors, clearAuthScript } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Seed authenticated session and navigate to /launch/guided */
async function setupAuthenticatedGuidedLaunch(
  page: import("@playwright/test").Page
) {
  suppressBrowserErrors(page);
  await withAuth(page);
  await page.goto("/launch/guided");
  await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI
}

// ---------------------------------------------------------------------------
// AC #1 — Canonical route enforcement
// ---------------------------------------------------------------------------

test.describe("AC #1: Canonical route enforcement", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("home page navigation contains link to /launch/workspace as the guided launch entry", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    // The nav "Guided Launch" entry now points to /launch/workspace (workspace hub).
    // /launch/guided is reachable from within the workspace, but the primary nav link is /launch/workspace.
    const guidedLaunchLink = page.getByRole("link", { name: /guided launch/i }).first();
    await expect(guidedLaunchLink).toBeVisible({ timeout: 15000 });

    const href = await guidedLaunchLink.getAttribute("href");
    expect(href).toContain("/launch/workspace");
  });

  test("nav does NOT contain /create/wizard as a primary link", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    // Primary nav must not expose /create/wizard as a link
    const wizardLinks = page.locator('a[href*="/create/wizard"]');
    const count = await wizardLinks.count();
    expect(count).toBe(0);
  });

  // Redirect-compatibility for /create/wizard is consolidated in
  // e2e/wizard-redirect-compat.spec.ts (max 3 tests per issue specification).
});

// ---------------------------------------------------------------------------
// AC #2 — Navigation: guest state determinism, no wallet/network artifacts
// ---------------------------------------------------------------------------

test.describe("AC #2: Navigation contract — guest and auth state", () => {
  test("guest user sees Sign In button (not wallet-connect label)", async ({
    page,
  }) => {
    suppressBrowserErrors(page);
    await clearAuthScript(page);
    await page.goto("/");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    // Semantic wait: Sign In button must become visible
    const signInButton = page.getByRole("button", { name: /sign in/i }).first();
    await expect(signInButton).toBeVisible({ timeout: 15000 });

    // Confirm no wallet-connect language in the button
    const buttonText = await signInButton.textContent();
    expect(buttonText).toMatch(/sign in/i);
    expect(buttonText).not.toMatch(/connect wallet/i);
    expect(buttonText).not.toMatch(/walletconnect/i);
  });

  test("guest user does NOT see 'Not connected' network status in top nav", async ({
    page,
  }) => {
    suppressBrowserErrors(page);
    await clearAuthScript(page);
    await page.goto("/");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    // Use innerText (not page.content) to avoid matching compiled JS bundles
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/not connected/i);
  });

  test("authenticated user sees their email in the user menu area (not wallet address)", async ({
    page,
  }) => {
    test.setTimeout(90000) // waitForFunction(30s) + nav overhead; belt-and-suspenders after globalSetup warmup
    suppressBrowserErrors(page);
    // Seed with a known email so we can assert it appears
    await withAuth(page, {
      address: "HARDENING_TEST_ADDR_001",
      email: "hardening-test@biatec.io",
      isConnected: true,
    });
    await page.goto("/", { timeout: 30000 }); // Explicit timeout prevents test.setTimeout(90000) from overriding navigationTimeout
    await page.waitForLoadState("load", { timeout: 30000 }); // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI

    // Semantic wait: the user email should appear in the UI after auth store init.
    // withAuth now sets arc76_email so restoreARC76Session() properly populates arc76email ref in Navbar.
    const emailLocator = page.getByText("hardening-test@biatec.io").first()
    await expect(emailLocator).toBeVisible({ timeout: 30000 })

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain("hardening-test@biatec.io");
    // Must not show wallet-style status
    expect(bodyText).not.toMatch(/not connected/i);
  });
});

// ---------------------------------------------------------------------------
// AC #3 — Route guard: guest redirect / auth continuation
// ---------------------------------------------------------------------------

test.describe("AC #3: Route guard and post-login redirect consistency", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("guest accessing /launch/guided is redirected to auth trigger", async ({
    page,
  }) => {
    await clearAuthScript(page);
    await page.goto("/launch/guided");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    // Semantic wait: auth evidence must appear
    await page.waitForFunction(
      () => {
        const url = window.location.href;
        const emailInput = document.querySelector("input[type='email']");
        return url.includes("showAuth=true") || emailInput !== null;
      },
      { timeout: 15000 }
    );

    const url = page.url();
    const hasAuthParam = url.includes("showAuth=true");
    const emailInputVisible = await page
      .locator("input[type='email']")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasAuthParam || emailInputVisible).toBe(true);
  });

  test("authenticated user accessing /launch/guided lands on the guided launch page", async ({
    page,
  }) => {
    await setupAuthenticatedGuidedLaunch(page);

    // The page must show the Guided Token Launch heading (not redirect away)
    const heading = page.getByRole("heading", {
      name: /guided token launch/i,
      level: 1,
    });
    await expect(heading).toBeVisible({ timeout: 45000 });
  });

  test("guest accessing /cockpit is redirected to auth trigger", async ({
    page,
  }) => {
    await clearAuthScript(page);
    await page.goto("/cockpit");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    await page.waitForFunction(
      () => {
        const url = window.location.href;
        return url.includes("showAuth=true") || url.endsWith("/");
      },
      { timeout: 15000 }
    );

    const url = page.url();
    expect(url.includes("showAuth=true") || url.endsWith("/")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #4 — Accessibility: landmarks, heading hierarchy, ARIA roles
// ---------------------------------------------------------------------------

test.describe("AC #4: Accessibility — ARIA roles, heading hierarchy", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
    await withAuth(page);
  });

  test("guided launch page has a level-1 heading (heading hierarchy — WCAG 2.4.6)", async ({
    page,
  }) => {
    await page.goto("/launch/guided");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    const h1 = page.getByRole("heading", {
      name: /guided token launch/i,
      level: 1,
    });
    await expect(h1).toBeVisible({ timeout: 45000 });
  });

  test("guided launch page has a main landmark (WCAG 1.3.6 region)", async ({
    page,
  }) => {
    await page.goto("/launch/guided");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    const main = page.getByRole("main");
    await expect(main).toBeVisible({ timeout: 45000 });
  });

  test("top navigation has accessible name (WCAG 4.1.2 — navigation landmark)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    const nav = page.getByRole("navigation", { name: /main navigation/i });
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test("guided launch page has a progressbar with ARIA value attributes (WCAG 4.1.2)", async ({
    page,
  }) => {
    await page.goto("/launch/guided");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    // Wait for main content
    await expect(page.getByRole("main")).toBeVisible({ timeout: 45000 });

    // The progressbar element is in the DOM with correct ARIA contract.
    // At step 0 the bar has 0% CSS width (correctly reflects 0% progress),
    // so we verify the ARIA attributes via DOM query rather than visibility.
    const ariaAttrs = await page.evaluate(() => {
      const el = document.querySelector('[role="progressbar"]');
      if (!el) return null;
      return {
        valuenow: el.getAttribute("aria-valuenow"),
        valuemin: el.getAttribute("aria-valuemin"),
        valuemax: el.getAttribute("aria-valuemax"),
      };
    });

    expect(ariaAttrs).not.toBeNull();
    expect(ariaAttrs!.valuenow).not.toBeNull();
    expect(ariaAttrs!.valuemin).toBe("0");
    expect(ariaAttrs!.valuemax).toBe("100");
  });

  test("step indicator navigation region is accessible", async ({ page }) => {
    await page.goto("/launch/guided");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    // Main must be visible first
    await expect(page.getByRole("main")).toBeVisible({ timeout: 45000 });

    // Step indicator has role="navigation" with accessible label
    const stepNav = page.getByRole("navigation", {
      name: /issuance progress|steps/i,
    });
    await expect(stepNav).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// AC #5 — Error messaging: user-facing guidance, no raw technical strings
// ---------------------------------------------------------------------------

test.describe("AC #5: Error messaging — user guidance (no raw technical leakage)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("home page has no visible raw error codes or exception stack traces", async ({
    page,
  }) => {
    await clearAuthScript(page);
    await page.goto("/");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    const bodyText = await page.locator("body").innerText();

    // No raw HTTP error codes visible to users
    expect(bodyText).not.toMatch(/500 internal server error/i);
    expect(bodyText).not.toMatch(/TypeError:|ReferenceError:|Uncaught/);

    // No raw technical stack traces
    expect(bodyText).not.toMatch(/at Object\.<anonymous>/);
    expect(bodyText).not.toMatch(/at Module\.<anonymous>/);
  });

  test("guided launch page shows no wallet-connector error language when auth is valid", async ({
    page,
  }) => {
    await withAuth(page);
    await page.goto("/launch/guided");
    await page.waitForLoadState("load") // "load" not "networkidle" — Vite HMR SSE prevents networkidle in CI

    // Wait for page to fully load
    await expect(
      page.getByRole("heading", { name: /guided token launch/i, level: 1 })
    ).toBeVisible({ timeout: 45000 });

    const bodyText = await page.locator("body").innerText();

    // No wallet-specific error language visible to users
    expect(bodyText).not.toMatch(/wallet not connected/i);
    expect(bodyText).not.toMatch(/connect your wallet/i);
    expect(bodyText).not.toMatch(/transaction rejected by wallet/i);
  });
});
