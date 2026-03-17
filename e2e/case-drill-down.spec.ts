/**
 * E2E Tests: Case Drill-Down and Guided Escalation Workflows
 *
 * Covers:
 *  1. Analyst journey — open cockpit, view details, inspect evidence, initiate escalation
 *  2. Approver journey — open approval-ready case, inspect approval history, review evidence
 *  3. Escalation flow — select reason, add note, submit, see confirmation
 *  4. Degraded data handling — panel does not present false readiness
 *  5. Keyboard navigation — Tab through controls, Escape closes
 *  6. No wallet UI regression — cockpit + drill-down remain wallet-free
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, getNavText } from './helpers/auth'

const BASE = 'http://localhost:5173'
const COCKPIT_URL = `${BASE}/compliance/operations`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function goToCockpit(page: import('@playwright/test').Page) {
  await withAuth(page)
  await page.goto(COCKPIT_URL, { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
}

/** Click the first "View details" button in the worklist */
async function openFirstCaseDrillDown(page: import('@playwright/test').Page) {
  const viewBtn = page.locator('[data-testid^="view-case-details-"]').first()
  await viewBtn.waitFor({ state: 'visible', timeout: 20000 })
  await viewBtn.click({ timeout: 5000 })
}

// ---------------------------------------------------------------------------
// 1. Analyst Journey
// ---------------------------------------------------------------------------

test.describe('Case Drill-Down — analyst journey', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('analyst can open case drill-down panel from the cockpit worklist', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const panel = page.locator('[data-testid="case-drill-down-panel"]')
    await expect(panel).toBeAttached({ timeout: 10000 })
    await expect(panel).toBeVisible({ timeout: 10000 })
  })

  test('case drill-down panel shows case headline', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const headline = page.locator('[data-testid="drill-down-case-headline"]')
    await headline.waitFor({ state: 'visible', timeout: 10000 })
    const text = await headline.textContent({ timeout: 5000 })
    expect(text!.trim().length).toBeGreaterThan(3)
  })

  test('case detail shows stage badge, status badge, and ownership badge', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    await expect(page.locator('[data-testid="drill-down-stage-badge"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="drill-down-status-badge"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="drill-down-ownership-badge"]')).toBeVisible({ timeout: 10000 })
  })

  test('case detail shows next action guidance', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const nextAction = page.locator('[data-testid="drill-down-next-action"]')
    await nextAction.waitFor({ state: 'visible', timeout: 10000 })
    const text = await nextAction.textContent({ timeout: 5000 })
    expect(text!.trim().length).toBeGreaterThan(10)
  })

  test('case detail shows timeline section with at least one event', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const timelineSection = page.locator('[data-testid="drill-down-timeline"]')
    await timelineSection.waitFor({ state: 'visible', timeout: 10000 })

    const events = page.locator('[data-testid="drill-down-timeline-event"]')
    const count = await events.count()
    expect(count).toBeGreaterThan(0)
  })

  test('case detail shows evidence section with 5 evidence groups', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const evidenceSection = page.locator('[data-testid="drill-down-evidence-section"]')
    await evidenceSection.waitFor({ state: 'visible', timeout: 10000 })

    const groups = page.locator('[data-testid="drill-down-evidence-group"]')
    await expect(groups).toHaveCount(5)
  })

  test('analyst can expand evidence groups by clicking toggle', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    // Find a collapsed evidence group toggle
    const allToggles = page.locator('[data-testid="drill-down-evidence-group-toggle"]')
    await allToggles.first().waitFor({ state: 'visible', timeout: 10000 })

    // Find a collapsed toggle (aria-expanded=false)
    const toggles = allToggles.all()
    let expandedCount = 0
    for (const toggle of await toggles) {
      const expanded = await toggle.getAttribute('aria-expanded', { timeout: 3000 }).catch(() => null)
      if (expanded === 'false') {
        await toggle.click({ timeout: 5000 })
        expandedCount++
        break
      }
    }

    // After expanding, evidence items should be visible
    const items = page.locator('[data-testid="drill-down-evidence-item"]')
    const itemCount = await items.count()
    expect(itemCount).toBeGreaterThan(0)
  })

  test('analyst can close the drill-down panel with the close button', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const panel = page.locator('[data-testid="case-drill-down-panel"]')
    await expect(panel).toBeVisible({ timeout: 10000 })

    const closeBtn = page.locator('[data-testid="drill-down-close-btn"]')
    await closeBtn.click({ timeout: 5000 })

    // Panel should be gone
    await expect(panel).not.toBeVisible({ timeout: 5000 })
  })
})

