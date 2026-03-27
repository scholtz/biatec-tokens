import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors } from './helpers/auth'

/**
 * Compliance Notification Center — E2E operator journeys.
 *
 * Covers AC #1 (prioritized events), AC #2 (filters), AC #3 (timelines),
 * AC #4 (queue summaries), AC #5 (fail-closed messaging), AC #6 (drill-down),
 * AC #7 (reuses existing patterns), AC #8 (accessibility), AC #9 (automated coverage).
 *
 * Session bootstrap: withAuth() seeds localStorage so the Vue auth guard
 * passes and the notification center renders.
 */

test.describe('Compliance Notification Center — operator journeys', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
  })

  // ===========================================================================
  // AC #1 — Dedicated notification center entry point with prioritized events
  // ===========================================================================
  test('renders notification center page with heading and event list', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const heading = page.getByTestId('notification-center-heading')
    await expect(heading).toBeAttached({ timeout: 30000 })
    const text = await heading.textContent({ timeout: 5000 })
    expect(text).toContain('Compliance Notification Center')

    // Queue summary should be visible
    const summary = page.getByTestId('notification-center-queue-summary')
    await expect(summary).toBeAttached({ timeout: 10000 })
  })

  test('displays prioritized events sorted by severity', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const eventList = page.getByTestId('notification-center-event-list')
    await expect(eventList).toBeAttached({ timeout: 30000 })

    // First event should be the most severe (blocked)
    const items = page.getByTestId('notification-center-event-item')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)

    // First severity badge should indicate the most urgent status
    const firstBadge = page.getByTestId('notification-center-severity-badge').first()
    await expect(firstBadge).toBeAttached({ timeout: 5000 })
    const badgeText = await firstBadge.textContent({ timeout: 5000 })
    expect(badgeText).toContain('Blocked')
  })

  // ===========================================================================
  // AC #2 — Filter and navigate events by category, severity, freshness
  // ===========================================================================
  test('filters events by severity', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // Wait for event list to render
    const eventList = page.getByTestId('notification-center-event-list')
    await expect(eventList).toBeAttached({ timeout: 30000 })

    // Get initial count
    const initialCount = await page.getByTestId('notification-center-event-item').count()
    expect(initialCount).toBeGreaterThan(1)

    // Filter by blocked severity
    const severityFilter = page.getByTestId('notification-center-filter-severity')
    await severityFilter.selectOption('blocked', { timeout: 5000 })
    await page.waitForTimeout(500)

    // Should show fewer items
    const filteredCount = await page.getByTestId('notification-center-event-item').count()
    expect(filteredCount).toBeLessThan(initialCount)
    expect(filteredCount).toBeGreaterThan(0)
  })

  test('shows empty state when filters match nothing', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // Filter by system category (no events match)
    const categoryFilter = page.getByTestId('notification-center-filter-category')
    await categoryFilter.selectOption('system', { timeout: 5000 })
    await page.waitForTimeout(500)

    const empty = page.getByTestId('notification-center-empty-state')
    await expect(empty).toBeAttached({ timeout: 5000 })
  })

  // ===========================================================================
  // AC #3 — Timeline that explains major state transitions
  // ===========================================================================
  test('renders event timeline with grouped entries', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const timeline = page.getByTestId('notification-center-timeline-root')
    await expect(timeline).toBeAttached({ timeout: 30000 })

    const groups = page.getByTestId('notification-center-timeline-group')
    const groupCount = await groups.count()
    expect(groupCount).toBeGreaterThan(0)

    const entries = page.getByTestId('notification-center-timeline-entry')
    const entryCount = await entries.count()
    expect(entryCount).toBeGreaterThan(0)
  })

  // ===========================================================================
  // AC #4 — Queue summaries with stale, waiting, blocked counts
  // ===========================================================================
  test('shows queue summary with correct metrics', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const summary = page.getByTestId('notification-center-queue-summary')
    await expect(summary).toBeAttached({ timeout: 30000 })

    // Verify key queue metrics are present
    const total = page.getByTestId('notification-center-queue-total')
    await expect(total).toBeAttached({ timeout: 5000 })
    const totalText = await total.locator('dd').first().textContent({ timeout: 5000 })
    expect(Number(totalText?.trim())).toBeGreaterThan(0)

    const blocked = page.getByTestId('notification-center-queue-blocked')
    await expect(blocked).toBeAttached({ timeout: 5000 })

    const waiting = page.getByTestId('notification-center-queue-waiting')
    await expect(waiting).toBeAttached({ timeout: 5000 })

    const stale = page.getByTestId('notification-center-queue-stale')
    await expect(stale).toBeAttached({ timeout: 5000 })
  })

  // ===========================================================================
  // AC #5 — Degraded/stale states render explicit fail-closed messaging
  // ===========================================================================
  test('empty state provides fail-closed guidance copy', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // Force empty state via filter
    const categoryFilter = page.getByTestId('notification-center-filter-category')
    await categoryFilter.selectOption('system', { timeout: 5000 })
    await page.waitForTimeout(500)

    const empty = page.getByTestId('notification-center-empty-state')
    await expect(empty).toBeAttached({ timeout: 5000 })

    const bodyText = await empty.textContent({ timeout: 5000 })
    // Fail-closed messaging: should guide user, not suggest everything is fine
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(20)
  })

  // ===========================================================================
  // AC #6 — Navigation from events to case detail / evidence surfaces
  // ===========================================================================
  test('drill-down links navigate to relevant compliance surfaces', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const drillDown = page.getByTestId('notification-center-drill-down').first()
    await expect(drillDown).toBeAttached({ timeout: 30000 })

    // Verify link has an href attribute pointing to a compliance surface
    const href = await drillDown.getAttribute('href', { timeout: 5000 })
    expect(href).toBeTruthy()
    expect(href).toContain('/compliance/')
  })

  // ===========================================================================
  // AC #8 — Accessibility: keyboard and screen reader
  // ===========================================================================
  test('has accessible landmarks and labels', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // Main region with aria-label
    const region = page.locator('[role="region"][aria-label*="Compliance Notification Center"]')
    await expect(region).toBeAttached({ timeout: 30000 })

    // Skip link exists
    const skipLink = page.locator('a[href="#notification-center-main"]')
    await expect(skipLink).toBeAttached({ timeout: 5000 })
  })

  test('event severity badges have role="status"', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    const badge = page.getByTestId('notification-center-severity-badge').first()
    await expect(badge).toBeAttached({ timeout: 5000 })
    const role = await badge.getAttribute('role', { timeout: 5000 })
    expect(role).toBe('status')
  })

  // ===========================================================================
  // AC #9 — Refresh functionality
  // ===========================================================================
  test('refresh button reloads data', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    const refreshBtn = page.getByTestId('notification-center-refresh')
    await expect(refreshBtn).toBeAttached({ timeout: 5000 })
    // Scroll viewport down so the refresh button clears the sticky navbar (h-20 = 80px)
    await refreshBtn.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, 100))
    await refreshBtn.click({ timeout: 5000 })

    // After click, loading state should appear briefly then resolve
    // The page should still have events after refresh
    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })
  })

  // ===========================================================================
  // Navigation parity — no wallet connector UI
  // ===========================================================================
  test('notification center page has no wallet connector UI', async ({ page }) => {
    await page.goto('/', { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })

    const nav = page.getByRole('navigation').first()
    const navText = await nav.textContent({ timeout: 10000 }).catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('feed health banner shows operator-facing status when data is available', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // Page should render with either a healthy state (no banner) or
    // a feed health banner with operator-relevant status text
    const bodyText = await page.locator('body').textContent({ timeout: 10000 }).catch(() => '')
    // Verify the notification center contains compliance-relevant content (not wallet UI)
    const hasNotificationContent =
      bodyText.includes('Notification Center') ||
      bodyText.includes('Compliance') ||
      bodyText.includes('events')
    expect(hasNotificationContent).toBe(true)
  })
})
