/**
 * E2E Tests: Team Operations Workspace (/team/workspace)
 *
 * Tests navigation, queue sections, summary bar, role-aware messaging,
 * keyboard navigation, no-wallet-UI compliance, and mobile layout.
 *
 * Auth: email/password only via withAuth() helper (no wallet connectors).
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, getNavText } from './helpers/auth'

const BASE = 'http://localhost:5173'
const WORKSPACE_URL = `${BASE}/team/workspace`

test.describe('Team Operations Workspace', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  // ── Navigation and heading ─────────────────────────────────────────────

  test('navigates to /team/workspace and shows workspace heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    const heading = page.getByRole('heading', { name: /Team Operations Workspace/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  test('page title contains meaningful text', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await expect(page).toHaveTitle(/.+/, { timeout: 10000 })
  })

  // ── Queue sections present ─────────────────────────────────────────────

  test('shows the "Awaiting My Review" section heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    const heading = page.getByRole('heading', { name: /Awaiting My Review/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  test('shows the "Assigned to My Team" section heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    const heading = page.getByRole('heading', { name: /Assigned to My Team/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  test('shows the "Ready for Approval" section heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    const heading = page.getByRole('heading', { name: /Ready for Approval/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  test('shows the "Recently Completed" section heading', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    const heading = page.getByRole('heading', { name: /Recently Completed/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  // ── Summary bar ────────────────────────────────────────────────────────

  test('shows the summary count bar', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="workspace-heading"]', { timeout: 20000 })
    const bar = page.locator('[data-testid="summary-bar"]')
    await expect(bar).toBeVisible({ timeout: 10000 })
  })

  test('summary bar shows Pending label', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="pending-count-badge"]', { timeout: 20000 })
    const badge = page.locator('[data-testid="pending-count-badge"]')
    await expect(badge).toContainText(/Pending/i)
  })

  test('summary bar shows In Review label', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="in-review-count-badge"]', { timeout: 20000 })
    const badge = page.locator('[data-testid="in-review-count-badge"]')
    await expect(badge).toContainText(/In Review/i)
  })

  test('summary bar shows Completed label', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="completed-count-badge"]', { timeout: 20000 })
    const badge = page.locator('[data-testid="completed-count-badge"]')
    await expect(badge).toContainText(/Completed/i)
  })

  // ── No-wallet-UI compliance ────────────────────────────────────────────

  test('navigation contains no wallet connector UI', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="workspace-heading"]', { timeout: 20000 })
    const navText = await getNavText(page)
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('page body contains no wallet connector brand names', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="workspace-heading"]', { timeout: 20000 })
    const bodyText = await page.locator('[data-testid="team-workspace"]').textContent({ timeout: 10000 }).catch(() => '')
    expect(bodyText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  // ── Unauthenticated redirect ───────────────────────────────────────────

  test('redirects unauthenticated users away from /team/workspace', async ({ page }) => {
    // Clear auth and try to access the protected route
    await page.goto(BASE, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.evaluate(() => localStorage.clear())

    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForTimeout(3000)

    const url = page.url()
    const redirectedAway = !url.includes('/team/workspace')
    const showsAuthModal = await page
      .locator('form')
      .filter({ hasText: /email/i })
      .first()
      .isVisible()
      .catch(() => false)
    const hasAuthParam = url.includes('showAuth=true')

    expect(redirectedAway || showsAuthModal || hasAuthParam).toBe(true)
  })

  // ── Keyboard navigation ────────────────────────────────────────────────

  test('skip-to-main-content link is present in the DOM', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="workspace-heading"]', { timeout: 20000 })
    const skip = page.locator('[data-testid="skip-to-main"]')
    // It's sr-only but must exist in DOM for keyboard users
    expect(await skip.count()).toBe(1)
  })

  test('skip-to-main link points to #workspace-main', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="workspace-heading"]', { timeout: 20000 })
    const skip = page.locator('[data-testid="skip-to-main"]')
    const href = await skip.getAttribute('href', { timeout: 5000 })
    expect(href).toBe('#workspace-main')
  })

  test('Tab key moves focus between interactive elements', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="workspace-heading"]', { timeout: 20000 })

    // Give page keyboard focus before pressing Tab
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
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="completed-section-toggle"]', { timeout: 20000 })

    const toggle = page.locator('[data-testid="completed-section-toggle"]')
    await toggle.click()
    await page.waitForTimeout(300)

    // After click the section should be expanded (aria-expanded=true)
    const expanded = await toggle.getAttribute('aria-expanded', { timeout: 5000 })
    expect(expanded).toBe('true')
  })

  // ── Mobile viewport ───────────────────────────────────────────────────

  test('workspace renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    const heading = page.getByRole('heading', { name: /Team Operations Workspace/i })
    await expect(heading).toBeVisible({ timeout: 20000 })
  })

  // ── Work item cards ───────────────────────────────────────────────────

  test('work item cards are rendered in the workspace', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="workspace-heading"]', { timeout: 20000 })

    // The store initialises with 8 mock items; some should appear in queue sections
    const cards = page.locator('[data-testid^="work-item-card-"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('View Details links have contextPath hrefs', async ({ page }) => {
    await page.goto(WORKSPACE_URL, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForSelector('[data-testid="workspace-heading"]', { timeout: 20000 })

    const links = page.locator('[data-testid^="view-details-"]').first()
    const isPresent = await links.waitFor({ state: 'attached', timeout: 10000 }).then(() => true).catch(() => false)
    if (isPresent) {
      const href = await links.getAttribute('href', { timeout: 5000 })
      expect(href).toBeTruthy()
      expect(href?.startsWith('/')).toBe(true)
    } else {
      // No items in queue sections — verify empty state messages appear instead
      const emptyState = page.locator('[data-testid^="empty-state-"]').first()
      const emptyVisible = await emptyState.isVisible().catch(() => false)
      expect(emptyVisible).toBe(true)
    }
  })
})
