/**
 * E2E Tests: Enterprise Approval Queue — Release Sign-Off Cockpit
 *
 * Verifies the complete enterprise approval experience:
 *
 * AC #1  — cockpit is reachable from compliance navigation at /compliance/approval
 * AC #2  — four review stages rendered: compliance, legal, procurement, executive
 * AC #3  — each stage shows owner label, status, summary, evidence links
 * AC #4  — top release blockers section summarizes critical items
 * AC #5  — release recommendation banner communicates posture in plain language
 * AC #6  — blocking stage alert identifies the current bottleneck
 * AC #7  — stage expand/collapse works via click
 * AC #8  — workspace navigation links are present and accessible
 * AC #9  — keyboard-only navigation works across the stage list
 * AC #10 — no wallet connector UI present
 * AC #11 — auth-required: unauthenticated users are redirected
 * AC #12 — accessibility: ARIA landmarks, status roles, screen-reader semantics
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, clearAuthScript } from './helpers/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openCockpit(page: Parameters<typeof withAuth>[0]) {
  suppressBrowserErrors(page)
  await withAuth(page)
  await page.goto('/compliance/approval', { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
}

// ---------------------------------------------------------------------------
// Section 1: Route accessibility and page structure
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — page structure', () => {
  test('route /compliance/approval is accessible when authenticated (AC #1)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
  })

  test('page title is Enterprise Approval Queue', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
  })

  test('cockpit root container is present', async ({ page }) => {
    await openCockpit(page)
    const root = page.getByTestId('approval-cockpit')
    await expect(root).toBeAttached({ timeout: 20000 })
  })

  test('page has a skip-to-main-content link', async ({ page }) => {
    await openCockpit(page)
    const skip = page.locator('a[href="#approval-cockpit-main"]')
    await expect(skip).toBeAttached({ timeout: 15000 })
  })

  test('main content region has role="region" with aria-label', async ({ page }) => {
    await openCockpit(page)
    const region = page.locator('[data-testid="approval-cockpit"][role="region"]')
    await expect(region).toBeAttached({ timeout: 15000 })
    const label = await region.getAttribute('aria-label')
    expect(label).toBeTruthy()
    expect(label).toContain('Approval')
  })

  test('page renders the cockpit header', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('cockpit-header')
    await expect(header).toBeVisible({ timeout: 20000 })
  })

  test('disclaimer text is present', async ({ page }) => {
    await openCockpit(page)
    const disclaimer = page.getByTestId('cockpit-disclaimer')
    await expect(disclaimer).toBeVisible({ timeout: 20000 })
    const text = await disclaimer.textContent()
    expect(text).toContain('frontend-derived')
  })
})

// ---------------------------------------------------------------------------
// Section 2: Release posture banner (AC #5)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — release posture banner', () => {
  test('release posture banner is visible (AC #5)', async ({ page }) => {
    await openCockpit(page)
    const banner = page.getByTestId('release-posture-banner')
    await expect(banner).toBeVisible({ timeout: 20000 })
  })

  test('posture headline is shown', async ({ page }) => {
    await openCockpit(page)
    const headline = page.getByTestId('posture-headline')
    await expect(headline).toBeVisible({ timeout: 20000 })
    const text = await headline.textContent()
    expect(text!.length).toBeGreaterThan(0)
  })

  test('posture rationale is shown', async ({ page }) => {
    await openCockpit(page)
    const rationale = page.getByTestId('posture-rationale')
    await expect(rationale).toBeVisible({ timeout: 20000 })
  })

  test('posture stats dl shows stages counts', async ({ page }) => {
    await openCockpit(page)
    const stats = page.getByTestId('posture-stats')
    await expect(stats).toBeVisible({ timeout: 20000 })
  })

  test('posture badge has role="status" for screen-readers (AC #8)', async ({ page }) => {
    await openCockpit(page)
    const badge = page.getByTestId('posture-badge')
    await expect(badge).toBeAttached({ timeout: 15000 })
    const role = await badge.getAttribute('role')
    expect(role).toBe('status')
  })
})

// ---------------------------------------------------------------------------
// Section 3: Review stages (AC #2, #3)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — review stages', () => {
  test('stages section is visible (AC #2)', async ({ page }) => {
    await openCockpit(page)
    const section = page.getByTestId('stages-section')
    await expect(section).toBeVisible({ timeout: 20000 })
  })

  test('stages list is present and is an ordered list', async ({ page }) => {
    await openCockpit(page)
    const list = page.getByTestId('stages-list')
    await expect(list).toBeVisible({ timeout: 20000 })
    const tag = await list.evaluate((el) => el.tagName)
    expect(tag).toBe('OL')
  })

  test('compliance-review stage card is rendered (AC #2)', async ({ page }) => {
    await openCockpit(page)
    const card = page.getByTestId('stage-card-compliance-review')
    await expect(card).toBeVisible({ timeout: 20000 })
  })

  test('legal-review stage card is rendered (AC #2)', async ({ page }) => {
    await openCockpit(page)
    const card = page.getByTestId('stage-card-legal-review')
    await expect(card).toBeVisible({ timeout: 20000 })
  })

  test('procurement-review stage card is rendered (AC #2)', async ({ page }) => {
    await openCockpit(page)
    const card = page.getByTestId('stage-card-procurement-review')
    await expect(card).toBeVisible({ timeout: 20000 })
  })

  test('executive-sign-off stage card is rendered (AC #2)', async ({ page }) => {
    await openCockpit(page)
    const card = page.getByTestId('stage-card-executive-sign-off')
    await expect(card).toBeVisible({ timeout: 20000 })
  })

  test('each stage card shows a status badge (AC #3)', async ({ page }) => {
    await openCockpit(page)
    const stageIds = ['compliance-review', 'legal-review', 'procurement-review', 'executive-sign-off']
    for (const id of stageIds) {
      const badge = page.getByTestId(`stage-status-${id}`)
      await expect(badge).toBeVisible({ timeout: 15000 })
      const text = await badge.textContent()
      expect(text!.trim().length).toBeGreaterThan(0)
    }
  })

  test('each stage card shows a reviewer role label (AC #3)', async ({ page }) => {
    await openCockpit(page)
    const stageIds = ['compliance-review', 'legal-review', 'procurement-review', 'executive-sign-off']
    for (const id of stageIds) {
      const role = page.getByTestId(`stage-role-${id}`)
      await expect(role).toBeVisible({ timeout: 15000 })
      const text = await role.textContent()
      expect(text!.trim().length).toBeGreaterThan(0)
    }
  })

  test('legal-review stage shows "Blocked" status (AC #3)', async ({ page }) => {
    await openCockpit(page)
    const badge = page.getByTestId('stage-status-legal-review')
    await expect(badge).toBeVisible({ timeout: 15000 })
    const text = await badge.textContent()
    expect(text!.toLowerCase()).toContain('blocked')
  })

  test('stage headers have role="button" for keyboard accessibility (AC #8)', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-compliance-review')
    await expect(header).toBeAttached({ timeout: 15000 })
    const role = await header.getAttribute('role')
    expect(role).toBe('button')
  })

  test('stage headers have tabindex="0" for keyboard focus (AC #8)', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-compliance-review')
    await expect(header).toBeAttached({ timeout: 15000 })
    const tabindex = await header.getAttribute('tabindex')
    expect(tabindex).toBe('0')
  })
})

// ---------------------------------------------------------------------------
// Section 4: Stage expand/collapse and blockers (AC #4)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — stage expand and blockers', () => {
  test('clicking compliance-review header expands it to show blockers (AC #4)', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-compliance-review')
    await expect(header).toBeVisible({ timeout: 20000 })
    await header.click()
    const blockersList = page.getByTestId('stage-blockers-compliance-review')
    await expect(blockersList).toBeVisible({ timeout: 10000 })
  })

  test('clicking legal-review header shows critical blocker (AC #4)', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-legal-review')
    await expect(header).toBeVisible({ timeout: 20000 })
    await header.click()
    const blockersList = page.getByTestId('stage-blockers-legal-review')
    await expect(blockersList).toBeVisible({ timeout: 10000 })
  })

  test('clicking procurement-review header shows no-blockers state (AC #4)', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-procurement-review')
    await expect(header).toBeVisible({ timeout: 20000 })
    await header.click()
    const noBlockers = page.getByTestId('stage-no-blockers-procurement-review')
    await expect(noBlockers).toBeVisible({ timeout: 10000 })
  })

  test('expanded stage shows review scope text', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-compliance-review')
    await header.click()
    const scope = page.getByTestId('stage-scope-compliance-review')
    await expect(scope).toBeVisible({ timeout: 10000 })
    const text = await scope.textContent()
    expect(text!.length).toBeGreaterThan(0)
  })

  test('expanded stage shows evidence links (AC #3)', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-compliance-review')
    await header.click()
    const links = page.getByTestId('stage-evidence-links-compliance-review')
    await expect(links).toBeVisible({ timeout: 10000 })
  })

  test('blocker shows severity badge and title', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-legal-review')
    await header.click()
    // Scope to the expanded stage body to avoid matching hidden blocker elements
    // in other collapsed stages (v-show keeps them in DOM but hidden)
    const stageBody = page.getByTestId('stage-body-legal-review')
    const blockerTitle = stageBody.locator('[data-testid^="blocker-title-"]').first()
    await expect(blockerTitle).toBeVisible({ timeout: 10000 })
    const text = await blockerTitle.textContent()
    expect(text!.length).toBeGreaterThan(0)
  })

  test('launch-blocking indicator is visible for critical blockers', async ({ page }) => {
    await openCockpit(page)
    const header = page.getByTestId('stage-header-legal-review')
    await header.click()
    // Scope to the expanded stage body to avoid matching hidden indicators
    // in other collapsed stages (v-show keeps them in DOM but hidden)
    const stageBody = page.getByTestId('stage-body-legal-review')
    const indicator = stageBody.locator('[data-testid^="blocker-launch-blocking-"]').first()
    await expect(indicator).toBeVisible({ timeout: 10000 })
  })
})

// ---------------------------------------------------------------------------
// Section 5: Top blockers section (AC #4)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — top blockers', () => {
  test('top-blockers-section is visible (AC #4)', async ({ page }) => {
    await openCockpit(page)
    const section = page.getByTestId('top-blockers-section')
    await expect(section).toBeVisible({ timeout: 20000 })
  })

  test('top-blockers-section has correct aria-labelledby', async ({ page }) => {
    await openCockpit(page)
    const section = page.getByTestId('top-blockers-section')
    await expect(section).toBeAttached({ timeout: 15000 })
    const labelledby = await section.getAttribute('aria-labelledby')
    expect(labelledby).toBe('top-blockers-heading')
  })

  test('top-blockers list is an ordered list', async ({ page }) => {
    await openCockpit(page)
    const list = page.getByTestId('top-blockers-list')
    await expect(list).toBeVisible({ timeout: 20000 })
    const tag = await list.evaluate((el) => el.tagName)
    expect(tag).toBe('OL')
  })

  test('top-blockers count badge shows a number greater than zero', async ({ page }) => {
    await openCockpit(page)
    const count = page.getByTestId('top-blockers-count')
    await expect(count).toBeVisible({ timeout: 20000 })
    const text = await count.textContent()
    expect(Number(text!.trim())).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Section 6: Blocking stage alert (AC #6)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — blocking stage alert', () => {
  test('blocking-stage-alert is visible when a stage is blocked (AC #6)', async ({ page }) => {
    await openCockpit(page)
    const alert = page.getByTestId('blocking-stage-alert')
    await expect(alert).toBeVisible({ timeout: 20000 })
  })

  test('blocking-stage-alert has role="alert" for screen-readers (AC #8)', async ({ page }) => {
    await openCockpit(page)
    const alert = page.getByTestId('blocking-stage-alert')
    await expect(alert).toBeAttached({ timeout: 15000 })
    const role = await alert.getAttribute('role')
    expect(role).toBe('alert')
  })

  test('blocking-stage-alert identifies the blocking stage name', async ({ page }) => {
    await openCockpit(page)
    const alert = page.getByTestId('blocking-stage-alert')
    await expect(alert).toBeVisible({ timeout: 20000 })
    const text = await alert.textContent()
    // Should mention either compliance or legal review
    expect(text).toMatch(/compliance|legal/i)
  })
})

// ---------------------------------------------------------------------------
// Section 7: Workspace navigation links (AC #1)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — navigation links', () => {
  test('cockpit-nav is present with aria-label (AC #1)', async ({ page }) => {
    await openCockpit(page)
    const nav = page.getByTestId('cockpit-nav')
    await expect(nav).toBeVisible({ timeout: 20000 })
    const label = await nav.getAttribute('aria-label')
    expect(label).toBeTruthy()
  })

  test('workspace link to /compliance/launch exists', async ({ page }) => {
    await openCockpit(page)
    const nav = page.getByTestId('cockpit-nav')
    await expect(nav).toBeVisible({ timeout: 20000 })
    const link = nav.getByRole('link', { name: /Compliance Launch Console/i })
    await expect(link).toBeVisible({ timeout: 10000 })
  })

  test('workspace link to /compliance/evidence exists', async ({ page }) => {
    await openCockpit(page)
    const nav = page.getByTestId('cockpit-nav')
    const link = nav.getByRole('link', { name: /Evidence Pack/i })
    await expect(link).toBeVisible({ timeout: 10000 })
  })

  test('sidebar contains Approval Queue link', async ({ page }) => {
    await openCockpit(page)
    // After page load, the sidebar link should be present and marked active
    const sidebar = page.locator('[aria-label="Sidebar navigation"]')
    await expect(sidebar).toBeAttached({ timeout: 20000 })
    const approvalLink = sidebar.getByRole('link', { name: /Approval Queue/i })
    await expect(approvalLink).toBeVisible({ timeout: 15000 })
  })
})

// ---------------------------------------------------------------------------
// Section 8: Keyboard navigation (AC #8)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — keyboard accessibility', () => {
  test('stage header can receive keyboard focus', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })

    // Give the page keyboard focus by clicking body
    await page.locator('body').click()
    await page.keyboard.press('Tab')

    const hasFocusedElement = await page.evaluate(() => {
      const active = document.activeElement
      return active !== null && active !== document.body && active !== document.documentElement
    })
    expect(hasFocusedElement).toBe(true)
  })

  test('refresh button is keyboard-accessible with aria-label', async ({ page }) => {
    await openCockpit(page)
    const btn = page.getByTestId('refresh-btn')
    await expect(btn).toBeVisible({ timeout: 20000 })
    const label = await btn.getAttribute('aria-label')
    expect(label).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Section 9: No wallet connector UI (AC #10, business roadmap requirement)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — wallet-free', () => {
  test('no wallet connector UI in main navigation (AC #10)', async ({ page }) => {
    await openCockpit(page)
    const nav = page.locator('nav[aria-label="Main navigation"]').first()
    await expect(nav).toBeAttached({ timeout: 20000 })
    const navText = await nav.textContent({ timeout: 10000 }).catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('no wallet connector UI in cockpit content', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const cockpit = page.getByTestId('approval-cockpit')
    const text = await cockpit.textContent({ timeout: 10000 }).catch(() => '')
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    expect(text).not.toContain('sign transaction')
    expect(text).not.toContain('approve in wallet')
  })
})

// ---------------------------------------------------------------------------
// Section 10: Auth redirect (AC #11)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — authentication guard', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await clearAuthScript(page)
  })

  test('unauthenticated users are redirected away from /compliance/approval (AC #11)', async ({ page }) => {
    await page.goto('/compliance/approval', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    // Semantic wait: poll until the URL has changed away from the protected route
    // or an auth form / auth query param has appeared (all are valid redirect signals).
    await page.waitForFunction(
      () => {
        const url = window.location.href
        const redirectedAway = !url.includes('/compliance/approval')
        const hasAuthParam = url.includes('showAuth=true')
        const showsAuthModal = !!document.querySelector('form')
        return redirectedAway || hasAuthParam || showsAuthModal
      },
      { timeout: 8000 },
    ).catch(() => {/* still assert below — allows partial signal */})

    const url = page.url()
    const redirectedAway = !url.includes('/compliance/approval')
    const hasAuthParam = url.includes('showAuth=true')
    const showsAuthModal = await page
      .locator('form').filter({ hasText: /email/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false)

    expect(redirectedAway || showsAuthModal || hasAuthParam).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 11: Remediation Workflow Panel (new feature)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — remediation workflow panel', () => {
  test('remediation task panel is present on the page', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('remediation-task-panel')
    await expect(panel).toBeAttached({ timeout: 20000 })
  })

  test('remediation panel has the Remediation Workflow heading', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panelTitle = page.getByTestId('remediation-panel-title')
    await expect(panelTitle).toBeVisible({ timeout: 20000 })
    const text = await panelTitle.textContent({ timeout: 5000 })
    expect(text).toContain('Remediation Workflow')
  })

  test('remediation stats section is rendered', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const stats = page.getByTestId('remediation-stats')
    await expect(stats).toBeAttached({ timeout: 20000 })
  })

  test('remediation blocking count is shown', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const count = page.getByTestId('remediation-blocking-count')
    await expect(count).toBeVisible({ timeout: 20000 })
    const text = await count.textContent({ timeout: 5000 })
    // Should be a number (there are blockers in the default state)
    expect(text?.trim()).toMatch(/^\d+$/)
  })

  test('remediation stage groups are rendered for stages with tasks', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const groups = page.getByTestId('remediation-stage-groups')
    await expect(groups).toBeAttached({ timeout: 20000 })
  })

  test('compliance-review group header is shown with blocking count badge', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    // Wait for stage groups to render
    const groups = page.getByTestId('remediation-stage-groups')
    await expect(groups).toBeAttached({ timeout: 20000 })
    const groupHeader = page.getByTestId('remediation-group-header-compliance-review')
    await expect(groupHeader).toBeAttached({ timeout: 15000 })
  })

  test('legal-review group header is shown', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const groups = page.getByTestId('remediation-stage-groups')
    await expect(groups).toBeAttached({ timeout: 20000 })
    const groupHeader = page.getByTestId('remediation-group-header-legal-review')
    await expect(groupHeader).toBeAttached({ timeout: 15000 })
  })

  test('auto-expanded blocking group shows blocking section heading', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    // Compliance review has blocking tasks and is auto-expanded
    const blockingHeading = page.getByTestId('remediation-blocking-heading-compliance-review')
    await expect(blockingHeading).toBeAttached({ timeout: 20000 })
  })

  test('group header has role="button" with aria-expanded for accessibility', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const groups = page.getByTestId('remediation-stage-groups')
    await expect(groups).toBeAttached({ timeout: 20000 })
    const header = page.getByTestId('remediation-group-header-compliance-review')
    await expect(header).toBeAttached({ timeout: 15000 })
    const role = await header.getAttribute('role')
    expect(role).toBe('button')
    const expanded = await header.getAttribute('aria-expanded')
    expect(['true', 'false']).toContain(expanded)
  })

  test('panel section has aria-labelledby for screen readers', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('remediation-task-panel')
    await expect(panel).toBeAttached({ timeout: 20000 })
    const labelledBy = await panel.getAttribute('aria-labelledby')
    expect(labelledBy).toBe('remediation-panel-heading')
  })

  test('remediation panel disclaimer is present', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const disclaimer = page.getByTestId('remediation-panel-disclaimer')
    await expect(disclaimer).toBeAttached({ timeout: 20000 })
    const text = await disclaimer.textContent({ timeout: 5000 }).catch(() => '')
    expect(text).toContain('Remediation tasks')
  })

  test('cockpit remediation panel contains no wallet connector UI', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('remediation-task-panel')
    await expect(panel).toBeAttached({ timeout: 20000 })
    const text = await panel.textContent({ timeout: 5000 }).catch(() => '')
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})

