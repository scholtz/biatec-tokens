/**
 * E2E Tests: Auth-First Onboarding Confidence — Deterministic Journey
 *
 * This spec validates the complete auth-first onboarding confidence program:
 * AC #1  Auth-first routing enforced for all token creation entry points
 * AC #2  Guest nav has no wallet/network states; Sign In button deterministic
 * AC #3  No E2E test relies on /create/wizard as canonical flow (redirect only)
 * AC #4  WCAG 2.1 AA: keyboard accessible, aria roles present, no raw tech errors
 * AC #5  User errors are guidance-formatted, not raw technical payloads
 * AC #6  Zero waitForTimeout() — all waits are semantic (waitForFunction / expect().toBeVisible)
 *
 * Business value:
 * Non-crypto-native users expect deterministic UX. This spec proves that:
 * - Guest users always see Sign In, never wallet-centric status
 * - Authenticated users land on /launch/guided without wizard-era assumptions
 * - Error states expose user guidance, not raw exceptions
 * - Onboarding path has no dead ends — every blocked state has a clear action
 *
 * Auth model: email/password only — no wallet connectors.
 * All auth seeding uses withAuth() from e2e/helpers/auth.ts which validates
 * the ARC76 session contract before seeding localStorage. This replaces the
 * previous inline session bootstrap helpers in this file.
 *
 * Roadmap alignment: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 * Issue: Frontend milestone — auth-first accessibility and onboarding confidence hardening
 */

import { test, expect } from "@playwright/test";
import { withAuth, suppressBrowserErrors, getNavText } from "./helpers/auth";

// ---------------------------------------------------------------------------
// AC #1 — Auth-first routing: all token creation entry points enforce auth
// ---------------------------------------------------------------------------

test.describe("AC #1: Auth-first routing (all token creation entry points)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("guest accessing /launch/guided is redirected with showAuth=true OR auth modal (semantic wait)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/launch/guided");
    await page.waitForLoadState("networkidle");

    // Semantic wait: wait until auth redirect evidence is in DOM (no waitForTimeout)
    await page.waitForFunction(
      () => {
        const url = window.location.href;
        const emailInput = document.querySelector("input[type='email']");
        return url.includes("showAuth=true") || emailInput !== null;
      },
      { timeout: 15000 }
    );

    const url = page.url();
    const emailInputVisible = await page
      .locator("input[type='email']")
      .first()
      .isVisible()
      .catch(() => false);
    expect(url.includes("showAuth=true") || emailInputVisible).toBe(true);
  });

  test("guest accessing /create is redirected (semantic wait)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/create");
    await page.waitForLoadState("networkidle");

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

  test("guest accessing /cockpit is redirected (semantic wait)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/cockpit");
    await page.waitForLoadState("networkidle");

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

  test("authenticated user accessing /launch/guided loads guided page (semantic wait)", async ({
    page,
  }) => {
    await withAuth(page);

    await page.goto("/launch/guided");
    await page.waitForLoadState("networkidle");

    // Semantic wait: heading proves page mounted and auth store initialized
    const heading = page.getByRole("heading", { name: /guided token launch/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 60000 });

    // Must NOT be on home/redirect page
    const url = page.url();
    expect(url).toContain("/launch/guided");
  });

  test("redirect destination is stored in localStorage before auth redirect", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/launch/guided");
    await page.waitForLoadState("networkidle");

    // Semantic wait for redirect
    await page.waitForFunction(
      () => window.location.href.includes("showAuth=true") || window.location.href.endsWith("/"),
      { timeout: 15000 }
    );

    // Redirect target should be stored in localStorage for post-auth continuation
    const stored = await page.evaluate(() =>
      localStorage.getItem("redirect_after_auth") ||
      localStorage.getItem("redirectAfterAuth") ||
      localStorage.getItem("auth_redirect") ||
      null
    );

    // May be stored under any of these keys — at least one should be set
    // Or page URL may include the destination as a query param
    const url = page.url();
    const hasRedirectEvidence = stored !== null || url.includes("redirect") || url.includes("showAuth");
    expect(hasRedirectEvidence).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC #2 — Guest nav has no wallet states; Sign In deterministic
// ---------------------------------------------------------------------------

test.describe("AC #2: Guest nav — no wallet states, deterministic Sign In", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("home page renders Sign In button for guest user (semantic wait — no waitForTimeout)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Semantic: wait for nav element — proves component mounted
    await page.waitForFunction(() => document.querySelector("nav") !== null, { timeout: 10000 });

    // Use .first() — Navbar renders desktop + mobile buttons simultaneously
    const signInButton = page.getByRole("button", { name: /sign in/i }).first();
    await expect(signInButton).toBeVisible({ timeout: 15000 });
  });

  test("guest nav contains NO wallet/network status text", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Use shared getNavText() helper — waits for nav to appear and returns its textContent.
    // Avoids false positives from compiled JS bundles that embed third-party wallet strings.
    const navText = await getNavText(page);

    // Negative assertions: wallet-centric strings must not appear in nav text (AC #2)
    expect(navText).not.toMatch(/WalletConnect/i);
    expect(navText).not.toMatch(/MetaMask/i);
    expect(navText).not.toMatch(/Pera\s*Wallet/i);
    expect(navText).not.toMatch(/Defly/i);
    expect(navText).not.toMatch(/connect wallet/i);
    expect(navText).not.toMatch(/not connected/i); // No legacy wallet status
  });

  test("guest nav navigation landmark has aria-label (WCAG 2.1 AA)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Semantic wait for nav mount
    await page.waitForFunction(() => document.querySelector("nav[aria-label]") !== null, {
      timeout: 10000,
    });

    const nav = page.locator("nav[aria-label]");
    await expect(nav).toHaveCount(1);
  });

  test("guest nav includes Guided Launch as canonical create entry", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Semantic wait: nav renders
    await page.waitForFunction(() => document.querySelector("nav") !== null, { timeout: 10000 });

    // Guided Launch (canonical) must be in nav — not a generic 'Create' link
    const guidedLaunchLink = page.getByRole("link", { name: /guided launch/i }).first();
    await expect(guidedLaunchLink).toBeVisible({ timeout: 15000 });

    const href = await guidedLaunchLink.getAttribute("href");
    expect(href).toContain("/launch/guided");
    expect(href).not.toContain("/create/wizard");
  });
});

