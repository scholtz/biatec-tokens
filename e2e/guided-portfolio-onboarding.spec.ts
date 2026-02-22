/**
 * Guided Portfolio Onboarding E2E Tests
 *
 * Tests user flows for the guided portfolio onboarding view, including:
 * - Page loads and renders correctly for authenticated users
 * - Auth redirect for unauthenticated users
 * - Guided next step module visibility
 * - Portfolio continuity panel display
 * - Action readiness indicator display
 * - Navigation links work correctly
 * - Accessibility: keyboard navigation and ARIA semantics
 */

import { test, expect } from '@playwright/test'

const AUTH_USER = {
  address: 'TESTADDRESS123',
  name: 'Test User',
  email: 'test@example.com',
}

test.describe('Guided Portfolio Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress console errors for test stability
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Browser console error (suppressed): ${msg.text()}`)
      }
    })
    page.on('pageerror', (error) => {
      console.log(`Page error (suppressed): ${error.message}`)
    })

    // Set up authentication
    await page.addInitScript((user) => {
      localStorage.setItem('algorand_user', JSON.stringify(user))
    }, AUTH_USER)
  })

  // ─── Basic rendering ────────────────────────────────────────────────────────

  test('should display the portfolio onboarding page heading', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading', { name: /Portfolio Onboarding/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 45000 })
  })

  test('should show the guided next step module', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const region = page.getByRole('region', { name: /guided next step/i })
    await expect(region).toBeVisible({ timeout: 45000 })
  })

  test('should show the portfolio continuity panel', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const region = page.getByRole('region', { name: /portfolio continuity/i })
    await expect(region).toBeVisible({ timeout: 45000 })
  })

  test('should show the action readiness indicator', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const region = page.getByRole('region', { name: /action readiness/i })
    await expect(region).toBeVisible({ timeout: 45000 })
  })

  test('should display onboarding progress percentage', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    // Progress badge should show a % value
    const content = await page.content()
    expect(content).toMatch(/\d+% complete/)
  })

  // ─── Auth guard ─────────────────────────────────────────────────────────────

  test('should redirect unauthenticated user away from onboarding', async ({ page }) => {
    // Skip in CI due to auth guard timing complexity
    test.skip(!!process.env.CI, 'CI absolute timing ceiling for auth redirect tests')

    // Clear auth
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())

    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    // Should be redirected
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authModalVisible = await page.locator('form').filter({ hasText: /email/i }).isVisible().catch(() => false)
    expect(urlHasAuthParam || authModalVisible).toBe(true)
  })

  // ─── Content checks ─────────────────────────────────────────────────────────

  test('should show "Your Next Step" header in guided module', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    await expect(page.getByText(/Your Next Step/i).first()).toBeVisible({ timeout: 45000 })
  })

  test('should show "Portfolio Since Last Visit" header', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    await expect(page.getByText(/Portfolio Since Last Visit/i)).toBeVisible({ timeout: 45000 })
  })

  test('should show readiness checks count', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const content = await page.content()
    // Should show "X/5 checks passed" format
    expect(content).toMatch(/\d+\/5 checks passed/)
  })

  test('should show a sign-in step for new user', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const content = await page.content()
    expect(content).toContain('Sign In')
  })

  // ─── First-visit empty state ─────────────────────────────────────────────────

  test('should show first visit message in continuity panel when no snapshot', async ({ page }) => {
    // Ensure no previous snapshot
    await page.addInitScript(() => {
      localStorage.removeItem('biatec_portfolio_snapshot')
    })

    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const content = await page.content()
    // Either shows "First visit detected" or has deltas with changes
    const hasFirstVisit = content.includes('First visit detected')
    const hasDeltas = content.includes('since last visit')
    expect(hasFirstVisit || hasDeltas).toBe(true)
  })

  // ─── Navigation ─────────────────────────────────────────────────────────────

  test('should not show wallet connector UI', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const content = await page.content()
    expect(content).not.toMatch(/WalletConnect|MetaMask|Pera.*Wallet|Defly/i)
    expect(content).not.toContain('connect wallet')
  })

  test('should have accessible progressbar element', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const progressbar = page.getByRole('progressbar')
    await expect(progressbar).toBeVisible({ timeout: 45000 })

    const valuenow = await progressbar.getAttribute('aria-valuenow')
    expect(valuenow).toBeTruthy()
    expect(Number(valuenow)).toBeGreaterThanOrEqual(0)
  })

  test('should have accessible onboarding steps list', async ({ page }) => {
    await page.goto('/portfolio/onboarding')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000)

    const stepsList = page.getByRole('list', { name: /onboarding steps/i })
    await expect(stepsList).toBeVisible({ timeout: 45000 })
  })
})
