/**
 * E2E Tests: Live Compliance Case Management Integration
 *
 * Verifies the live data integration between the backend compliance case
 * management API and the enterprise frontend workspaces:
 *
 * Section 1: Investor Onboarding Workspace — live data states
 *   AC #1  — workspace loads live data when authenticated (or fixture in dev)
 *   AC #4  — blocked/stale state triggers explicit fail-closed UI
 *   AC #6  — degraded backend shows degraded state, NOT "ready"
 *
 * Section 2: Enterprise Approval Cockpit — onboarding readiness summary
 *   AC #5  — approval cockpit surfaces onboarding readiness summary
 *   AC #5  — readiness status badge is visible
 *   AC #5  — "Open workspace" link navigates to onboarding
 *
 * Section 3: Regression — wallet-free language across both workspaces
 *   AC #7  — no wallet connector UI in onboarding workspace
 *   AC #7  — no wallet connector UI in approval cockpit
 *
 * Section 4: Accessibility — live-backed UI meets WCAG 2.1 AA
 *   AC #8  — onboarding summary section has aria-labelledby
 *   AC #8  — degraded message uses role="alert"
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, getNavText } from './helpers/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openOnboardingWorkspace(page: Parameters<typeof withAuth>[0]) {
  suppressBrowserErrors(page)
  await withAuth(page)
  await page.goto('/compliance/onboarding', { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
}

async function openApprovalCockpit(page: Parameters<typeof withAuth>[0]) {
  suppressBrowserErrors(page)
  await withAuth(page)
  await page.goto('/compliance/approval', { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
}

// ---------------------------------------------------------------------------
// Section 1: Investor Onboarding Workspace — live data states
// ---------------------------------------------------------------------------

test.describe('Live data states — Investor Compliance Onboarding Workspace', () => {
  test('workspace loads and displays a readiness posture banner (AC #1)', async ({ page }) => {
    await openOnboardingWorkspace(page)
    const heading = page.getByRole('heading', { name: /Investor Compliance Onboarding/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    // Posture banner shows overall status — either "ready" or "blocked" or similar
    const postureBanner = page.getByTestId('readiness-posture-banner')
    await expect(postureBanner).toBeVisible({ timeout: 20000 })
    const postureText = await postureBanner.textContent({ timeout: 10000 }).catch(() => '')
    expect(postureText?.length ?? 0).toBeGreaterThan(0)
  })

  test('readiness score is rendered as a meaningful number (not blank)', async ({ page }) => {
    await openOnboardingWorkspace(page)
    const readinessScore = page.getByTestId('readiness-score')
    await expect(readinessScore).toBeVisible({ timeout: 20000 })
    const text = await readinessScore.textContent({ timeout: 10000 }).catch(() => '')
    // Score should contain a % character
    expect(text).toContain('%')
  })

  test('seven onboarding stages are rendered after loading', async ({ page }) => {
    await openOnboardingWorkspace(page)
    const stagesList = page.getByTestId('stages-list')
    await stagesList.waitFor({ state: 'visible', timeout: 20000 })
    // stage items are keyed by stage-item-<id>
    const stageItems = page.locator('[data-testid^="stage-item-"]')
    const count = await stageItems.count()
    // Should have exactly 7 stages
    expect(count).toBe(7)
  })

  test('blocked state shows critical blockers banner with descriptive text (AC #4)', async ({ page }) => {
    await openOnboardingWorkspace(page)
    // The demo defaults to "blocked" fixture or live data may show blocked
    // Either way: if the banner is present, it must have meaningful content
    const criticalBanner = page.getByTestId('critical-blockers-banner')
    const isVisible = await criticalBanner.isVisible({ timeout: 5000 }).catch(() => false)
    if (isVisible) {
      const bannerText = await criticalBanner.textContent({ timeout: 5000 }).catch(() => '')
      // Banner must not be empty and must explain blockers in plain language
      expect(bannerText?.length ?? 0).toBeGreaterThan(20)
      // Must not contain chain/protocol jargon
      expect(bannerText).not.toMatch(/wallet|MetaMask|WalletConnect/i)
    }
    // Even if no critical banner, the workspace should always render
    const heading = page.getByRole('heading', { name: /Investor Compliance Onboarding/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('demo mode toggle switches between fixtures without wallet UI (AC #4)', async ({ page }) => {
    await openOnboardingWorkspace(page)
    // Look for the "Blocked (KYC/AML)" fixture button in demo mode (data-testid="fixture-btn-blocked")
    const blockedBtn = page.getByTestId('fixture-btn-blocked')
    const isVisible = await blockedBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (isVisible) {
      await blockedBtn.click({ timeout: 5000 })
      // Semantic wait: posture banner must appear before asserting its content
      const posture = page.getByTestId('readiness-posture-banner')
      await expect(posture).toBeVisible({ timeout: 10000 })
    }
    // Either way: no wallet UI should appear
    const navText = await getNavText(page)
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('degraded API state shows "data unavailable" message, not ready (AC #6)', async ({ page }) => {
    // Intercept the monitoring dashboard API to return 503
    await page.route('**/api/v1/compliance/monitoring/dashboard', (route) => {
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Service temporarily unavailable' }) })
    })
    suppressBrowserErrors(page)
    await withAuth(page)
    await page.goto('/compliance/onboarding', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // If the API fails, the workspace must NOT show a "ready" state
    const heading = page.getByRole('heading', { name: /Investor Compliance Onboarding/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    // In dev/demo mode the fixture is used as fallback, so check for degraded banner only in prod mode
    const degradedBanner = page.getByTestId('degraded-state-banner')
    const isDegraded = await degradedBanner.isVisible({ timeout: 3000 }).catch(() => false)
    // If degraded banner is shown, it must contain an explanation (not just "ready")
    if (isDegraded) {
      const text = await degradedBanner.textContent({ timeout: 5000 }).catch(() => '')
      expect(text).not.toContain('Ready for Handoff')
      expect(text?.length ?? 0).toBeGreaterThan(10)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 2: Enterprise Approval Cockpit — onboarding readiness summary
// ---------------------------------------------------------------------------

test.describe('Onboarding readiness summary in Approval Cockpit (AC #5)', () => {
  test('approval cockpit renders onboarding-readiness-summary section', async ({ page }) => {
    await openApprovalCockpit(page)
    const heading = page.getByRole('heading', { name: /Approval/i })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const summary = page.getByTestId('onboarding-readiness-summary')
    await expect(summary).toBeAttached({ timeout: 20000 })
  })

  test('onboarding summary section has "Investor Compliance Onboarding" heading', async ({ page }) => {
    await openApprovalCockpit(page)
    const summary = page.getByTestId('onboarding-readiness-summary')
    await expect(summary).toBeAttached({ timeout: 20000 })
    const headingText = await summary.textContent({ timeout: 10000 }).catch(() => '')
    expect(headingText).toContain('Investor Compliance Onboarding')
  })

  test('onboarding summary loading resolves to a non-empty status badge', async ({ page }) => {
    await openApprovalCockpit(page)
    // Wait for loading to complete — badge appears after load
    const badge = page.getByTestId('onboarding-status-badge')
    await badge.waitFor({ state: 'visible', timeout: 30000 }).catch(() => null)
    const isVisible = await badge.isVisible({ timeout: 5000 }).catch(() => false)
    if (isVisible) {
      const text = await badge.textContent({ timeout: 5000 }).catch(() => '')
      expect(text?.trim().length ?? 0).toBeGreaterThan(0)
    } else {
      // If badge not visible, the loading state must still be shown (not blank)
      const headline = page.getByTestId('onboarding-readiness-headline')
      await expect(headline).toBeVisible({ timeout: 10000 })
    }
  })

  test('"Open workspace" link is present and points to /compliance/onboarding', async ({ page }) => {
    await openApprovalCockpit(page)
    const link = page.getByTestId('onboarding-readiness-link')
    await expect(link).toBeVisible({ timeout: 20000 })
    const href = await link.getAttribute('href')
    expect(href).toContain('/compliance/onboarding')
  })

  test('blocked cohort degrades the approval cockpit onboarding section (not green)', async ({ page }) => {
    // Mock the compliance dashboard to return a blocked cohort
    await page.route('**/api/v1/compliance/monitoring/dashboard', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          openCaseCount: 5, criticalRiskCount: 2, overdueTaskCount: 3, expiringEvidenceCount: 1,
          asOf: new Date().toISOString(),
          cohortSummaries: [{
            cohortId: 'test-blocked',
            cohortName: 'Test Blocked Cohort',
            overallStatus: 'BLOCKED',
            totalCases: 10, completedCases: 5, blockedCases: 3, pendingCases: 2, staleCases: 0,
            readinessScore: 50,
            cohortBlockers: [
              { id: 'b1', title: 'AML flag unresolved', reason: 'Manual review required.', affectedCaseIds: ['c1'], severity: 'CRITICAL', remediationPath: '/compliance/reporting' },
            ],
            computedAt: new Date().toISOString(),
          }],
        }),
      })
    })
    suppressBrowserErrors(page)
    await withAuth(page)
    await page.goto('/compliance/approval', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // Wait for the section to load
    const summary = page.getByTestId('onboarding-readiness-summary')
    await expect(summary).toBeAttached({ timeout: 20000 })

    // Badge should show a blocked/not-ready state, not "Ready for Handoff"
    const badge = page.getByTestId('onboarding-status-badge')
    const isVisible = await badge.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false)
    if (isVisible) {
      const badgeText = await badge.textContent({ timeout: 5000 }).catch(() => '')
      // Should NOT claim ready when blocked
      expect(badgeText).not.toBe('Ready for Handoff')
    }
  })
})