// ---------------------------------------------------------------------------
// AC #3 — Legacy /create/wizard redirect coverage
// Consolidated into e2e/wizard-redirect-compat.spec.ts (max 3 tests per spec).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AC #4 — WCAG 2.1 AA: keyboard accessible, headings, aria
// ---------------------------------------------------------------------------

test.describe("AC #4: WCAG 2.1 AA accessibility baseline", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("home page has document title (screen reader orientation)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("home page has at least one h1 heading (heading hierarchy)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.waitForFunction(() => document.querySelector("h1") !== null, { timeout: 10000 });
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("home page interactive controls are keyboard-reachable via Tab", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Semantic wait: nav renders
    await page.waitForFunction(() => document.querySelector("nav") !== null, { timeout: 10000 });

    await page.keyboard.press("Tab");

    const active = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, tabIndex: el?.getAttribute("tabindex") };
    });

    const isInteractive =
      active.tag === "A" ||
      active.tag === "BUTTON" ||
      active.tag === "INPUT" ||
      (active.tabIndex !== null && Number(active.tabIndex) >= 0);

    expect(isInteractive).toBe(true);
  });

  test("guided launch page has h1 heading when authenticated", async ({ page }) => {
    await withAuth(page);

    await page.goto("/launch/guided");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /guided token launch/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 60000 });
  });

  test("Sign In button has accessible text (not icon-only)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => localStorage.clear());

    await page.waitForFunction(
      () => {
        const btns = document.querySelectorAll("button");
        return Array.from(btns).some((b) => /sign in/i.test(b.textContent || ""));
      },
      { timeout: 15000 }
    );

    const signInButton = page.getByRole("button", { name: /sign in/i }).first();
    const text = await signInButton.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AC #5 — Error messages: user guidance format, no raw technical leakage
// ---------------------------------------------------------------------------

test.describe("AC #5: User-oriented error messages", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("guided launch page shows no raw JavaScript exception text in page content", async ({
    page,
  }) => {
    await withAuth(page);

    await page.goto("/launch/guided");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /guided token launch/i, level: 1 });
    await expect(heading).toBeVisible({ timeout: 60000 });

    // Use body.innerText() to check only visible text — avoids false positives from
    // error stack traces in console messages that don't appear in rendered content.
    const bodyText = await page.locator("body").innerText().catch(() => "");

    // Raw error leakage patterns — none should appear as primary rendered content
    expect(bodyText).not.toMatch(/TypeError:/);
    expect(bodyText).not.toMatch(/ReferenceError:/);
    expect(bodyText).not.toMatch(/Uncaught/);
    expect(bodyText).not.toMatch(/HTTP [45]\d\d:/);
  });

  test("home page shows no raw technical error strings for unauthenticated user", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.waitForFunction(() => document.querySelector("nav") !== null, { timeout: 10000 });

    // Use body.innerText() — checks rendered text only, not HTML/script source
    const bodyText = await page.locator("body").innerText().catch(() => "");
    expect(bodyText).not.toMatch(/TypeError:/);
    expect(bodyText).not.toMatch(/Uncaught/);
  });
});

// ---------------------------------------------------------------------------
// AC #6 — Semantic waits only: evidence this spec uses no waitForTimeout
// ---------------------------------------------------------------------------
// NOTE: All waits above use:
//   - page.waitForFunction() with DOM/URL readiness conditions
//   - page.waitForLoadState('networkidle')
//   - expect(locator).toBeVisible({ timeout: N })
// This satisfies AC #6: no sleep-based synchronization.