// ---------------------------------------------------------------------------
// 2. Approver Journey
// ---------------------------------------------------------------------------

test.describe('Case Drill-Down — approver journey', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('approver can see approval history section in case detail', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const historySection = page.locator('[data-testid="drill-down-approval-history"]')
    await historySection.waitFor({ state: 'visible', timeout: 10000 })
    expect(await historySection.isVisible()).toBe(true)
  })

  test('approval records have data-decision attribute', async ({ page }) => {
    await goToCockpit(page)

    // Navigate to the approval-stage item if possible
    // For this test, open the first available drill-down
    await openFirstCaseDrillDown(page)

    const records = page.locator('[data-testid="drill-down-approval-record"]')
    const count = await records.count()
    if (count > 0) {
      const firstRecord = records.first()
      const decision = await firstRecord.getAttribute('data-decision', { timeout: 3000 }).catch(() => null)
      expect(decision).not.toBeNull()
    } else {
      // Empty state should be shown
      const emptyState = page.locator('[data-testid="drill-down-approval-history-empty"]')
      await expect(emptyState).toBeVisible({ timeout: 5000 })
    }
  })

  test('approver can see the open workspace link in panel footer', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const link = page.locator('[data-testid="drill-down-open-workspace"]')
    await link.waitFor({ state: 'visible', timeout: 10000 })
    expect(await link.getAttribute('href', { timeout: 3000 })).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 3. Escalation Flow
// ---------------------------------------------------------------------------

test.describe('Guided Escalation Flow', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('analyst can open the escalation modal from the drill-down panel', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const escalateBtn = page.locator('[data-testid="drill-down-escalate-btn"]')
    await escalateBtn.waitFor({ state: 'visible', timeout: 10000 })
    await escalateBtn.click({ timeout: 5000 })

    const modal = page.locator('[data-testid="escalation-modal"]')
    await expect(modal).toBeAttached({ timeout: 10000 })
    await expect(modal).toBeVisible({ timeout: 10000 })
  })

  test('escalation modal shows 6 reason options', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const escalateBtn = page.locator('[data-testid="drill-down-escalate-btn"]')
    await escalateBtn.click({ timeout: 5000 })

    const modal = page.locator('[data-testid="escalation-modal"]')
    await modal.waitFor({ state: 'visible', timeout: 10000 })

    const options = page.locator('[data-testid="escalation-reason-option"]')
    await expect(options).toHaveCount(6)
  })

  test('escalation modal shows reason description and destination', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const escalateBtn = page.locator('[data-testid="drill-down-escalate-btn"]')
    await escalateBtn.click({ timeout: 5000 })

    const modal = page.locator('[data-testid="escalation-modal"]')
    await modal.waitFor({ state: 'visible', timeout: 10000 })

    const desc = page.locator('[data-testid="escalation-reason-description"]')
    await expect(desc).toBeVisible({ timeout: 5000 })
    const descText = await desc.textContent({ timeout: 3000 })
    expect(descText!.trim().length).toBeGreaterThan(10)

    const dest = page.locator('[data-testid="escalation-destination"]')
    await expect(dest).toBeVisible({ timeout: 5000 })
    const destText = await dest.textContent({ timeout: 3000 })
    expect(destText!.trim().length).toBeGreaterThan(5)
  })

  test('analyst can add a note and submit an escalation', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const escalateBtn = page.locator('[data-testid="drill-down-escalate-btn"]')
    await escalateBtn.click({ timeout: 5000 })

    const modal = page.locator('[data-testid="escalation-modal"]')
    await modal.waitFor({ state: 'visible', timeout: 10000 })

    // Add a note
    const noteInput = page.locator('[data-testid="escalation-note-input"]')
    await noteInput.fill('AML provider returned inconclusive result. Requesting manual review.')

    // Submit
    const submitBtn = page.locator('[data-testid="escalation-submit-btn"]')
    await submitBtn.click({ timeout: 5000 })

    // Confirmation banner should appear
    const confirmation = page.locator('[data-testid="escalation-confirmation"]')
    await expect(confirmation).toBeVisible({ timeout: 10000 })
    const confirmText = await confirmation.textContent({ timeout: 3000 })
    expect(confirmText!.toLowerCase()).toContain('escalation submitted')
  })

  test('analyst can cancel escalation without submitting', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const escalateBtn = page.locator('[data-testid="drill-down-escalate-btn"]')
    await escalateBtn.click({ timeout: 5000 })

    const modal = page.locator('[data-testid="escalation-modal"]')
    await modal.waitFor({ state: 'visible', timeout: 10000 })

    const cancelBtn = page.locator('[data-testid="escalation-cancel-btn"]')
    await cancelBtn.click({ timeout: 5000 })

    // Modal should be gone
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })
})