// ---------------------------------------------------------------------------
// Section 8: Strict Sign-Off Readiness Workspace (new AC #13–AC #22)
// ---------------------------------------------------------------------------

test.describe('Enterprise Approval Queue — strict sign-off readiness workspace', () => {
  test('sign-off readiness panel is present on the cockpit page (AC #1)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('sign-off-readiness-panel')
    await expect(panel).toBeAttached({ timeout: 20000 })
  })

  test('readiness panel heading is "Strict Sign-Off Readiness"', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const readinessHeading = page.getByTestId('readiness-heading')
    await readinessHeading.waitFor({ state: 'visible', timeout: 20000 })
    const text = await readinessHeading.textContent({ timeout: 5000 }).catch(() => '')
    expect(text).toContain('Strict Sign-Off Readiness')
  })

  test('readiness state badge is present with role="status" (AC #2, AC #5)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const badge = page.getByTestId('readiness-state-badge')
    await expect(badge).toBeAttached({ timeout: 20000 })
    const role = await badge.getAttribute('role')
    expect(role).toBe('status')
  })

  test('readiness state badge shows a labeled state (not color-only) (AC #5)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const badge = page.getByTestId('readiness-state-badge')
    await badge.waitFor({ state: 'visible', timeout: 20000 })
    const text = await badge.textContent({ timeout: 5000 }).catch(() => '')
    expect(text).toBeTruthy()
    expect(text!.trim().length).toBeGreaterThan(0)
    const ariaLabel = await badge.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
  })

  test('readiness summary banner is a region landmark with aria-label (AC #5)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const banner = page.getByTestId('readiness-summary-banner')
    await expect(banner).toBeAttached({ timeout: 20000 })
    const role = await banner.getAttribute('role')
    expect(role).toBe('region')
    const ariaLabel = await banner.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.toLowerCase()).toContain('readiness')
  })

  test('blocking count stat is visible in readiness panel (AC #2)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const blockingCount = page.getByTestId('readiness-blocking-count')
    await expect(blockingCount).toBeAttached({ timeout: 20000 })
  })

  test('stale count stat is visible in readiness panel (AC #2)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const staleCount = page.getByTestId('readiness-stale-count')
    await expect(staleCount).toBeAttached({ timeout: 20000 })
  })

  test('last-run bar is visible and shows freshness (AC #5)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const lastRunBar = page.getByTestId('last-run-bar')
    await expect(lastRunBar).toBeAttached({ timeout: 20000 })
    const runLabel = page.getByTestId('last-run-label')
    await expect(runLabel).toBeAttached({ timeout: 10000 })
    const text = await runLabel.textContent({ timeout: 5000 }).catch(() => '')
    expect(text).toBeTruthy()
    // Default state: no protected run recorded yet
    const ariaLabel = await runLabel.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.toLowerCase()).toContain('last protected sign-off evidence')
  })

  test('configuration blocked alert is visible for MVP blocking state (AC #3, AC #9)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const configAlert = page.getByTestId('config-blocked-alert')
    await expect(configAlert).toBeAttached({ timeout: 20000 })
    const role = await configAlert.getAttribute('role')
    expect(role).toBe('alert')
  })

  test('config blocked alert explains operational (not product) gap (AC #9)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const configAlert = page.getByTestId('config-blocked-alert')
    await configAlert.waitFor({ state: 'visible', timeout: 20000 })
    const text = await configAlert.textContent({ timeout: 5000 }).catch(() => '')
    // Must communicate this is an OPERATIONAL gap (missing env/credentials),
    // not a product/feature bug — per AC #9 and the roadmap blocker narrative.
    const lower = (text ?? '').toLowerCase()
    const mentionsCredentials = lower.includes('credentials') || lower.includes('credential')
    const mentionsEnvOrConfig = lower.includes('environment') || lower.includes('config')
    const mentionsProtectedLane = lower.includes('protected') || lower.includes('sign-off')
    expect(mentionsCredentials || mentionsEnvOrConfig).toBe(true)
    expect(mentionsProtectedLane).toBe(true)
  })

  test('evidence dimensions list is rendered (AC #1)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const dimensionsHeading = page.getByTestId('dimensions-heading')
    await expect(dimensionsHeading).toBeAttached({ timeout: 20000 })
    const dimensionsList = page.getByTestId('dimensions-list')
    await expect(dimensionsList).toBeAttached({ timeout: 10000 })
    const items = await dimensionsList.locator('li').all()
    expect(items.length).toBeGreaterThanOrEqual(3)
  })

  test('dimension cards show state badges with aria-labels (AC #5)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('sign-off-readiness-panel')
    await expect(panel).toBeAttached({ timeout: 20000 })
    // Find dimension state badges in the panel
    const stateBadges = panel.locator('[data-testid^="dimension-state-"]')
    const count = await stateBadges.count()
    expect(count).toBeGreaterThanOrEqual(3)
    // First badge should have aria-label
    if (count > 0) {
      const firstAriaLabel = await stateBadges.first().getAttribute('aria-label')
      expect(firstAriaLabel).toBeTruthy()
      expect(firstAriaLabel!.toLowerCase()).toContain('evidence state')
    }
  })

  test('next actions section is visible (AC #4)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const nextActionsSection = page.getByTestId('next-actions-section')
    await expect(nextActionsSection).toBeAttached({ timeout: 20000 })
    const nextActionsHeading = page.getByTestId('next-actions-heading')
    await expect(nextActionsHeading).toBeAttached({ timeout: 10000 })
  })

  test('next actions show owner domain attribution (AC #4)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('sign-off-readiness-panel')
    await expect(panel).toBeAttached({ timeout: 20000 })
    // Owner badges on next actions
    const ownerBadges = panel.locator('[data-testid^="next-action-owner-"]')
    const count = await ownerBadges.count()
    expect(count).toBeGreaterThanOrEqual(1)
    if (count > 0) {
      const ariaLabel = await ownerBadges.first().getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel!.toLowerCase()).toContain('action owner')
    }
  })

  test('launch-blocking badge is present on at least one next action (AC #3)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('sign-off-readiness-panel')
    await expect(panel).toBeAttached({ timeout: 20000 })
    const blockingBadges = panel.locator('[data-testid^="next-action-blocking-"]')
    const count = await blockingBadges.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('product-vs-evidence notice is visible (AC #6)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const notice = page.getByTestId('product-vs-evidence-notice')
    await expect(notice).toBeAttached({ timeout: 20000 })
    const role = await notice.getAttribute('role')
    expect(role).toBe('note')
  })

  test('product-vs-evidence notice distinguishes feature delivery from evidence (AC #6)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const notice = page.getByTestId('product-vs-evidence-notice')
    await notice.waitFor({ state: 'visible', timeout: 20000 })
    const text = await notice.textContent({ timeout: 5000 }).catch(() => '')
    // Should explain that product functionality is delivered but evidence is pending
    const distinguishesFeatureVsEvidence = (text ?? '').toLowerCase().includes('delivered') ||
      (text ?? '').toLowerCase().includes('implemented') ||
      (text ?? '').toLowerCase().includes('operational')
    expect(distinguishesFeatureVsEvidence).toBe(true)
  })

  test('readiness panel contains no wallet connector UI (AC #7)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('sign-off-readiness-panel')
    await expect(panel).toBeAttached({ timeout: 20000 })
    const text = await panel.textContent({ timeout: 5000 }).catch(() => '')
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('readiness panel uses enterprise compliance language (AC #7)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    const panel = page.getByTestId('sign-off-readiness-panel')
    await panel.waitFor({ state: 'visible', timeout: 20000 })
    const text = await panel.textContent({ timeout: 5000 }).catch(() => '')
    // Should use enterprise compliance language
    const usesComplianceLanguage =
      (text ?? '').toLowerCase().includes('evidence') ||
      (text ?? '').toLowerCase().includes('sign-off') ||
      (text ?? '').toLowerCase().includes('compliance')
    expect(usesComplianceLanguage).toBe(true)
  })

  test('readiness panel is keyboard-navigable (evidence links are focusable) (AC #5)', async ({ page }) => {
    await openCockpit(page)
    const heading = page.getByRole('heading', { name: /Enterprise Approval Queue/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    const panel = page.getByTestId('sign-off-readiness-panel')
    await panel.waitFor({ state: 'visible', timeout: 20000 })
    // Evidence links inside the panel are keyboard-focusable interactive elements
    const evidenceLinks = panel.locator('[data-testid^="dimension-link-"]')
    const linkCount = await evidenceLinks.count()
    expect(linkCount).toBeGreaterThanOrEqual(1)
    // Focus the first evidence link directly and verify it receives focus
    await evidenceLinks.first().focus()
    const hasFocusedLink = await page.evaluate(() => {
      const active = document.activeElement
      return active !== null && active !== document.body && active !== document.documentElement
    })
    expect(hasFocusedLink).toBe(true)
  })
})
