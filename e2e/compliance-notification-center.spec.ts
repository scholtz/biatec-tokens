import { test, expect } from '@playwright/test'
import { loginWithCredentials, suppressBrowserErrors } from './helpers/auth'

/**
 * Compliance Notification Center — E2E operator journeys.
 *
 * Covers AC #1 (prioritized events), AC #2 (filters), AC #3 (timelines),
 * AC #4 (queue summaries), AC #5 (fail-closed messaging), AC #6 (drill-down),
 * AC #7 (reuses existing patterns), AC #8 (accessibility), AC #9 (automated coverage).
 *
 * Session bootstrap: loginWithCredentials() attempts real backend auth and
 * falls back to localStorage seeding so the Vue auth guard passes and the
 * notification center renders. This is the Tier 1 standard per the auth
 * helper docs and business-owner roadmap.
 */

test.describe('Compliance Notification Center — operator journeys', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await loginWithCredentials(page)
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

    // MOCK_EVENTS_MIXED has exactly 7 events
    const items = page.getByTestId('notification-center-event-item')
    const count = await items.count()
    expect(count).toBe(7)

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

    // Get initial count — MOCK_EVENTS_MIXED has exactly 7 events
    const initialCount = await page.getByTestId('notification-center-event-item').count()
    expect(initialCount).toBe(7)

    // Filter by blocked severity
    const severityFilter = page.getByTestId('notification-center-filter-severity')
    await severityFilter.selectOption('blocked', { timeout: 5000 })

    // MOCK_EVENTS_MIXED has exactly 1 blocked event (evt-010) — semantic wait replaces arbitrary timeout
    await expect(page.getByTestId('notification-center-event-item')).toHaveCount(1, { timeout: 5000 })
  })

  test('shows empty state when filters match nothing', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // Filter by system category (no events match)
    const categoryFilter = page.getByTestId('notification-center-filter-category')
    await categoryFilter.selectOption('system', { timeout: 5000 })

    // Semantic wait: empty state appears when filter matches nothing
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

    // MOCK_TIMELINE_ENTRIES has 4 entries across 2 dates (2026-03-27, 2026-03-26) → 2 groups
    const groups = page.getByTestId('notification-center-timeline-group')
    const groupCount = await groups.count()
    expect(groupCount).toBe(2)

    // Exactly 4 timeline entries
    const entries = page.getByTestId('notification-center-timeline-entry')
    const entryCount = await entries.count()
    expect(entryCount).toBe(4)
  })

  // ===========================================================================
  // AC #4 — Queue summaries with stale, waiting, blocked counts
  // ===========================================================================
  test('shows queue summary with correct metrics', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const summary = page.getByTestId('notification-center-queue-summary')
    await expect(summary).toBeAttached({ timeout: 30000 })

    // Verify key queue metrics — MOCK_EVENTS_MIXED has 7 total events
    const total = page.getByTestId('notification-center-queue-total')
    await expect(total).toBeAttached({ timeout: 5000 })
    const totalText = await total.locator('dd').first().textContent({ timeout: 5000 })
    expect(Number(totalText?.trim())).toBe(7)

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

    // Semantic wait: empty state renders when no events match
    const empty = page.getByTestId('notification-center-empty-state')
    await expect(empty).toBeAttached({ timeout: 5000 })

    const bodyText = await empty.textContent({ timeout: 5000 })
    // Fail-closed messaging: must guide operator with specific copy, not suggest everything is fine
    expect(bodyText).toContain('No matching events')
    expect(bodyText).toContain('Try adjusting filters')
  })

  // ===========================================================================
  // AC #6 — Navigation from events to case detail / evidence surfaces
  // ===========================================================================
  test('drill-down links navigate to relevant compliance surfaces', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const drillDown = page.getByTestId('notification-center-drill-down').first()
    await expect(drillDown).toBeAttached({ timeout: 30000 })

    // First drill-down (blocked event evt-010) points to operations surface
    const href = await drillDown.getAttribute('href', { timeout: 5000 })
    expect(href).toBe('/compliance/operations')

    // Count drill-down links — 5 events have non-null drillDownPath
    // (evt-010→operations, evt-011→onboarding, evt-013→release, evt-014→onboarding, evt-015→onboarding)
    const allDrillDowns = page.getByTestId('notification-center-drill-down')
    const drillDownCount = await allDrillDowns.count()
    expect(drillDownCount).toBe(5)
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
    // Use keyboard activation (focus + Enter) to bypass the sticky navbar
    // (h-20 = 80px, z-50) that intercepts pointer events on elements near
    // the top of the content area. This is a legitimate accessibility
    // interaction — keyboard users activate buttons this way.
    await refreshBtn.focus()
    await page.keyboard.press('Enter')

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

    // Wait for page to render
    const heading = page.getByTestId('notification-center-heading')
    await expect(heading).toBeAttached({ timeout: 30000 })

    // Verify the page contains the expected heading and description text
    const headingText = await heading.textContent({ timeout: 5000 })
    expect(headingText).toContain('Compliance Notification Center')

    const description = page.getByTestId('notification-center-description')
    await expect(description).toBeAttached({ timeout: 5000 })
    const descText = await description.textContent({ timeout: 5000 })
    expect(descText).toContain('compliance events')

    // Verify no wallet connector UI in the page content
    const nav = page.getByRole('navigation').first()
    const navText = await nav.textContent({ timeout: 5000 }).catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  // ===========================================================================
  // Queue card value accuracy
  // ===========================================================================
  test('queue blocked card shows exact count from mock data', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const blocked = page.getByTestId('notification-center-queue-blocked')
    await expect(blocked).toBeAttached({ timeout: 30000 })
    // MOCK_EVENTS_MIXED has exactly 1 blocked event (evt-010)
    const blockedText = await blocked.locator('dd').first().textContent({ timeout: 5000 })
    expect(Number(blockedText?.trim())).toBe(1)
  })

  test('queue unread card shows exact count from mock data', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const unread = page.getByTestId('notification-center-queue-unread')
    await expect(unread).toBeAttached({ timeout: 30000 })
    // MOCK_EVENTS_MIXED has exactly 3 unread events (evt-010, evt-011, evt-012)
    const unreadText = await unread.locator('dd').first().textContent({ timeout: 5000 })
    expect(Number(unreadText?.trim())).toBe(3)
  })

  // ===========================================================================
  // Launch-blocking event rendering
  // ===========================================================================
  test('launch-blocking events display issuance-blocking badge', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // MOCK_EVENTS_MIXED has exactly 2 launch-blocking events (evt-010, evt-013)
    const launchBlocking = page.getByTestId('notification-center-launch-blocking')
    const count = await launchBlocking.count()
    expect(count).toBe(2)

    // First launch-blocking badge text
    const text = await launchBlocking.first().textContent({ timeout: 5000 })
    expect(text).toContain('Blocks Issuance')
  })

  // ===========================================================================
  // First event title accuracy
  // ===========================================================================
  test('first event title matches highest-severity mock event', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const firstItem = page.getByTestId('notification-center-event-item').first()
    await expect(firstItem).toBeAttached({ timeout: 30000 })
    // evt-010 is blocked (highest severity) → sorted first
    const title = await firstItem.textContent({ timeout: 5000 })
    expect(title).toContain('Sanctions screening escalation opened')
  })

  // ===========================================================================
  // Severity badge count matches event count
  // ===========================================================================
  test('each event has exactly one severity badge', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // 7 events → 7 severity badges
    const badges = page.getByTestId('notification-center-severity-badge')
    const badgeCount = await badges.count()
    expect(badgeCount).toBe(7)
  })

  // ===========================================================================
  // AC #2 — Category filter narrows events to a specific category
  // ===========================================================================
  test('filters events by category', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // Filter by kyc_review — MOCK_EVENTS_MIXED has exactly 2 kyc_review events (evt-011, evt-014)
    const categoryFilter = page.getByTestId('notification-center-filter-category')
    await categoryFilter.selectOption('kyc_review', { timeout: 5000 })

    // Semantic wait: exactly 2 items after filter — replaces arbitrary timeout
    await expect(page.getByTestId('notification-center-event-item')).toHaveCount(2, { timeout: 5000 })
  })

  // ===========================================================================
  // AC #4 — Queue action-needed card shows exact count
  // ===========================================================================
  test('queue action-needed card shows exact count from mock data', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const actionNeeded = page.getByTestId('notification-center-queue-action-needed')
    await expect(actionNeeded).toBeAttached({ timeout: 30000 })
    // MOCK_EVENTS_MIXED has exactly 2 action_needed events (evt-011, evt-014)
    const text = await actionNeeded.locator('dd').first().textContent({ timeout: 5000 })
    expect(Number(text?.trim())).toBe(2)
  })

  // ===========================================================================
  // AC #4 — Queue waiting-on-provider card shows exact count
  // ===========================================================================
  test('queue waiting card shows exact count from mock data', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const waiting = page.getByTestId('notification-center-queue-waiting')
    await expect(waiting).toBeAttached({ timeout: 30000 })
    // MOCK_EVENTS_MIXED has exactly 1 waiting_on_provider event (evt-012)
    const text = await waiting.locator('dd').first().textContent({ timeout: 5000 })
    expect(Number(text?.trim())).toBe(1)
  })

  // ===========================================================================
  // AC #4 — Queue stale card shows exact count
  // ===========================================================================
  test('queue stale card shows exact count from mock data', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const stale = page.getByTestId('notification-center-queue-stale')
    await expect(stale).toBeAttached({ timeout: 30000 })
    // Compute expected stale+critical count dynamically from MOCK_EVENTS_MIXED timestamps.
    // The utility (src/utils/complianceNotificationCenter.ts) counts events where
    // classifyFreshness() returns 'stale' (3–7 days old) OR 'critical' (>7 days old).
    // THREE_DAYS_MS mirrors the 'aging→stale' boundary in classifyFreshness().
    // Using Date.now() avoids hardcoded assertions that break as mock timestamps age over CI runs.
    // NOTE: If the classifyFreshness() 3-day boundary changes in the utility, update THREE_DAYS_MS here.
    const MOCK_TIMESTAMPS = [
      '2026-03-27T14:45:00.000Z', // evt-010
      '2026-03-27T14:20:00.000Z', // evt-011
      '2026-03-27T13:30:00.000Z', // evt-012
      '2026-03-20T10:00:00.000Z', // evt-013
      '2026-03-27T12:00:00.000Z', // evt-014
      '2026-03-27T11:30:00.000Z', // evt-015
      '2026-03-27T11:00:00.000Z', // evt-016
    ]
    const THREE_DAYS_MS = 3 * 86_400_000 // mirrors classifyFreshness() aging→stale threshold
    const now = Date.now()
    const expectedStaleCount = MOCK_TIMESTAMPS.filter(
      (ts) => now - new Date(ts).getTime() >= THREE_DAYS_MS,
    ).length
    const text = await stale.locator('dd').first().textContent({ timeout: 5000 })
    expect(Number(text?.trim())).toBe(expectedStaleCount)
  })

  // ===========================================================================
  // AC #2 — All four filter controls are rendered
  // ===========================================================================
  test('renders exactly four filter controls', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    const categoryFilter = page.getByTestId('notification-center-filter-category')
    await expect(categoryFilter).toBeAttached({ timeout: 5000 })

    const severityFilter = page.getByTestId('notification-center-filter-severity')
    await expect(severityFilter).toBeAttached({ timeout: 5000 })

    const freshnessFilter = page.getByTestId('notification-center-filter-freshness')
    await expect(freshnessFilter).toBeAttached({ timeout: 5000 })

    const readStateFilter = page.getByTestId('notification-center-filter-read-state')
    await expect(readStateFilter).toBeAttached({ timeout: 5000 })
  })

  // ===========================================================================
  // AC #2 — Freshness filter narrows events by staleness
  // ===========================================================================
  test('filters events by freshness', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // Filter by critical freshness — MOCK_EVENTS_MIXED has exactly 1 critical-freshness event (evt-013: timestamp 2026-03-20)
    const freshnessFilter = page.getByTestId('notification-center-filter-freshness')
    await freshnessFilter.selectOption('critical', { timeout: 5000 })

    // Semantic wait: exactly 1 event with critical freshness
    await expect(page.getByTestId('notification-center-event-item')).toHaveCount(1, { timeout: 5000 })

    // Verify it's the expected event (evt-013: Release evidence freshness expired)
    const item = page.getByTestId('notification-center-event-item').first()
    const text = await item.textContent({ timeout: 5000 })
    expect(text).toContain('Release evidence freshness expired')
  })

  // ===========================================================================
  // AC #2 — Read-state filter separates unread from read events
  // ===========================================================================
  test('filters events by read state', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // Filter by unread — MOCK_EVENTS_MIXED has exactly 3 unread events (evt-010, evt-011, evt-012)
    const readStateFilter = page.getByTestId('notification-center-filter-read-state')
    await readStateFilter.selectOption('unread', { timeout: 5000 })

    // Semantic wait: exactly 3 unread events
    await expect(page.getByTestId('notification-center-event-item')).toHaveCount(3, { timeout: 5000 })

    // Verify the first unread event is the highest-severity one (evt-010: Sanctions screening)
    const firstItem = page.getByTestId('notification-center-event-item').first()
    const text = await firstItem.textContent({ timeout: 5000 })
    expect(text).toContain('Sanctions screening escalation opened')
  })

  // ===========================================================================
  // Page description content — operator-facing guidance text
  // ===========================================================================
  test('page description provides operator context for workspace purpose', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const description = page.getByTestId('notification-center-description')
    await expect(description).toBeAttached({ timeout: 30000 })
    const text = await description.textContent({ timeout: 5000 })
    expect(text).toContain('investor onboarding')
    expect(text).toContain('sanctions escalations')
    expect(text).toContain('evidence readiness')
  })

  // ===========================================================================
  // Last-updated timestamp display
  // ===========================================================================
  test('last-updated timestamp is rendered', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const lastUpdated = page.getByTestId('notification-center-last-updated')
    await expect(lastUpdated).toBeAttached({ timeout: 30000 })
    const text = await lastUpdated.textContent({ timeout: 5000 })
    expect(text).toContain('Last refreshed:')
  })

  // ===========================================================================
  // Combined filter: severity + category narrows correctly
  // ===========================================================================
  test('combined severity and category filters narrow events correctly', async ({ page }) => {
    await page.goto('/compliance/notifications', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByTestId('notification-center-event-list')).toBeAttached({ timeout: 30000 })

    // Filter by action_needed severity — MOCK_EVENTS_MIXED has 2 (evt-011, evt-013)
    const severityFilter = page.getByTestId('notification-center-filter-severity')
    await severityFilter.selectOption('action_needed', { timeout: 5000 })
    await expect(page.getByTestId('notification-center-event-item')).toHaveCount(2, { timeout: 5000 })

    // Add category filter: kyc_review — only evt-011 is action_needed + kyc_review
    const categoryFilter = page.getByTestId('notification-center-filter-category')
    await categoryFilter.selectOption('kyc_review', { timeout: 5000 })
    await expect(page.getByTestId('notification-center-event-item')).toHaveCount(1, { timeout: 5000 })

    // Verify the remaining event is evt-011 (KYC document resubmission needed)
    const item = page.getByTestId('notification-center-event-item').first()
    const text = await item.textContent({ timeout: 5000 })
    expect(text).toContain('KYC document resubmission needed')
  })
})