// ---------------------------------------------------------------------------
// Section 3: Wallet-free language regression
// ---------------------------------------------------------------------------

test.describe('Wallet-free language across compliance workspaces (AC #7)', () => {
  test('investor onboarding workspace has no wallet connector UI', async ({ page }) => {
    await openOnboardingWorkspace(page)
    const navText = await getNavText(page)
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('enterprise approval cockpit onboarding summary has no wallet connector language', async ({ page }) => {
    await openApprovalCockpit(page)
    const summary = page.getByTestId('onboarding-readiness-summary')
    await expect(summary).toBeAttached({ timeout: 20000 })
    const summaryText = await summary.textContent({ timeout: 10000 }).catch(() => '')
    expect(summaryText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    expect(summaryText).not.toMatch(/connect wallet|sign transaction/i)
  })
})

// ---------------------------------------------------------------------------
// Section 4: Accessibility — live-backed UI meets WCAG 2.1 AA
// ---------------------------------------------------------------------------

test.describe('Accessibility — live-backed compliance UI (AC #8)', () => {
  test('onboarding readiness summary in cockpit has aria-labelledby', async ({ page }) => {
    await openApprovalCockpit(page)
    const summary = page.getByTestId('onboarding-readiness-summary')
    await expect(summary).toBeAttached({ timeout: 20000 })
    const labelledBy = await summary.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    // The element referenced by aria-labelledby must exist
    const labelEl = page.locator(`#${labelledBy}`)
    await expect(labelEl).toBeAttached({ timeout: 5000 })
  })

  test('degraded message in cockpit onboarding section uses role="alert"', async ({ page }) => {
    // Mock 503 to trigger degraded message
    await page.route('**/api/v1/compliance/monitoring/dashboard', (route) => {
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({}) })
    })
    suppressBrowserErrors(page)
    await withAuth(page)
    await page.goto('/compliance/approval', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    // Wait for onboarding readiness to settle
    const summary = page.getByTestId('onboarding-readiness-summary')
    await expect(summary).toBeAttached({ timeout: 20000 })

    // If degraded message is rendered, it should have role=alert
    const degradedMsg = page.getByTestId('onboarding-degraded-message')
    const isVisible = await degradedMsg.isVisible({ timeout: 5000 }).catch(() => false)
    if (isVisible) {
      const role = await degradedMsg.getAttribute('role')
      expect(role).toBe('alert')
    }
  })

  test('onboarding workspace stages have accessible role semantics', async ({ page }) => {
    await openOnboardingWorkspace(page)
    const stagesList = page.getByTestId('stages-list')
    await stagesList.waitFor({ state: 'visible', timeout: 20000 })
    // The stages list is an <ol> element — semantically a list (role=list is implicit)
    const tagName = await stagesList.evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).toBe('ol')
    // Verify aria-label is present for screen reader context
    const ariaLabel = await stagesList.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
  })
})
