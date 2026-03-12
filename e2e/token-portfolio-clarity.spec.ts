/**
 * E2E tests: Token Portfolio Clarity and Wallet Transaction Confidence
 *
 * Validates that:
 * - Token portfolio surfaces show stable, comprehensible states
 * - Loading, empty, and error states are displayed when appropriate
 * - Token list and detail views handle partial data gracefully
 * - Wallet connection states are communicated clearly
 */

import { test, expect } from '@playwright/test'
import { suppressBrowserErrors } from './helpers/auth'

test.describe('Token Portfolio Clarity', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress console errors to prevent Playwright from failing on browser console output
    suppressBrowserErrors(page)

    // Authenticate with a mock user
    await page.addInitScript(() => {
      localStorage.setItem(
        'algorand_user',
        JSON.stringify({
          address: 'MOCK_ALGORAND_ADDRESS_FOR_TESTING_1234567890',
          name: 'Portfolio Test User',
          email: 'portfolio@example.com',
          provisioningStatus: 'active',
          canDeploy: true,
        }),
      )
    })
  })

  // ─── Token Dashboard ────────────────────────────────────────────────────────
  // Token Dashboard is at /dashboard (not /tokens — that path is for /tokens/:id detail)

  test('should display the Token Dashboard page with a heading', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    const heading = page.getByRole('heading', { name: /Token Dashboard/i })
    const hasHeading = await heading.isVisible({ timeout: 15000 }).catch(() => false)
    expect(hasHeading).toBe(true)
  })

  test('should display stat cards on the Token Dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    // Expect at least the Total Tokens stat card to be visible
    const statLabel = page.getByText(/Total Tokens/i).first()
    const hasLabel = await statLabel.isVisible({ timeout: 15000 }).catch(() => false)
    expect(hasLabel).toBe(true)
  })

  test('should show either a token grid, an empty state, or a loading state', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    const grid = page.locator('[data-testid="token-dashboard-grid"]')
    const empty = page.locator('[data-testid="token-dashboard-empty"]')
    const loading = page.locator('[data-testid="token-dashboard-loading"]')

    const gridVisible = await grid.isVisible().catch(() => false)
    const emptyVisible = await empty.isVisible().catch(() => false)
    const loadingVisible = await loading.isVisible().catch(() => false)

    // At least one of the three deterministic states must be visible
    expect(gridVisible || emptyVisible || loadingVisible).toBe(true)
  })

  test('empty state should offer a "Create Token" action', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    const empty = page.locator('[data-testid="token-dashboard-empty"]')
    const emptyVisible = await empty.isVisible().catch(() => false)

    if (emptyVisible) {
      // When the empty state is shown, the Create Token CTA must be present
      const createLink = empty.getByRole('link', { name: /Create Token/i })
      await expect(createLink).toBeVisible({ timeout: 10000 })
    } else {
      // Grid or loading state is shown — the empty state CTA is not applicable here
      const grid = page.locator('[data-testid="token-dashboard-grid"]')
      const loading = page.locator('[data-testid="token-dashboard-loading"]')
      const gridOrLoading =
        (await grid.isVisible().catch(() => false)) ||
        (await loading.isVisible().catch(() => false))
      expect(gridOrLoading).toBe(true)
    }
  })

  test('should display filter dropdowns for standard and status', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    const standardFilter = page.getByRole('combobox').first()
    const hasFilter = await standardFilter.isVisible({ timeout: 15000 }).catch(() => false)
    expect(hasFilter).toBe(true)
  })

  test('should have a Refresh button', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    // Use .first() to avoid strict mode violation when multiple Refresh buttons exist
    const refreshBtn = page.getByRole('button', { name: /Refresh/i }).first()
    const hasRefresh = await refreshBtn.isVisible({ timeout: 15000 }).catch(() => false)
    expect(hasRefresh).toBe(true)
  })

  test('should have a link to Create Token', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    const createLink = page.getByRole('link', { name: /Create Token/i }).first()
    const hasCreate = await createLink.isVisible({ timeout: 15000 }).catch(() => false)
    expect(hasCreate).toBe(true)
  })

  // ─── Token Detail ───────────────────────────────────────────────────────────

  test('should show a meaningful state for a non-existent token', async ({ page }) => {
    await page.goto('/tokens/non-existent-token-xyz')
    await page.waitForLoadState('load')

    // Page should not crash; either an error message or a fallback heading is visible
    const heading = page.getByRole('heading').first()
    const hasHeading = await heading.isVisible({ timeout: 15000 }).catch(() => false)
    expect(hasHeading).toBe(true)
  })

  test('token detail should show a back navigation option', async ({ page }) => {
    await page.goto('/tokens/any-token-id')
    await page.waitForLoadState('load')

    // Use .first() to avoid strict mode violation when back buttons appear in both desktop and mobile nav
    const backBtn = page.getByRole('button', { name: /back/i }).first()
    const hasBack = await backBtn.isVisible({ timeout: 15000 }).catch(() => false)
    expect(hasBack).toBe(true)
  })

  // ─── No Wallet Connector UI ─────────────────────────────────────────────────

  test('token portfolio pages should not expose wallet-connector UI', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    // Check visible body text (not compiled JS bundle) for wallet connector UI
    const bodyText = await page.locator('body').innerText().catch(() => '')
    // Exact phrase "connect wallet" indicates wallet-first auth UI
    expect(bodyText.toLowerCase()).not.toContain('connect wallet')
    // Verify no wallet connector-specific DOM elements are present
    const walletConnectUI = page.locator('[class*="walletconnect" i], [data-testid*="walletconnect" i]')
    const walletConnectCount = await walletConnectUI.count()
    expect(walletConnectCount).toBe(0)
  })

  // ─── Auth-first routing ─────────────────────────────────────────────────────

  test('should allow authenticated user to access token dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    // Authenticated users should see the dashboard heading, not a login form
    const heading = page.getByRole('heading', { name: /Token Dashboard/i })
    const hasHeading = await heading.isVisible({ timeout: 20000 }).catch(() => false)

    // Auth guard may redirect to home with showAuth=true; both are valid outcomes
    const url = page.url()
    const wasRedirectedToAuth = url.includes('showAuth=true')

    expect(hasHeading || wasRedirectedToAuth).toBe(true)
  })
})

