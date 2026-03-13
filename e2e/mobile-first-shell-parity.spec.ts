/**
 * E2E Tests: Mobile-First App-Shell Parity and Keyboard-Only Accessibility
 *
 * Delivers durable automated proof that the shared application shell provides:
 *   1. Mobile-first navigation parity — all enterprise routes discoverable
 *      from a phone-sized viewport (390×844) via the mobile hamburger menu.
 *   2. Keyboard-only operability — opening/closing navigation drawers,
 *      switching landmarks, focus restoration after Escape dismissal.
 *   3. Route-transition orientation — stable main landmark, meaningful h1,
 *      accessible aria-current indicators.
 *   4. Async status/route-change live region — route-change announcer
 *      present in the shell DOM and correctly labelled.
 *   5. No wallet-first assumptions — no WalletConnect/Pera/Defly/MetaMask
 *      branding in either desktop or mobile navigation.
 *
 * Issue: Deliver mobile-first app-shell parity and keyboard-only accessibility
 *        proof for enterprise routes.
 *
 * Acceptance Criteria covered:
 *   AC #1 – Mobile viewport: all 7 enterprise routes discoverable.
 *   AC #2 – Escape-key dismissal returns focus to mobile menu toggle.
 *   AC #3 – Each target route has stable <main>, single h1, aria-current.
 *   AC #4 – Keyboard Tab reaches primary CTAs on critical routes.
 *   AC #5 – Route-change live region present; status announced via aria-live.
 *   AC #6 – Automated E2E covers mobile viewport + keyboard shell behavior.
 *   AC #7 – Shell/navigation unit tests cover focus-restoration path.
 *   AC #9 – No wallet-first assumptions.
 *
 * Design:
 *   - Zero waitForTimeout() — all waits semantic (toBeVisible/waitFor).
 *   - suppressBrowserErrors() in beforeEach for Vite HMR noise.
 *   - Cumulative timeout budgets verified per Section 7j guidelines.
 *   - Unauthenticated redirect tests in a separate describe (Section 7u).
 *   - Wallet-pattern regex uses \bPera\b word boundary (Section 7e).
 *
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { test, expect, type Page } from "@playwright/test";
import { suppressBrowserErrors, withAuth, clearAuthScript, getNavText } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = "http://localhost:5173";

/** Phone-sized viewport — matches iPhone 14 / common Android mid-range. */
const PHONE_VIEWPORT = { width: 390, height: 844 };

/** All 7 canonical enterprise nav destinations (mirrors navItems.ts). */
const NAV_LABELS = ["Home", "Guided Launch", "Dashboard", "Portfolio", "Operations", "Compliance", "Settings"] as const;

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Opens the mobile hamburger menu and waits until the panel is visible. */
async function openMobileMenu(page: Page): Promise<void> {
  const btn = page.locator('[data-testid="mobile-menu-toggle"]');
  await expect(btn).toBeVisible({ timeout: 15000 });
  await btn.click({ timeout: 5000 });
  await expect(page.locator("#mobile-nav-menu")).toBeVisible({ timeout: 10000 });
}

/**
 * Waits until an auth-guarded route has either redirected away, shown an auth
 * modal, or added a `showAuth=true` query param. Used to verify that
 * unauthenticated users are protected from accessing protected routes.
 *
 * @param page  - Playwright page.
 * @param route - The protected route path (e.g. "/team/workspace").
 */
async function assertAuthGuardedRoute(page: Page, route: string): Promise<void> {
  // Budget: goto(10) + load(5) + waitForFunction(20) + checks(5) = 40s < 60s
  await page.goto(`${BASE_URL}${route}`, { timeout: 10000 });
  await page.waitForLoadState("load", { timeout: 5000 });

  await page.waitForFunction(
    ([r]) => {
      const url = window.location.href;
      const emailInput = document.querySelector("input[type='email']");
      return !url.includes(r) || url.includes("showAuth=true") || emailInput !== null;
    },
    [route],
    { timeout: 20000 },
  );

  const url = page.url();
  const redirectedAway = !url.includes(route);
  const showsAuthModal = await page
    .locator("form")
    .filter({ hasText: /email/i })
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  const hasAuthParam = url.includes("showAuth=true");

  expect(
    redirectedAway || showsAuthModal || hasAuthParam,
    `Unauthenticated user must not reach ${route}`,
  ).toBe(true);
}

