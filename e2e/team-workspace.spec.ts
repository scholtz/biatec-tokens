/**
 * E2E Tests: Team Operations Workspace (/team/workspace)
 *
 * Tests navigation, queue sections, summary bar, role-aware messaging,
 * keyboard navigation, no-wallet-UI compliance, and mobile layout.
 *
 * Auth: email/password only via withAuth() helper (no wallet connectors).
 *
 * Timeout budget rationale (Section 7j):
 *   Vite is pre-warmed in globalSetup, so:
 *     goto = 10s, waitForLoadState = 5s, toBeVisible = 20s (16 tests × budget < 60s global)
 *   The "navigation contains no wallet connector UI" test uses / instead of
 *   /team/workspace to keep its budget well inside 60s (per Section 7j auth-heavy page rule).
 *
 *   The unauthenticated redirect test is in a separate describe block that does NOT
 *   call withAuth() — withAuth() registers addInitScript() which re-seeds auth on
 *   every page load, preventing the redirect from firing.
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, clearAuthScript, getNavText } from './helpers/auth'

const BASE = 'http://localhost:5173'
const WORKSPACE_URL = `${BASE}/team/workspace`

// ---------------------------------------------------------------------------
// Authenticated workspace tests
// ---------------------------------------------------------------------------

test.describe('Team Operations Workspace — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  // ── Navigation and heading ─────────────────────────────────────────────

  test('navigates to /team/workspace and shows workspace heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    const heading = page.getByRole('heading', { name: /Team Operations Workspace/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  test('page title contains meaningful text', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page).toHaveTitle(/.+/, { timeout: 10000 })
  })

  // ── Queue sections present ─────────────────────────────────────────────

  test('shows the "Awaiting My Review" section heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    const heading = page.getByRole('heading', { name: /Awaiting My Review/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  test('shows the "Assigned to My Team" section heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    const heading = page.getByRole('heading', { name: /Assigned to My Team/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  test('shows the "Ready for Approval" section heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    const heading = page.getByRole('heading', { name: /Ready for Approval/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  test('shows the "Recently Completed" section heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    const heading = page.getByRole('heading', { name: /Recently Completed/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  // ── Summary bar ────────────────────────────────────────────────────────

  test('shows the summary count bar', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Team Operations Workspace/i })).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-testid="summary-bar"]')).toBeVisible({ timeout: 5000 })
  })

  test('summary bar shows Pending label', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await page.locator('[data-testid="pending-count-badge"]').waitFor({ state: 'visible', timeout: 20000 })
    await expect(page.locator('[data-testid="pending-count-badge"]')).toContainText(/Pending/i)
  })

  test('summary bar shows In Review label', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await page.locator('[data-testid="in-review-count-badge"]').waitFor({ state: 'visible', timeout: 20000 })
    await expect(page.locator('[data-testid="in-review-count-badge"]')).toContainText(/In Review/i)
  })

  test('summary bar shows Completed label', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await page.locator('[data-testid="completed-count-badge"]').waitFor({ state: 'visible', timeout: 20000 })
    await expect(page.locator('[data-testid="completed-count-badge"]')).toContainText(/Completed/i)
  })

  // ── No-wallet-UI compliance ────────────────────────────────────────────
  //
  // Section 7j: nav check uses / (home) instead of /team/workspace to avoid
  // auth-heavy onMounted triggering and stay well within 60s global budget.
  // The nav component is identical on every page.

  test('navigation contains no wallet connector UI', async ({ page }) => {
    // Use home page — same nav component, no auth-heavy onMounted operations
    await page.goto(BASE, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    const navText = await getNavText(page)
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('workspace body contains no wallet connector brand names', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Team Operations Workspace/i })).toBeVisible({ timeout: 20000 })
    const bodyText = await page.locator('[data-testid="team-workspace"]').textContent({ timeout: 10000 }).catch(() => '')
    expect(bodyText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  // ── Keyboard navigation ────────────────────────────────────────────────

  test('skip-to-main-content link is present in the DOM', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Team Operations Workspace/i })).toBeVisible({ timeout: 20000 })
    expect(await page.locator('[data-testid="skip-to-main"]').count()).toBe(1)
  })

  test('skip-to-main link points to #workspace-main', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Team Operations Workspace/i })).toBeVisible({ timeout: 20000 })
    const href = await page.locator('[data-testid="skip-to-main"]').getAttribute('href', { timeout: 5000 })
    expect(href).toBe('#workspace-main')
  })

  test('Tab key moves focus between interactive elements', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Team Operations Workspace/i })).toBeVisible({ timeout: 20000 })
    await page.locator('body').click()
    await page.keyboard.press('Tab')
    const hasFocusedElement = await page.evaluate(() => {
      const active = document.activeElement
      return active !== null && active !== document.body && active !== document.documentElement
    })
    expect(hasFocusedElement).toBe(true)
  })

  // ── Collapse/expand recently completed ────────────────────────────────

  test('clicking Recently Completed toggle expands/collapses the section', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await page.locator('[data-testid="completed-section-toggle"]').waitFor({ state: 'visible', timeout: 20000 })

    const toggle = page.locator('[data-testid="completed-section-toggle"]')
    await toggle.click()
    // Semantic wait: aria-expanded must reflect the toggled state before asserting
    await expect(toggle).toHaveAttribute('aria-expanded', 'true', { timeout: 5000 })
  })

  // ── Mobile viewport ───────────────────────────────────────────────────

  test('workspace renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Team Operations Workspace/i })).toBeVisible({ timeout: 20000 })
  })

  // ── Work item cards ───────────────────────────────────────────────────

  test('work item cards are rendered in the workspace', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Team Operations Workspace/i })).toBeVisible({ timeout: 20000 })
    // Store initializes with 8 mock items; some should appear in queue sections
    const cards = page.locator('[data-testid^="work-item-card-"]')
    await cards.first().waitFor({ state: 'attached', timeout: 15000 })
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('View Details links have contextPath hrefs', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Team Operations Workspace/i })).toBeVisible({ timeout: 20000 })

    const links = page.locator('[data-testid^="view-details-"]').first()
    const isPresent = await links.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false)
    if (isPresent) {
      const href = await links.getAttribute('href', { timeout: 5000 })
      expect(href).toBeTruthy()
      expect(href?.startsWith('/')).toBe(true)
    } else {
      // No items in queue sections — verify empty state messages appear instead
      const emptyState = page.locator('[data-testid^="empty-state-"]').first()
      const hasEmptyState = await emptyState.waitFor({ state: 'attached', timeout: 5000 }).then(() => true).catch(() => false)
      expect(hasEmptyState).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Unauthenticated redirect — separate describe with NO withAuth() in beforeEach
// (withAuth registers addInitScript that re-seeds auth on every navigation,
// preventing the router guard redirect from firing in the same test context)
// ---------------------------------------------------------------------------

test.describe('Team Operations Workspace — unauthenticated redirect', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    // Use clearAuthScript (addInitScript variant) so auth is cleared on every page load
    await clearAuthScript(page)
  })

  test('redirects unauthenticated users away from /team/workspace', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    // Semantic wait: poll until URL changes or auth surface appears
    await page.waitForFunction(
      () => {
        const url = window.location.href
        const redirectedAway = !url.includes('/team/workspace')
        const hasAuthParam = url.includes('showAuth=true')
        const showsAuthModal = !!document.querySelector('form')
        return redirectedAway || hasAuthParam || showsAuthModal
      },
      { timeout: 8000 },
    ).catch(() => {})

    const url = page.url()
    const redirectedAway = !url.includes('/team/workspace')
    const hasAuthParam = url.includes('showAuth=true')
    const showsAuthModal = await page
      .locator('form')
      .filter({ hasText: /email/i })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)

    expect(redirectedAway || showsAuthModal || hasAuthParam).toBe(true)
  })
})