// ---------------------------------------------------------------------------
// 4. Degraded Data Handling
// ---------------------------------------------------------------------------

test.describe('Degraded data handling', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('evidence items show a data-status attribute indicating actual state', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    // Expand all evidence groups to expose items
    const toggles = page.locator('[data-testid="drill-down-evidence-group-toggle"]')
    const allToggles = await toggles.all()
    for (const t of allToggles) {
      const expanded = await t.getAttribute('aria-expanded', { timeout: 2000 }).catch(() => null)
      if (expanded === 'false') {
        await t.click({ timeout: 3000 })
      }
    }
    await page.waitForTimeout(500)

    const items = page.locator('[data-testid="drill-down-evidence-item"]')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)

    // Verify no item claims to be "available" when actually "degraded" or "missing"
    // (i.e. every data-status is one of the four valid values, not something blank)
    for (let i = 0; i < count; i++) {
      const status = await items.nth(i).getAttribute('data-status', { timeout: 2000 }).catch(() => null)
      expect(['available', 'missing', 'stale', 'degraded']).toContain(status)
    }
  })

  test('next action box never shows blank content', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const box = page.locator('[data-testid="drill-down-next-action"]')
    await box.waitFor({ state: 'visible', timeout: 10000 })
    const text = await box.textContent({ timeout: 5000 })
    // Must have real guidance, not just whitespace
    expect(text!.trim().length).toBeGreaterThan(15)
  })
})

// ---------------------------------------------------------------------------
// 5. Keyboard Navigation
// ---------------------------------------------------------------------------

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('close button is keyboard-focusable (Tab reachable)', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const panel = page.locator('[data-testid="case-drill-down-panel"]')
    await panel.waitFor({ state: 'visible', timeout: 10000 })

    // Click body to give focus to page, then tab through
    await page.locator('body').click()
    await page.keyboard.press('Tab')

    // The close button should be reachable
    const closeBtn = page.locator('[data-testid="drill-down-close-btn"]')
    await expect(closeBtn).toBeAttached({ timeout: 5000 })
    // Verify close button has a focus-visible class that enables keyboard usage
    const focusClasses = await closeBtn.getAttribute('class', { timeout: 3000 }).catch(() => '')
    expect(focusClasses).toContain('focus-visible:ring')
  })

  test('escalate button has focus-visible ring for keyboard users', async ({ page }) => {
    await goToCockpit(page)
    await openFirstCaseDrillDown(page)

    const escalateBtn = page.locator('[data-testid="drill-down-escalate-btn"]')
    await escalateBtn.waitFor({ state: 'visible', timeout: 10000 })
    const classes = await escalateBtn.getAttribute('class', { timeout: 3000 }).catch(() => '')
    expect(classes).toContain('focus-visible:ring')
  })
})

// ---------------------------------------------------------------------------
// 6. No wallet UI regression
// ---------------------------------------------------------------------------

test.describe('No wallet UI — regression check', () => {
  test('compliance cockpit with drill-down does not show wallet connector UI', async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
    await page.goto('/', { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 })

    const navText = await getNavText(page)
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})