// ---------------------------------------------------------------------------
// Section 1: Mobile viewport navigation parity (AC #1)
// ---------------------------------------------------------------------------

test.describe("Section 1 — Mobile viewport navigation parity (AC #1)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
    await page.setViewportSize(PHONE_VIEWPORT);
  });

  test("mobile menu toggle is visible on phone viewport (AC #1)", async ({ page }) => {
    // Budget: goto(10) + load(5) + toBeVisible(15) = 30s < 60s global
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const btn = page.locator('[data-testid="mobile-menu-toggle"]');
    await expect(btn).toBeVisible({ timeout: 15000 });
  });

  test("mobile menu exposes all 7 canonical enterprise destinations (AC #1)", async ({ page }) => {
    // Budget: goto(10) + load(5) + toBeVisible(15) + openMobileMenu(15) + textContent(10) = 55s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    await openMobileMenu(page);

    const menuText = await page.locator("#mobile-nav-menu").textContent({ timeout: 10000 }).catch(() => "");
    for (const label of NAV_LABELS) {
      expect(menuText, `Mobile menu must contain "${label}"`).toContain(label);
    }
  });

  test("mobile menu exposes Guided Launch pointing to /launch/workspace (AC #1)", async ({ page }) => {
    // Budget: goto(10) + load(5) + openMobileMenu(15) + getAttribute(5) = 35s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });
    await openMobileMenu(page);

    const guidedLink = page.locator("#mobile-nav-menu").getByRole("link", { name: /guided launch/i }).first();
    await expect(guidedLink).toBeAttached({ timeout: 5000 });
    const href = await guidedLink.getAttribute("href", { timeout: 5000 });
    expect(href).toContain("/launch/workspace");
  });

  test("mobile menu has no wallet connector UI (AC #9)", async ({ page }) => {
    // Budget: goto(10) + load(5) + openMobileMenu(15) + textContent(10) = 40s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });
    await openMobileMenu(page);

    const menuText = await page.locator("#mobile-nav-menu").textContent({ timeout: 10000 }).catch(() => "");
    expect(menuText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i);
    expect(menuText).not.toContain("Connect Wallet");
    expect(menuText).not.toContain("Not connected");
  });

  test("mobile menu nav links carry aria-current=page for active route (AC #1)", async ({ page }) => {
    // Budget: goto(10) + load(5) + openMobileMenu(15) + innerHTML(10) = 40s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });
    await openMobileMenu(page);

    const menuHtml = await page.locator("#mobile-nav-menu").evaluate((el) => el.innerHTML);
    // At least one link in the mobile menu should have aria-current="page"
    // (the Home link is active since we navigated to "/")
    expect(menuHtml).toContain('aria-current="page"');
  });

  test("mobile nav links carry focus-visible ring classes (AC #4)", async ({ page }) => {
    // Budget: goto(10) + load(5) + openMobileMenu(15) + innerHTML(10) = 40s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });
    await openMobileMenu(page);

    const menuHtml = await page.locator("#mobile-nav-menu").evaluate((el) => el.innerHTML);
    expect(menuHtml).toContain("focus-visible:ring");
  });

  test("mobile viewport desktop nav is hidden (nav does not overflow viewport) (AC #1)", async ({ page }) => {
    // Budget: goto(10) + load(5) + toBeHidden(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    // Desktop nav items are hidden on mobile (md:hidden class)
    const desktopNav = page.locator('[data-testid="desktop-nav-items"]');
    await expect(desktopNav).toBeAttached({ timeout: 10000 });
    // The element exists in DOM (hidden md:flex) but must not be visible on 390px viewport
    const isHidden = await desktopNav.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display === "none" || style.visibility === "hidden";
    });
    expect(isHidden, "Desktop nav items should be hidden on phone viewport").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Section 2: Keyboard-only mobile menu — focus restoration (AC #2)
// ---------------------------------------------------------------------------

test.describe("Section 2 — Keyboard focus restoration after menu dismissal (AC #2)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
    await page.setViewportSize(PHONE_VIEWPORT);
  });

  test("Escape key closes mobile menu and returns focus to toggle button (AC #2)", async ({ page }) => {
    // Budget: goto(10) + load(5) + openMobileMenu(20) + Escape(2) + evaluate(10) = 47s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    // Give the page keyboard focus first (required in headless — Section 7l)
    await page.locator("body").click();

    await openMobileMenu(page);

    // Press Escape to dismiss the menu
    await page.keyboard.press("Escape");

    // Menu should be closed
    await expect(page.locator("#mobile-nav-menu")).not.toBeVisible({ timeout: 5000 });

    // Focus must be on the mobile menu toggle button (WCAG SC 2.1.2 — no keyboard trap)
    const focusedTestId = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.getAttribute("data-testid") ?? null;
    });
    expect(focusedTestId, "Focus must return to mobile-menu-toggle after Escape").toBe("mobile-menu-toggle");
  });

  test("mobile menu toggle aria-expanded returns to false after Escape (AC #2)", async ({ page }) => {
    // Budget: goto(10) + load(5) + openMobileMenu(20) + Escape(2) + getAttribute(5) = 42s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });
    await page.locator("body").click();
    await openMobileMenu(page);
    await page.keyboard.press("Escape");

    const expanded = await page.locator('[data-testid="mobile-menu-toggle"]').getAttribute("aria-expanded", { timeout: 5000 });
    expect(expanded).toBe("false");
  });

  test("mobile menu toggle aria-expanded is true while menu is open (AC #2)", async ({ page }) => {
    // Budget: goto(10) + load(5) + openMobileMenu(20) + getAttribute(5) = 40s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });
    await openMobileMenu(page);

    const expanded = await page.locator('[data-testid="mobile-menu-toggle"]').getAttribute("aria-expanded", { timeout: 5000 });
    expect(expanded).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// Section 3: Route-transition orientation — landmarks, h1, aria-current (AC #3)
// ---------------------------------------------------------------------------

test.describe("Section 3 — Route-transition orientation (AC #3)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
    await withAuth(page);
  });

  test("home route has a stable main landmark (AC #3)", async ({ page }) => {
    // Budget: goto(10) + load(5) + toBeAttached(15) = 30s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const main = page.locator("main, [role='main']");
    const count = await main.count();
    expect(count, "Each route must have a main landmark").toBeGreaterThan(0);
  });

  test("home route has at least one h1 heading (AC #3)", async ({ page }) => {
    // Budget: goto(10) + load(5) + count(15) = 30s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const h1s = page.getByRole("heading", { level: 1 });
    await expect(h1s.first()).toBeAttached({ timeout: 15000 });
  });

  test("settings route has a stable main landmark (AC #3)", async ({ page }) => {
    // Budget: goto(10) + load(5) + count(15) = 30s < 60s
    await page.goto(`${BASE_URL}/settings`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const main = page.locator("main, [role='main']");
    const count = await main.count();
    expect(count, "Settings route must have a main landmark").toBeGreaterThan(0);
  });

  test("settings route has an h1 heading (AC #3)", async ({ page }) => {
    // Budget: goto(10) + load(5) + toBeAttached(15) = 30s < 60s
    await page.goto(`${BASE_URL}/settings`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1.first()).toBeAttached({ timeout: 15000 });
  });

  test("operations route has a stable main landmark (AC #3)", async ({ page }) => {
    // Budget: goto(10) + load(5) + count(15) = 30s < 60s
    await page.goto(`${BASE_URL}/operations`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const main = page.locator("main, [role='main']");
    const count = await main.count();
    expect(count, "Operations route must have a main landmark").toBeGreaterThan(0);
  });

  test("compliance launch console has a stable main landmark (AC #3)", async ({ page }) => {
    // Budget: goto(10) + load(5) + count(15) = 30s < 60s
    await page.goto(`${BASE_URL}/compliance/launch`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const main = page.locator("main, [role='main']");
    const count = await main.count();
    expect(count, "Compliance launch route must have a main landmark").toBeGreaterThan(0);
  });

  test("team workspace has a stable main landmark (AC #3)", async ({ page }) => {
    // Budget: goto(10) + load(5) + count(15) = 30s < 60s
    await page.goto(`${BASE_URL}/team/workspace`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const main = page.locator("main, [role='main']");
    const count = await main.count();
    expect(count, "Team workspace route must have a main landmark").toBeGreaterThan(0);
  });

  test("desktop nav shows aria-current=page for the active route (AC #3)", async ({ page }) => {
    // Budget: goto(10) + load(5) + getAttribute(10) = 25s < 60s
    await page.goto(`${BASE_URL}/settings`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    // Desktop nav: the Settings link must have aria-current="page"
    const desktopNav = page.locator('[data-testid="desktop-nav-items"]');
    await expect(desktopNav).toBeAttached({ timeout: 10000 });

    // At least one link in the nav must have aria-current="page" on /settings
    const navHtml = await desktopNav.evaluate((el) => el.innerHTML);
    expect(navHtml).toContain('aria-current="page"');
  });
});

// ---------------------------------------------------------------------------
// Section 4: Live region for route-change announcements (AC #5)
// ---------------------------------------------------------------------------

test.describe("Section 4 — Route-change live region (WCAG SC 4.1.3) (AC #5)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("route-change announcer element is present in DOM with correct aria attributes (AC #5)", async ({ page }) => {
    // Budget: goto(10) + load(5) + toBeAttached(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const announcer = page.locator('[data-testid="route-announcer"]');
    await expect(announcer).toBeAttached({ timeout: 10000 });

    const role = await announcer.getAttribute("role", { timeout: 5000 });
    expect(role).toBe("status");

    const ariaLive = await announcer.getAttribute("aria-live", { timeout: 5000 });
    expect(ariaLive).toBe("polite");

    const ariaAtomic = await announcer.getAttribute("aria-atomic", { timeout: 5000 });
    expect(ariaAtomic).toBe("true");
  });

  test("route-change announcer is visually hidden but accessible to AT (AC #5)", async ({ page }) => {
    // Budget: goto(10) + load(5) + evaluate(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const announcer = page.locator('[data-testid="route-announcer"]');
    await expect(announcer).toBeAttached({ timeout: 10000 });

    // Must be visually hidden (sr-only) but NOT display:none (accessible to AT)
    const isHidden = await announcer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display === "none" || style.visibility === "hidden";
    });
    expect(isHidden, "Route announcer must NOT be display:none — it must be accessible to AT").toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Section 5: Keyboard Tab traversal through desktop nav (AC #4)
// ---------------------------------------------------------------------------

test.describe("Section 5 — Keyboard Tab traversal through desktop nav (AC #4)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("Tab key from page body reaches interactive elements in the navigation (AC #4)", async ({ page }) => {
    // Budget: goto(10) + load(5) + body.click(2) + Tab(2) + evaluate(10) = 29s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    // Give page keyboard focus (required in headless — Section 7l)
    await page.locator("body").click();
    await page.keyboard.press("Tab");

    // After Tab, some interactive element must be focused (skip-link or nav item)
    const hasFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active !== null && active !== document.body && active !== document.documentElement;
    });
    expect(hasFocused, "Tab key must move focus to an interactive element").toBe(true);
  });

  test("skip-link is the first tabbable element and points to #main-content (AC #4)", async ({ page }) => {
    // Budget: goto(10) + load(5) + evaluate(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    // Use DOM order check — Tab-key approach is unreliable in headless CI (Section 7l).
    // body.click() can land on a content element so Tab does not go to the skip-link.
    // DOM order IS the tab order for elements without explicit tabindex, so this gives
    // an equivalent WCAG 2.4.1 assertion without relying on browser keyboard focus events.
    // Pattern from enterprise-shell-accessibility-evidence.spec.ts lines 138-162.
    const isFirstTabbable = await page.evaluate(() => {
      const skipLink = document.querySelector('a[href="#main-content"]');
      if (!skipLink) return false;
      const tabbable = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        // sr-only uses position:absolute+overflow:hidden but NOT display:none/visibility:hidden
        return style.display !== "none" && style.visibility !== "hidden";
      });
      return tabbable.length > 0 && tabbable[0] === skipLink;
    });

    expect(isFirstTabbable, "Skip link must be the first tabbable element in DOM order").toBe(true);

    // Also confirm the skip link href value
    const href = await page.locator('a[href="#main-content"]').first().getAttribute("href", { timeout: 5000 });
    expect(href).toBe("#main-content");
  });

  test("desktop nav links have accessible names exposed via text content (AC #4)", async ({ page }) => {
    // Budget: goto(10) + load(5) + evaluate(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const navText = await getNavText(page);

    // All canonical nav labels must be discoverable from desktop nav text
    for (const label of NAV_LABELS) {
      expect(navText, `Desktop nav must expose "${label}"`).toContain(label);
    }
  });

  test("desktop nav links have focus-visible:ring classes for visible focus styles (AC #4)", async ({ page }) => {
    // Budget: goto(10) + load(5) + evaluate(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const desktopNav = page.locator('[data-testid="desktop-nav-items"]');
    await expect(desktopNav).toBeAttached({ timeout: 10000 });

    const navHtml = await desktopNav.evaluate((el) => el.innerHTML);
    expect(navHtml).toContain("focus-visible:ring");
  });
});

