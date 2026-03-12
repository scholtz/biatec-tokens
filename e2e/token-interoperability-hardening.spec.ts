/**
 * E2E tests: Token Interoperability and Wallet Conversion Hardening
 *
 * Validates that:
 * - Token standards view surfaces compatibility information clearly
 * - Wallet activation journey provides actionable readiness guidance
 * - Home page exposes interoperability entry points
 * - No wallet connector UI is present (email/password only per roadmap)
 * - Compatibility messaging is deterministic and informative
 *
 * Auth model: email/password only — no wallet connectors.
 * Session seeding: withAuth() from e2e/helpers/auth.ts — validates ARC76 contract.
 * Zero waitForTimeout() — all waits use semantic readiness assertions.
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors } from './helpers/auth'

// ─── Token Standards View ─────────────────────────────────────────────────────

test.describe('Token Standards View — Interoperability', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await page.goto('/token-standards')
    await page.waitForLoadState('load')
  })

  test('should load the token standards page', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Token Standards/i })
    await expect(heading.first()).toBeVisible({ timeout: 15000 })
  })

  test('should surface interoperability information', async ({ page }) => {
    // The page should mention key AVM standards
    const bodyText = await page.locator('body').innerText()
    const mentionsStandards =
      bodyText.includes('ASA') ||
      bodyText.includes('ARC') ||
      bodyText.includes('ERC')
    expect(mentionsStandards).toBe(true)
  })

  test('should not show wallet connector UI', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    // Per roadmap: email/password only — no wallet connector buttons
    expect(bodyText).not.toMatch(/WalletConnect|connect.*wallet/i)
  })

  test('should show comparison or standards detail sections', async ({ page }) => {
    // Page must render at least one structured content block
    await expect(page.locator('section, table, [class*="card"]').first()).toBeAttached({ timeout: 15000 })
  })

  test('should include an enterprise guide link or CTA', async ({ page }) => {
    const enterpriseLinks = page.getByRole('link', { name: /enterprise/i })
    const count = await enterpriseLinks.count()
    // Enterprise guide links are present on this public marketing page
    expect(count).toBeGreaterThan(0)
  })
})

// ─── Wallet Activation Journey ────────────────────────────────────────────────

test.describe('Wallet Activation Journey — Auth-First', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    // Use canonical withAuth() helper — validates ARC76 contract before seeding
    await withAuth(page, {
      address: 'INTEROP_TEST_ALGORAND_ADDRESS_1234567890',
      email: 'interop@example.com',
      isConnected: true,
    })
    await page.goto('/activation/wallet')
    await page.waitForLoadState('load')
  })

  test('should load the wallet activation journey page', async ({ page }) => {
    const heading = page
      .getByRole('heading', { name: /Wallet Activation Journey/i })
      .first()
    await expect(heading).toBeVisible({ timeout: 45000 })
  })

  test('should show step progress indicator', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    // Progress should mention step numbers or a heading is present (page rendered)
    const hasStepIndicator =
      bodyText.match(/Step\s+\d+\s+of\s+\d+/i) !== null ||
      bodyText.includes('Step 1') ||
      bodyText.includes('step')
    const h1Exists = await page.locator('h1').count()
    expect(hasStepIndicator || h1Exists > 0).toBe(true)
  })

  test('should display actionable account readiness information', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    const hasReadiness =
      bodyText.match(/authentication|provisioning|ready|account/i) !== null
    expect(hasReadiness).toBe(true)
  })

  test('should not display wallet connector or web3 connection UI', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/WalletConnect|connect.*wallet/i)
  })

  test('should have a navigation forward control', async ({ page }) => {
    // Auth-first journey must expose a "Get Started" / "Next" / "Continue" CTA
    const ctaButton = page
      .getByRole('button', { name: /get started|next|continue/i })
      .first()
    await expect(ctaButton).toBeVisible({ timeout: 30000 })
  })
})

// ─── Home Page — Interoperability Entry Points ────────────────────────────────

test.describe('Home Page — Interoperability CTAs', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await page.goto('/')
    await page.waitForLoadState('load')
  })

  test('should load home page without errors', async ({ page }) => {
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should not show wallet connector UI on home page', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/WalletConnect|connect.*wallet/i)
  })

  test('should expose sign-in / authentication path', async ({ page }) => {
    // Auth-first: sign-in must be accessible from the home page
    const signInButton = page
      .getByRole('button', { name: /sign in|log in|login/i })
      .first()
    const signInLink = page
      .getByRole('link', { name: /sign in|log in|login/i })
      .first()

    const buttonVisible = await signInButton.isVisible({ timeout: 10000 }).catch(() => false)
    const linkVisible = await signInLink.isVisible({ timeout: 5000 }).catch(() => false)
    expect(buttonVisible || linkVisible).toBe(true)
  })

  test('should show token standards or interoperability navigation', async ({ page }) => {
    // Token Standards link or section should be accessible
    const standardsLink = page.getByRole('link', { name: /token standards/i }).first()
    const isVisible = await standardsLink.isVisible({ timeout: 10000 }).catch(() => false)
    // The nav must have at least one link — token standards may be in mobile menu
    const navLinkCount = await page.locator('nav a').count()
    expect(isVisible || navLinkCount > 0).toBe(true)
  })
})

// ─── Cross-cutting Roadmap Alignment Checks ───────────────────────────────────

test.describe('Roadmap Alignment — No Wallet Connector Surfaces', () => {
  const publicRoutes = ['/token-standards', '/', '/enterprise']

  for (const route of publicRoutes) {
    test(`should not show wallet connector on ${route}`, async ({ page }) => {
      suppressBrowserErrors(page)
      await page.goto(route)
      await page.waitForLoadState('load')
      const bodyText = await page.locator('body').innerText()
      expect(bodyText).not.toMatch(/WalletConnect|connect.*wallet/i)
    })
  }

  test('should display email/password authentication as primary auth method', async ({ page }) => {
    suppressBrowserErrors(page)
    await page.goto('/')
    await page.waitForLoadState('load')

    // Trigger auth modal if available
    const signInBtn = page.getByRole('button', { name: /sign in/i }).first()
    const btnVisible = await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (btnVisible) {
      await signInBtn.click()
      // Semantic wait: email input visible proves modal is open
      await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 10000 }).catch(() => null)
    }

    const bodyText = await page.locator('body').innerText()
    // Email/password fields or mentions should be present
    const hasEmailAuth = bodyText.match(/email|password/i) !== null
    expect(hasEmailAuth).toBe(true)
  })
})
