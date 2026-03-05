/**
 * E2E Tests: Compliance Delivery Slice — Auth-First Journey
 *
 * Validates the end-to-end compliance delivery pipeline from the user's perspective:
 *   - Unauthenticated users are routed to login at the pipeline entry point
 *   - Authenticated users see the correct step guidance
 *   - Navigation CTAs correctly reflect the pipeline step
 *   - No wallet connector UI appears at any pipeline stage
 *   - Compliance and launch routes are correctly protected
 *   - Product alignment: email/password only, backend-managed deployment
 *
 * Zero waitForTimeout() — all waits use semantic readiness assertions.
 *
 * Business value:
 *   Non-technical business operators need a predictable, deterministic path
 *   from sign-in to token delivery. This spec proves that path is stable in
 *   CI and correct at each stage gate.
 *
 * Roadmap alignment:
 *   https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 *
 * Issue: MVP next-step — deterministic auth/compliance delivery slice
 */

import { test, expect } from '@playwright/test';
import { loginWithCredentials, suppressBrowserErrors, clearAuthScript, getNavText } from './helpers/auth';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  suppressBrowserErrors(page);
});

// ---------------------------------------------------------------------------
// 1. Unauthenticated entry — pipeline forces auth
// ---------------------------------------------------------------------------

test.describe('Pipeline entry: unauthenticated user', () => {
  // Use addInitScript (pre-navigation) to clear auth — avoids the race condition
  // that caused CI timing failures when using post-navigation localStorage.clear().
  // clearAuthScript registers an initScript that runs before every page load.
  test.beforeEach(async ({ page }) => {
    await clearAuthScript(page);
  });

  test('guest accessing guided launch is redirected to auth (auth_required step)', async ({
    page,
  }) => {
    // No CI skip — clearAuthScript ensures auth is absent from the very first page load,
    // eliminating the auth-guard timing race that previously required skipping in CI.
    await page.goto('/launch/guided');
    await page.waitForLoadState('load');

    // Semantic wait: router guard completes one of three valid auth signals:
    //   1. URL query param `showAuth=true`   — router redirected to home with auth trigger
    //   2. Email input visible               — auth modal rendered in-page
    //   3. URL no longer contains /launch/guided — redirected elsewhere (home /)
    await page.waitForFunction(
      () => {
        const url = window.location.href;
        const emailInput = document.querySelector('input[type="email"]');
        return url.includes('showAuth=true') || emailInput !== null || !url.includes('/launch/guided');
      },
      { timeout: 20000 },
    );

    const url = page.url();
    const hasAuthParam = url.includes('showAuth=true');
    const emailInputVisible = await page
      .locator('input[type="email"]')
      .isVisible()
      .catch(() => false);
    expect(hasAuthParam || emailInputVisible || !url.includes('/launch/guided')).toBe(true);
  });

  test('guest accessing compliance setup is redirected to auth', async ({ page }) => {
    // No CI skip — same clearAuthScript fix applied here.
    await page.goto('/compliance/setup');
    await page.waitForLoadState('load');

    await page.waitForFunction(
      () => {
        const url = window.location.href;
        return (
          url.includes('showAuth=true') ||
          document.querySelector('input[type="email"]') !== null ||
          !url.includes('/compliance/setup')
        );
      },
      { timeout: 20000 },
    );

    const url = page.url();
    const hasAuthParam = url.includes('showAuth=true');
    const emailInputVisible = await page
      .locator('input[type="email"]')
      .isVisible()
      .catch(() => false);
    expect(hasAuthParam || emailInputVisible || !url.includes('/compliance/setup')).toBe(true);
  });

  test('homepage shows Sign In button (auth_required step is actionable)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const signIn = page.getByRole('button', { name: /sign in/i }).first();
    await expect(signIn).toBeVisible({ timeout: 15000 });
  });

  test('guest navigation contains no wallet connector text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // getNavText() waits for nav and returns textContent — avoids compiled-bundle false positives
    const navText = await getNavText(page);
    expect(navText).not.toMatch(/not connected/i);
    expect(navText).not.toMatch(/WalletConnect|Pera Wallet|Defly|MetaMask/i);
  });
});