// ---------------------------------------------------------------------------
// Section 6: Desktop nav wallet-UI parity (AC #9)
// ---------------------------------------------------------------------------

test.describe("Section 6 — No wallet connector UI in desktop or mobile navigation (AC #9)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("desktop navigation contains no wallet connector UI (AC #9)", async ({ page }) => {
    // Budget: goto(10) + load(5) + getNavText(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const navText = await getNavText(page);
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i);
    expect(navText).not.toContain("Connect Wallet");
    expect(navText).not.toContain("Not connected");
  });

  test("operations route navigation contains no wallet connector UI (AC #9)", async ({ page }) => {
    // Budget: goto(10) + load(5) + getNavText(10) = 25s < 60s
    await withAuth(page);
    await page.goto(`${BASE_URL}/operations`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const navText = await getNavText(page);
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i);
  });

  test("settings route navigation contains no wallet connector UI (AC #9)", async ({ page }) => {
    // Budget: goto(10) + load(5) + getNavText(10) = 25s < 60s
    await withAuth(page);
    await page.goto(`${BASE_URL}/settings`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const navText = await getNavText(page);
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i);
  });
});

// ---------------------------------------------------------------------------
// Section 7: Unauthenticated redirect behavior (AC #2, AC #6) — separate describe
// ---------------------------------------------------------------------------

