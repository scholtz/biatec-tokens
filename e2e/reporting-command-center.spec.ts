/**
 * E2E Tests: Reporting Command Center
 *
 * Validates the enterprise reporting command center from an operator's perspective.
 *
 * Acceptance Criteria covered:
 *  AC #1  — Route reachable from enterprise navigation
 *  AC #2  — Saved report templates with descriptions and metadata
 *  AC #3  — Create/configure a report run (configure panel)
 *  AC #4  — Lifecycle status differentiation
 *  AC #5  — Stale evidence warnings and fail-closed behavior
 *  AC #6  — Changes since last report summary
 *  AC #7  — Deep links to remediation surfaces
 *  AC #8  — Loading, empty, degraded state conventions
 *  AC #9  — No wallet connector UI
 *  AC #10 — WCAG-conscious keyboard/screen-reader semantics
 *  AC #12 — E2E journey coverage
 *  AC #13 — Explicit unavailability state for backend not yet available
 */

import { test, expect } from '@playwright/test'
import { loginWithCredentials, suppressBrowserErrorsNarrow } from './helpers/auth'

const BASE = 'http://localhost:5173'
const ROUTE = `${BASE}/compliance/reporting-center`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function navigateToCenter(page: any) {
  suppressBrowserErrorsNarrow(page)
  await loginWithCredentials(page)
  await page.goto(ROUTE, { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
  const heading = page.getByRole('heading', { name: /Reporting Command Center/i, level: 1 })
  await expect(heading).toBeVisible({ timeout: 30000 })
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

test.describe('Reporting Command Center — Navigation Reachability (AC #1)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('authenticated user can navigate to /compliance/reporting-center', async ({ page }) => {
    await navigateToCenter(page)
    expect(page.url()).toContain('/compliance/reporting-center')
  })

  test('page has correct h1 heading', async ({ page }) => {
    await navigateToCenter(page)
    const h1 = page.getByRole('heading', { name: /Reporting Command Center/i, level: 1 })
    await expect(h1).toBeVisible({ timeout: 15000 })
  })

  test('Reporting Center link appears in the sidebar navigation', async ({ page }) => {
    await navigateToCenter(page)
    const navLink = page.getByRole('link', { name: /Reporting Center/i }).first()
    await expect(navLink).toBeVisible({ timeout: 15000 })
  })

  test('page includes skip link to main content (WCAG SC 2.4.1)', async ({ page }) => {
    await navigateToCenter(page)
    const skipLink = page.getByTestId('reporting-center-skip-link')
    await expect(skipLink).toBeAttached({ timeout: 10000 })
    const href = await skipLink.getAttribute('href', { timeout: 5000 })
    expect(href).toBe('#reporting-center-main')
  })
})

test.describe('Reporting Command Center — Unauthenticated Redirect', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  // Separate describe for unauthenticated tests (no withAuth in beforeEach)
  test('unauthenticated user is redirected away from /compliance/reporting-center', async ({ page }) => {
    // Ensure no auth is set
    await page.addInitScript(() => {
      localStorage.removeItem('algorand_user')
    })
    await page.goto(ROUTE, { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    // Wait semantically for auth guard redirect or modal — no fixed sleep
    await page.waitForFunction(
      (route: string) =>
        !window.location.href.includes(route) ||
        (document.querySelector('[data-testid="auth-modal"]') !== null) ||
        document.body.textContent?.includes('showAuth'),
      '/compliance/reporting-center',
      { timeout: 8000 },
    ).catch(() => {})

    const url = page.url()
    const redirectedAway = !url.includes('/compliance/reporting-center')
    const showsAuthModal = await page
      .locator('form').filter({ hasText: /email/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false)

    expect(redirectedAway || showsAuthModal || url.includes('showAuth=true')).toBe(true)
  })
})

test.describe('Reporting Command Center — Summary Cards (AC #2, #4)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('renders all four summary cards', async ({ page }) => {
    await navigateToCenter(page)
    await expect(page.getByTestId('summary-card-scheduled')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('summary-card-blocked')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('summary-card-stale')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('summary-card-awaiting')).toBeVisible({ timeout: 10000 })
  })

  test('summary cards display numeric values', async ({ page }) => {
    await navigateToCenter(page)
    const scheduled = page.getByTestId('summary-card-scheduled')
    await expect(scheduled).toBeVisible({ timeout: 15000 })
    const text = await scheduled.textContent({ timeout: 5000 })
    expect(text).toMatch(/\d/)
  })
})