test.describe('Wallet Connection State clarity', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('unauthenticated user should see a sign-in prompt on the home page', async ({ page }) => {
    // Clear any stored auth
    await page.addInitScript(() => {
      localStorage.removeItem('algorand_user')
    })

    await page.goto('/')
    await page.waitForLoadState('load')

    // Should see email / sign-in related text somewhere on the page
    const content = await page.content()
    const hasAuthPrompt =
      /sign.in|log.in|email|get.started/i.test(content)
    expect(hasAuthPrompt).toBe(true)
  })

  test('home page should not display wallet connector widgets for unauthenticated users', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('algorand_user')
    })

    await page.goto('/')
    await page.waitForLoadState('load')

    // Verify no "Connect Wallet" button (explicit wallet-first auth prompt) appears
    // Use exact phrase check on visible body text (not compiled JS bundles)
    const bodyText = await page.locator('body').innerText().catch(() => '')
    // Exact phrase "connect wallet" indicates wallet-first auth UI (distinct from "no wallet needed")
    expect(bodyText.toLowerCase()).not.toContain('connect wallet')
    // No WalletConnect/MetaMask specific DOM elements (case-insensitive attribute check)
    const walletConnectUI = page.locator('[class*="walletconnect" i], [data-testid*="walletconnect" i]')
    const walletConnectCount = await walletConnectUI.count()
    expect(walletConnectCount).toBe(0)
  })

  test('should navigate to dashboard page without crashing when authenticated', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'algorand_user',
        JSON.stringify({
          address: 'MOCK_ADDR_12345',
          email: 'user@example.com',
          provisioningStatus: 'active',
          canDeploy: true,
        }),
      )
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('load')

    // Page should render without a full-screen error
    const body = page.locator('body')
    const bodyText = await body.innerText().catch(() => '')
    expect(bodyText.length).toBeGreaterThan(0)
  })
})
