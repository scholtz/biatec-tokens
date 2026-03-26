/**
 * E2E Tests: Compliance Evidence Pack Workspace
 *
 * Validates the operator experience for the regulator-ready compliance evidence
 * pack workspace — including route accessibility, release-readiness summary,
 * evidence section inspection, export availability, accessibility semantics,
 * and wallet-free language compliance.
 *
 * Auth strategy: withAuth() (localStorage seeding — no wallet connectors)
 * Route: /compliance/evidence
 *
 * Acceptance Criteria covered:
 *  AC #1  — Authenticated enterprise users can open the workspace from navigation
 *  AC #2  — Workspace shows clearly labelled release-readiness summary
 *  AC #3  — UI explicitly distinguishes release-grade from non-release-grade evidence
 *  AC #4  — Users can inspect evidence by section without leaving the workspace
 *  AC #5  — Page supports keyboard-only use, screen-reader semantics
 *  AC #6  — Workspace provides export actions
 *  AC #7  — Existing enterprise design patterns reused
 *  AC #8  — Copy is wallet-free and uses enterprise operator language
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, clearAuthScript } from './helpers/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openEvidencePack(page: Parameters<typeof withAuth>[0]) {
  suppressBrowserErrors(page)
  await withAuth(page)
  await page.goto('http://localhost:5173/compliance/evidence', { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
}

// ---------------------------------------------------------------------------
// Section 1: Page structure and route accessibility
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — page structure (AC #1, #2, #7)', () => {
  test('route /compliance/evidence is accessible when authenticated', async ({ page }) => {
    await openEvidencePack(page)
    const heading = page.getByRole('heading', { name: /Compliance Evidence Pack/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
  })

  test('page has a single h1 heading (WCAG SC 1.3.1)', async ({ page }) => {
    await openEvidencePack(page)
    const h1s = page.locator('h1')
    await expect(h1s).toHaveCount(1, { timeout: 20000 })
  })

  test('workspace region has role="region" and aria-label', async ({ page }) => {
    await openEvidencePack(page)
    const region = page.locator('[role="region"][aria-label*="Evidence Pack"]')
    await expect(region).toBeAttached({ timeout: 20000 })
  })

  test('in-page skip link targets #evidence-main (WCAG SC 2.4.1)', async ({ page }) => {
    await openEvidencePack(page)
    const skipLink = page.locator('a[href="#evidence-main"]')
    await expect(skipLink).toBeAttached({ timeout: 20000 })
  })
})

// ---------------------------------------------------------------------------
// Section 2: Release readiness summary (AC #2)
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — release readiness summary (AC #2)', () => {
  test('readiness summary banner is visible on load', async ({ page }) => {
    await openEvidencePack(page)
    const banner = page.getByTestId('readiness-summary-banner')
    await expect(banner).toBeVisible({ timeout: 20000 })
  })

  test('overall status label is visible with text', async ({ page }) => {
    await openEvidencePack(page)
    const label = page.getByTestId('overall-status-label')
    await expect(label).toBeVisible({ timeout: 20000 })
    const text = await label.textContent({ timeout: 10000 })
    expect(text?.trim()).toBeTruthy()
  })

  test('overall status icon has role="img" and aria-label (SC 1.4.1)', async ({ page }) => {
    await openEvidencePack(page)
    const icon = page.getByTestId('overall-status-icon')
    await expect(icon).toBeAttached({ timeout: 20000 })
    const ariaLabel = await icon.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
  })

  test('release-grade progress text is visible', async ({ page }) => {
    await openEvidencePack(page)
    const progress = page.getByTestId('release-grade-progress')
    await expect(progress).toBeVisible({ timeout: 20000 })
    const text = await progress.textContent({ timeout: 10000 })
    expect(text).toMatch(/\d+ of \d+/)
  })

  test('export actions container is visible on load', async ({ page }) => {
    await openEvidencePack(page)
    const actions = page.getByTestId('export-actions')
    await expect(actions).toBeVisible({ timeout: 20000 })
  })

  test('Export JSON and Export CSV buttons are visible', async ({ page }) => {
    await openEvidencePack(page)
    await expect(page.getByTestId('export-json-button')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('export-csv-button')).toBeVisible({ timeout: 20000 })
  })
})

// ---------------------------------------------------------------------------
// Section 3: Grade distinction (AC #3, regression)
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — release-grade vs developer-feedback (AC #3)', () => {
  test('grade distinction notice is visible', async ({ page }) => {
    await openEvidencePack(page)
    const notice = page.getByTestId('grade-distinction-notice')
    await expect(notice).toBeVisible({ timeout: 20000 })
  })

  test('grade distinction notice contains "Release-Grade" label text', async ({ page }) => {
    await openEvidencePack(page)
    const notice = page.getByTestId('grade-distinction-notice')
    await expect(notice).toContainText(/Release-Grade/i, { timeout: 20000 })
  })

  test('grade distinction notice contains "Developer Feedback" label text', async ({ page }) => {
    await openEvidencePack(page)
    const notice = page.getByTestId('grade-distinction-notice')
    await expect(notice).toContainText(/Developer Feedback/i, { timeout: 20000 })
  })

  test('grade distinction notice explicitly states developer feedback is NOT release sign-off', async ({ page }) => {
    await openEvidencePack(page)
    const notice = page.getByTestId('grade-distinction-notice')
    const text = await notice.textContent({ timeout: 10000 })
    // Should contain "not" (case insensitive)
    expect(text?.toLowerCase()).toMatch(/not/)
  })
})

// ---------------------------------------------------------------------------
// Section 4: Evidence sections (AC #4)
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — evidence sections (AC #4)', () => {
  test('evidence sections container is visible', async ({ page }) => {
    await openEvidencePack(page)
    const sections = page.getByTestId('evidence-sections')
    await expect(sections).toBeVisible({ timeout: 20000 })
  })

  test('all 5 evidence section cards are visible', async ({ page }) => {
    await openEvidencePack(page)
    const sectionIds = ['accessibility', 'backend-signoff', 'policy-review', 'team-approvals', 'audit-trail']
    for (const id of sectionIds) {
      await expect(page.getByTestId(`evidence-section-${id}`)).toBeVisible({ timeout: 20000 })
    }
  })

  test('each section card has a status badge with text', async ({ page }) => {
    await openEvidencePack(page)
    const badges = page.locator('[data-testid^="section-status-badge-"]')
    const count = await badges.count()
    expect(count).toBe(5)
    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent({ timeout: 5000 })
      expect(text?.trim()).toBeTruthy()
    }
  })

  test('clicking a section toggle expands the section details (AC #4)', async ({ page }) => {
    await openEvidencePack(page)
    const toggle = page.getByTestId('section-toggle-accessibility')
    await toggle.waitFor({ state: 'visible', timeout: 20000 })
    await toggle.click()
    const details = page.getByTestId('section-details-accessibility')
    await expect(details).toBeVisible({ timeout: 10000 })
  })

  test('expanded section contains a list of evidence items', async ({ page }) => {
    await openEvidencePack(page)
    await page.getByTestId('section-toggle-audit-trail').click()
    const details = page.getByTestId('section-details-audit-trail')
    await expect(details).toBeVisible({ timeout: 10000 })
    const listItems = details.locator('li')
    const count = await listItems.count()
    expect(count).toBeGreaterThan(0)
  })

  test('toggle aria-expanded changes to true when section is expanded', async ({ page }) => {
    await openEvidencePack(page)
    const toggle = page.getByTestId('section-toggle-policy-review')
    await toggle.waitFor({ state: 'visible', timeout: 20000 })
    expect(await toggle.getAttribute('aria-expanded')).toBe('false')
    await toggle.click()
    expect(await toggle.getAttribute('aria-expanded')).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// Section 5: Keyboard accessibility (AC #5)
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — keyboard and accessibility (AC #5)', () => {
  test('export buttons are keyboard-focusable (have focus-visible ring classes)', async ({ page }) => {
    await openEvidencePack(page)
    const jsonBtn = page.getByTestId('export-json-button')
    await expect(jsonBtn).toBeVisible({ timeout: 20000 })
    // Verify focus-visible ring class is present in rendered HTML
    const classes = await jsonBtn.getAttribute('class')
    expect(classes).toMatch(/focus-visible:ring/)
  })

  test('section toggle buttons are keyboard-focusable', async ({ page }) => {
    await openEvidencePack(page)
    const toggles = page.locator('[data-testid^="section-toggle-"]')
    const count = await toggles.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const classes = await toggles.nth(i).getAttribute('class')
      expect(classes).toMatch(/focus-visible:ring/)
    }
  })

  test('section toggle buttons have aria-controls attribute (SC 4.1.2)', async ({ page }) => {
    await openEvidencePack(page)
    const toggle = page.getByTestId('section-toggle-accessibility')
    await expect(toggle).toBeAttached({ timeout: 20000 })
    const controls = await toggle.getAttribute('aria-controls')
    expect(controls).toBe('section-details-accessibility')
  })

  test('overall status description has aria-live="polite" (SC 4.1.3)', async ({ page }) => {
    await openEvidencePack(page)
    const desc = page.getByTestId('overall-status-description')
    await expect(desc).toBeAttached({ timeout: 20000 })
    expect(await desc.getAttribute('aria-live')).toBe('polite')
  })

  test('release-grade progress has role="status" (SC 4.1.3)', async ({ page }) => {
    await openEvidencePack(page)
    const progress = page.getByTestId('release-grade-progress')
    await expect(progress).toBeAttached({ timeout: 20000 })
    expect(await progress.getAttribute('role')).toBe('status')
  })

  test('export bundle table has aria-label (SC 1.3.1)', async ({ page }) => {
    await openEvidencePack(page)
    const table = page.locator('table')
    await expect(table).toBeAttached({ timeout: 20000 })
    const ariaLabel = await table.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Section 6: Export actions (AC #6)
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — export actions (AC #6)', () => {
  test('Export JSON button is enabled', async ({ page }) => {
    await openEvidencePack(page)
    const btn = page.getByTestId('export-json-button')
    await expect(btn).toBeVisible({ timeout: 20000 })
    expect(await btn.isDisabled()).toBe(false)
  })

  test('Export CSV button is enabled', async ({ page }) => {
    await openEvidencePack(page)
    const btn = page.getByTestId('export-csv-button')
    await expect(btn).toBeVisible({ timeout: 20000 })
    expect(await btn.isDisabled()).toBe(false)
  })

  test('export bundle table shows section count', async ({ page }) => {
    await openEvidencePack(page)
    const table = page.getByTestId('export-bundle-table')
    await expect(table).toBeVisible({ timeout: 20000 })
    const rows = table.locator('[data-testid^="table-row-"]')
    const count = await rows.count()
    expect(count).toBe(5)
  })

  test('table rows contain grade label text (Release-Grade or Dev Feedback)', async ({ page }) => {
    await openEvidencePack(page)
    const table = page.getByTestId('export-bundle-table')
    await expect(table).toBeVisible({ timeout: 20000 })
    const tableText = await table.textContent({ timeout: 10000 })
    expect(tableText).toMatch(/Release-Grade|Dev Feedback/)
  })
})

// ---------------------------------------------------------------------------
// Section 7: Sidebar navigation link (AC #1)
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — navigation entry point (AC #1)', () => {
  test('sidebar contains "Release Evidence" link', async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
    // Navigate to any MainLayout page to see sidebar
    await page.goto('http://localhost:5173/dashboard', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const link = page.locator('nav[aria-label="Sidebar navigation"]').getByRole('link', { name: /Release Evidence/i })
    await expect(link).toBeAttached({ timeout: 20000 })
    const href = await link.getAttribute('href')
    expect(href).toContain('/compliance/evidence')
  })

  test('"Release Evidence" sidebar link navigates to evidence pack workspace', async ({ page }) => {
    suppressBrowserErrors(page)
    await withAuth(page)
    await page.goto('http://localhost:5173/dashboard', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })

    const link = page.locator('nav[aria-label="Sidebar navigation"]').getByRole('link', { name: /Release Evidence/i })
    await expect(link).toBeAttached({ timeout: 20000 })
    await link.click()
    await page.waitForLoadState('load', { timeout: 10000 })

    await expect(page.getByRole('heading', { name: /Compliance Evidence Pack/i, level: 1 })).toBeVisible({ timeout: 20000 })
  })
})

// ---------------------------------------------------------------------------
// Section 8: Wallet-free language compliance (AC #8)
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — wallet-free language (AC #8)', () => {
  test('page does not contain wallet connector UI elements', async ({ page }) => {
    await openEvidencePack(page)
    const heading = page.getByRole('heading', { name: /Compliance Evidence Pack/i })
    await expect(heading).toBeVisible({ timeout: 20000 })

    // Check nav does not show wallet UI
    const nav = page.locator('nav[aria-label="Main navigation"]').first()
    const navText = await nav.textContent({ timeout: 10000 }).catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('page body does not contain wallet connector call-to-action language', async ({ page }) => {
    await openEvidencePack(page)
    const workspace = page.getByTestId('evidence-pack-workspace')
    await expect(workspace).toBeVisible({ timeout: 20000 })
    const text = await workspace.textContent({ timeout: 10000 })
    // Use specific brand names only to avoid false positives on informational copy
    expect(text).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
    expect(text?.toLowerCase()).not.toMatch(/sign transaction/)
  })

  test('page contains enterprise operator language', async ({ page }) => {
    await openEvidencePack(page)
    const workspace = page.getByTestId('evidence-pack-workspace')
    await expect(workspace).toBeVisible({ timeout: 20000 })
    const text = await workspace.textContent({ timeout: 10000 })
    // Should contain evidence/compliance/operator language
    expect(text?.toLowerCase()).toMatch(/evidence|compliance|release|audit/)
  })
})

// ---------------------------------------------------------------------------
// Section 9: Unauthenticated redirect
// ---------------------------------------------------------------------------

test.describe('Compliance Evidence Pack — unauthenticated redirect', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await clearAuthScript(page)
  })

  test('redirects unauthenticated users away from /compliance/evidence', async ({ page }) => {
    await page.goto('http://localhost:5173/compliance/evidence', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    // Semantic wait: poll until the URL has changed away from the protected route
    // or an auth form / auth query param has appeared (all are valid redirect signals).
    await page.waitForFunction(
      () => {
        const url = window.location.href
        const redirectedAway = !url.includes('/compliance/evidence')
        const hasAuthParam = url.includes('showAuth=true')
        const showsAuthModal = !!document.querySelector('form')
        return redirectedAway || hasAuthParam || showsAuthModal
      },
      { timeout: 8000 },
    ).catch(() => {/* still assert below — allows partial signal */})

    const url = page.url()
    const redirectedAway = !url.includes('/compliance/evidence')
    const hasAuthParam = url.includes('showAuth=true')
    const showsAuthModal = await page
      .locator('form').filter({ hasText: /email/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false)

    expect(redirectedAway || showsAuthModal || hasAuthParam).toBe(true)
  })
})