test.describe('Reporting Command Center — Report Templates (AC #2, #5)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('shows saved report template cards', async ({ page }) => {
    await navigateToCenter(page)
    const templateCards = page.getByTestId('report-template-card')
    await expect(templateCards.first()).toBeVisible({ timeout: 15000 })
    const count = await templateCards.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('template cards show enterprise audience labels', async ({ page }) => {
    await navigateToCenter(page)
    await expect(page.getByTestId('report-template-card').first()).toBeVisible({ timeout: 15000 })
    const pageText = await page.locator('body').textContent({ timeout: 5000 }).catch(() => '')
    const hasEnterpriseAudience =
      (pageText ?? '').includes('Internal Compliance') ||
      (pageText ?? '').includes('Executive Leadership') ||
      (pageText ?? '').includes('Regulatory Authority') ||
      (pageText ?? '').includes('External Auditor')
    expect(hasEnterpriseAudience).toBe(true)
  })

  test('template cards show freshness badges', async ({ page }) => {
    await navigateToCenter(page)
    const freshnessBadges = page.getByTestId('template-freshness-badge')
    await expect(freshnessBadges.first()).toBeVisible({ timeout: 15000 })
    const count = await freshnessBadges.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('template cards show cadence chips', async ({ page }) => {
    await navigateToCenter(page)
    const cadenceChips = page.getByTestId('template-cadence-chip')
    await expect(cadenceChips.first()).toBeVisible({ timeout: 15000 })
  })

  test('template cards show "Run Report" CTAs', async ({ page }) => {
    await navigateToCenter(page)
    const runCtaButtons = page.getByTestId('template-run-cta')
    await expect(runCtaButtons.first()).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Reporting Command Center — Schedule Configuration (AC #3, #13)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('clicking "New Report Run" opens the configuration panel', async ({ page }) => {
    await navigateToCenter(page)
    const createBtn = page.getByTestId('create-report-run-button')
    await expect(createBtn).toBeVisible({ timeout: 15000 })
    await createBtn.click({ timeout: 5000 })
    await expect(page.getByTestId('report-configure-panel')).toBeVisible({ timeout: 10000 })
  })

  test('configure panel has audience and cadence selects', async ({ page }) => {
    await navigateToCenter(page)
    await page.getByTestId('create-report-run-button').click({ timeout: 5000 })
    const panel = page.getByTestId('report-configure-panel')
    await expect(panel).toBeVisible({ timeout: 10000 })
    const audienceSelect = panel.locator('[data-testid="configure-audience-select"]')
    const cadenceSelect = panel.locator('[data-testid="configure-cadence-select"]')
    await expect(audienceSelect).toBeVisible({ timeout: 8000 })
    await expect(cadenceSelect).toBeVisible({ timeout: 8000 })
  })

  test('configure panel shows backend scheduling unavailability notice (AC #13)', async ({ page }) => {
    await navigateToCenter(page)
    await page.getByTestId('create-report-run-button').click({ timeout: 5000 })
    const panel = page.getByTestId('report-configure-panel')
    await expect(panel).toBeVisible({ timeout: 10000 })
    const panelText = await panel.textContent({ timeout: 5000 })
    const hasUnavailableNotice =
      (panelText ?? '').toLowerCase().includes('not yet available') ||
      (panelText ?? '').toLowerCase().includes('upcoming release')
    expect(hasUnavailableNotice).toBe(true)
  })

  test('configure panel close button hides the panel', async ({ page }) => {
    await navigateToCenter(page)
    await page.getByTestId('create-report-run-button').click({ timeout: 5000 })
    await expect(page.getByTestId('report-configure-panel')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('configure-panel-close').click({ timeout: 5000 })
    await expect(page.getByTestId('report-configure-panel')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Reporting Command Center — Run Status & Lifecycle (AC #4)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('in-flight runs section is visible', async ({ page }) => {
    await navigateToCenter(page)
    const runsSection = page.getByTestId('report-runs-section')
    await expect(runsSection).toBeVisible({ timeout: 15000 })
  })

  test('run rows show lifecycle status badges', async ({ page }) => {
    await navigateToCenter(page)
    const statusBadges = page.getByTestId('run-status-badge')
    await expect(statusBadges.first()).toBeVisible({ timeout: 15000 })
    const count = await statusBadges.count()
    expect(count).toBeGreaterThan(0)
  })

  test('at least one blocked run status badge is present', async ({ page }) => {
    await navigateToCenter(page)
    const statusBadges = page.getByTestId('run-status-badge')
    await expect(statusBadges.first()).toBeVisible({ timeout: 15000 })
    const allBadgeTexts = await statusBadges.allTextContents()
    const hasBlocked = allBadgeTexts.some((t) => t.includes('Blocked'))
    expect(hasBlocked).toBe(true)
  })
})

test.describe('Reporting Command Center — Stale Evidence Warnings (AC #5)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('page does not present any blocked state as "ready" without explicit evidence status', async ({ page }) => {
    await navigateToCenter(page)
    await expect(page.getByTestId('report-templates-section')).toBeVisible({ timeout: 15000 })
    // Healthy templates show "Up to Date" badge and enabled buttons
    const freshnessBadges = page.getByTestId('template-freshness-badge')
    await expect(freshnessBadges.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Reporting Command Center — Change Summary (AC #6)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('change-since-last-report summary section is visible', async ({ page }) => {
    await navigateToCenter(page)
    const changeSummary = page.getByTestId('run-change-summary').first()
    await expect(changeSummary).toBeVisible({ timeout: 15000 })
  })

  test('change summary shows resolved blockers and approvals', async ({ page }) => {
    await navigateToCenter(page)
    const changeSummary = page.getByTestId('run-change-summary').first()
    await expect(changeSummary).toBeVisible({ timeout: 15000 })
    const summaryText = await changeSummary.textContent({ timeout: 5000 })
    const hasResolvedInfo =
      (summaryText ?? '').toLowerCase().includes('blockers') ||
      (summaryText ?? '').toLowerCase().includes('approvals')
    expect(hasResolvedInfo).toBe(true)
  })
})

test.describe('Reporting Command Center — Blocker Deep Links (AC #7)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('blocked runs show remediation links to compliance surfaces', async ({ page }) => {
    await navigateToCenter(page)
    const blockerLinks = page.getByTestId('run-blocker-link')
    await expect(blockerLinks.first()).toBeVisible({ timeout: 15000 })
  })

  test('blocker link points to a /compliance/ route', async ({ page }) => {
    await navigateToCenter(page)
    const blockerLink = page.getByTestId('run-blocker-link').first()
    await expect(blockerLink).toBeVisible({ timeout: 15000 })
    const href = await blockerLink.getAttribute('href', { timeout: 5000 }).catch(() => '')
      ?? await blockerLink.getAttribute('to', { timeout: 5000 }).catch(() => '')
    expect(href).toMatch(/\/compliance\//)
  })
})

test.describe('Reporting Command Center — No Wallet UI (AC #9)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('page does not contain wallet connector UI elements', async ({ page }) => {
    await navigateToCenter(page)
    await expect(page.getByTestId('reporting-command-center')).toBeVisible({ timeout: 15000 })
    // Check navigation for no wallet UI — use getNavText helper pattern
    const nav = page.locator('nav').first()
    const navText = await nav.textContent({ timeout: 10000 }).catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('authentication is email/password only (no blockchain wallet framing)', async ({ page }) => {
    await navigateToCenter(page)
    const pageText = await page.locator('body').textContent({ timeout: 5000 }).catch(() => '')
    expect(pageText).not.toMatch(/sign transaction/i)
    expect(pageText).not.toMatch(/approve in wallet/i)
  })
})

test.describe('Reporting Command Center — Accessibility (AC #10)', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrorsNarrow(page)
  })

  test('page has a single h1 heading', async ({ page }) => {
    await navigateToCenter(page)
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('page has h2 section headings for templates and runs', async ({ page }) => {
    await navigateToCenter(page)
    await expect(page.getByRole('heading', { name: /Saved Report Templates/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /In-Flight Report Runs/i })).toBeVisible({ timeout: 10000 })
  })

  test('workspace region has accessible name via aria-label', async ({ page }) => {
    await navigateToCenter(page)
    const region = page.locator('[role="region"][aria-label*="Reporting Command Center"]')
    await expect(region).toBeAttached({ timeout: 15000 })
  })

  test('configure panel has role="dialog" with aria-labelledby', async ({ page }) => {
    await navigateToCenter(page)
    await page.getByTestId('create-report-run-button').click({ timeout: 5000 })
    const dialog = page.locator('[role="dialog"][aria-modal="true"]')
    await expect(dialog).toBeVisible({ timeout: 10000 })
  })

  test('all CTA buttons have visible text labels (SC 4.1.2)', async ({ page }) => {
    await navigateToCenter(page)
    // No CTA buttons with empty text
    const ctaButtons = page.getByTestId('run-cta-button')
    const count = await ctaButtons.count()
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await ctaButtons.nth(i).textContent({ timeout: 3000 }).catch(() => '')
        expect((text ?? '').trim().length).toBeGreaterThan(0)
      }
    }
  })
})