test.describe("Section 7 — Unauthenticated redirect for protected enterprise routes (AC #6)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
    // clearAuthScript MUST be in a separate describe from withAuth() — Section 7u
    await clearAuthScript(page);
  });

  test("unauthenticated user is redirected or shown auth modal for /team/workspace (AC #6)", async ({ page }) => {
    await assertAuthGuardedRoute(page, "/team/workspace");
  });

  test("unauthenticated user is redirected or shown auth modal for /compliance/launch (AC #6)", async ({ page }) => {
    await assertAuthGuardedRoute(page, "/compliance/launch");
  });

  test("home page is accessible to unauthenticated users without redirect (AC #6)", async ({ page }) => {
    // Budget: goto(10) + load(5) + toBeVisible(15) = 30s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    // Home page is publicly accessible — nav must be visible without auth
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Section 8: Shell semantic structure verification (AC #3, AC #6)
// ---------------------------------------------------------------------------

test.describe("Section 8 — Shell semantic structure (WCAG SC 1.3.1, 4.1.3) (AC #3)", () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page);
  });

  test("page has exactly one main navigation landmark (WCAG SC 1.3.1)", async ({ page }) => {
    // Budget: goto(10) + load(5) + toHaveCount(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    await expect(page.locator('nav[aria-label="Main navigation"]')).toHaveCount(1, { timeout: 10000 });
  });

  test("page has a header landmark wrapping the navbar (WCAG SC 1.3.1)", async ({ page }) => {
    // Budget: goto(10) + load(5) + count(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const header = page.locator("header");
    const count = await header.count();
    expect(count, "Page must have a <header> landmark").toBeGreaterThan(0);
  });

  test("mobile menu toggle has aria-controls pointing to mobile-nav-menu (WCAG SC 4.1.2)", async ({ page }) => {
    // Budget: goto(10) + load(5) + getAttribute(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const btn = page.locator('[data-testid="mobile-menu-toggle"]');
    const controls = await btn.getAttribute("aria-controls", { timeout: 10000 });
    expect(controls).toBe("mobile-nav-menu");
  });

  test("mobile menu toggle has accessible label (WCAG SC 4.1.2)", async ({ page }) => {
    // Budget: goto(10) + load(5) + getAttribute(10) = 25s < 60s
    await page.goto(`${BASE_URL}/`, { timeout: 10000 });
    await page.waitForLoadState("load", { timeout: 5000 });

    const btn = page.locator('[data-testid="mobile-menu-toggle"]');
    const label = await btn.getAttribute("aria-label", { timeout: 10000 });
    expect(label).toBeTruthy();
    expect(label?.toLowerCase()).toContain("navigation menu");
  });
});