// ---------------------------------------------------------------------------
// 2. Authenticated user — pipeline advances beyond auth_required
// ---------------------------------------------------------------------------

test.describe('Pipeline: authenticated user access', () => {
  test.beforeEach(async ({ page }) => {
    // Critical compliance journey: use loginWithCredentials for backend-verified auth
    // Falls back to contract-validated localStorage seeding when backend unavailable.
    await loginWithCredentials(page);
  });

  test('authenticated user can reach guided launch (past auth_required step)', async ({
    page,
  }) => {
    await page.goto('/launch/guided');
    await page.waitForLoadState('load');

    // Semantic wait: page title heading must be present
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 45000 });

    // Must not be redirected to login
    const url = page.url();
    expect(url).not.toContain('showAuth=true');
  });

  test('authenticated user can reach compliance setup workspace', async ({ page }) => {
    await page.goto('/compliance/setup');
    await page.waitForLoadState('load');

    // Semantic wait: any heading must appear on the compliance setup page
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 30000 });

    const url = page.url();
    expect(url).not.toContain('showAuth=true');
  });

  test('authenticated user navigation contains no wallet connector text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // getNavText() waits for nav and returns textContent — avoids compiled-bundle false positives
    const navText = await getNavText(page);
    expect(navText).not.toMatch(/not connected/i);
    expect(navText).not.toMatch(/WalletConnect|Pera Wallet|Defly|MetaMask/i);
  });

  test('authenticated dashboard loads (deployment tracking step available)', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('load');

    // Semantic wait: any heading visible (dashboard is behind auth)
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 30000 });
  });
});

// ---------------------------------------------------------------------------
// 3. Product alignment — email/password only, no signing UI
// ---------------------------------------------------------------------------

test.describe('Product alignment: email/password-only, backend deployment', () => {
  test('homepage contains Sign In — not wallet connector or address display', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const signIn = page.getByRole('button', { name: /sign in/i }).first();
    await expect(signIn).toBeVisible({ timeout: 15000 });

    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText).not.toMatch(/approve in wallet/i);
    expect(bodyText).not.toMatch(/sign transaction/i);
    expect(bodyText).not.toMatch(/connect wallet/i);
  });

  test('guided launch page (authenticated) shows no wallet-signing UI', async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto('/launch/guided');
    await page.waitForLoadState('load');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 45000 });

    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText).not.toMatch(/approve in wallet/i);
    expect(bodyText).not.toMatch(/sign transaction/i);
  });
});

// ---------------------------------------------------------------------------
// 4. Canonical routes are reachable and stable
// ---------------------------------------------------------------------------

test.describe('Canonical route stability', () => {
  test('/launch/guided resolves without 404 (authenticated)', async ({ page }) => {
    await loginWithCredentials(page);
    const response = await page.goto('/launch/guided');
    expect(response?.status()).not.toBe(404);
  });

  test('/compliance/setup resolves without 404 (authenticated)', async ({ page }) => {
    await loginWithCredentials(page);
    const response = await page.goto('/compliance/setup');
    expect(response?.status()).not.toBe(404);
  });

  test('/dashboard resolves without 404 (authenticated)', async ({ page }) => {
    await loginWithCredentials(page);
    const response = await page.goto('/dashboard');
    expect(response?.status()).not.toBe(404);
  });

  test('/launchpad resolves without 404 (public)', async ({ page }) => {
    const response = await page.goto('/launchpad');
    expect(response?.status()).not.toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 5. Accessibility: key pipeline steps have ARIA roles
// ---------------------------------------------------------------------------

test.describe('Accessibility: pipeline entry points', () => {
  test('homepage has a main landmark and Sign In button with correct ARIA role', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Main landmark
    const main = page.getByRole('main');
    await expect(main).toBeVisible({ timeout: 10000 });

    // Sign In has role=button
    const signIn = page.getByRole('button', { name: /sign in/i }).first();
    await expect(signIn).toBeVisible({ timeout: 10000 });
  });

  test('guided launch (authenticated) has a main landmark', async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto('/launch/guided');
    await page.waitForLoadState('load');

    const main = page.getByRole('main');
    await expect(main).toBeVisible({ timeout: 30000 });
  });
});
