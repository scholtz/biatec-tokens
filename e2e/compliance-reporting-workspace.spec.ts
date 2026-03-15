/**
 * E2E Tests: Compliance Reporting Workspace
 *
 * Validates the operator experience for the enterprise compliance reporting
 * workspace — route accessibility, readiness banner, subsection visibility,
 * export actions, workspace navigation, wallet-free language, and keyboard
 * accessibility.
 *
 * Auth strategy: withAuth() (localStorage seeding — no wallet connectors)
 * Route: /compliance/reporting
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, clearAuthScript } from './helpers/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openReportingWorkspace(page: Parameters<typeof withAuth>[0]) {
  suppressBrowserErrors(page)
  await withAuth(page)
  await page.goto('http://localhost:5173/compliance/reporting', { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
}

// ---------------------------------------------------------------------------
// Section 1: Page structure and route accessibility
// ---------------------------------------------------------------------------

test.describe('Compliance Reporting Workspace — page structure', () => {
  test('route /compliance/reporting is accessible when authenticated', async ({ page }) => {
    await openReportingWorkspace(page)
    const heading = page.getByRole('heading', { name: /Compliance Reporting Workspace/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
  })

  test('page has a single h1 heading (WCAG SC 1.3.1)', async ({ page }) => {
    await openReportingWorkspace(page)
    const h1s = page.locator('h1')
    await expect(h1s).toHaveCount(1, { timeout: 20000 })
  })

  test('workspace region has role="region" with aria-label', async ({ page }) => {
    await openReportingWorkspace(page)
    const region = page.locator('[role="region"][aria-label*="Compliance Reporting"]')
    await expect(region).toBeAttached({ timeout: 20000 })
  })

  test('skip link targeting #reporting-main is present (WCAG SC 2.4.1)', async ({ page }) => {
    await openReportingWorkspace(page)
    const skipLink = page.locator('a[href="#reporting-main"]')
    await expect(skipLink).toBeAttached({ timeout: 20000 })
  })

  test('reporting header section is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const header = page.getByTestId('reporting-header')
    await expect(header).toBeAttached({ timeout: 20000 })
  })
})

// ---------------------------------------------------------------------------
// Section 2: Overall status banner
// ---------------------------------------------------------------------------

test.describe('Compliance Reporting Workspace — status banner', () => {
  test('overall status banner is visible', async ({ page }) => {
    await openReportingWorkspace(page)
    const banner = page.getByTestId('overall-status-banner')
    await expect(banner).toBeVisible({ timeout: 30000 })
  })

  test('overall status label element is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const label = page.getByTestId('overall-status-label')
    await expect(label).toBeVisible({ timeout: 20000 })
    const text = await label.textContent({ timeout: 10000 })
    expect(text?.length).toBeGreaterThan(5)
  })

  test('readiness score value is rendered', async ({ page }) => {
    await openReportingWorkspace(page)
    const score = page.getByTestId('readiness-score-value')
    await expect(score).toBeVisible({ timeout: 20000 })
  })

  test('readiness score bar has progressbar role with ARIA attrs', async ({ page }) => {
    await openReportingWorkspace(page)
    const bar = page.locator('[role="progressbar"]')
    await expect(bar).toBeAttached({ timeout: 20000 })
    const valueMin = await bar.getAttribute('aria-valuemin')
    const valueMax = await bar.getAttribute('aria-valuemax')
    expect(valueMin).toBe('0')
    expect(valueMax).toBe('100')
  })
})

// ---------------------------------------------------------------------------
// Section 3: Subsections
// ---------------------------------------------------------------------------

test.describe('Compliance Reporting Workspace — subsections', () => {
  test('jurisdiction section is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const section = page.getByTestId('jurisdiction-section')
    await expect(section).toBeVisible({ timeout: 20000 })
  })

  test('investor eligibility section is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const section = page.getByTestId('investor-eligibility-section')
    await expect(section).toBeVisible({ timeout: 20000 })
  })

  test('KYC/AML section is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const section = page.getByTestId('kyc-aml-section')
    await expect(section).toBeVisible({ timeout: 20000 })
  })

  test('whitelist section is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const section = page.getByTestId('whitelist-section')
    await expect(section).toBeVisible({ timeout: 20000 })
  })

  test('evidence summary section is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const section = page.getByTestId('evidence-summary-section')
    await expect(section).toBeVisible({ timeout: 20000 })
  })

  test('evidence pack link points to /compliance/evidence', async ({ page }) => {
    await openReportingWorkspace(page)
    const link = page.getByTestId('evidence-pack-link')
    await expect(link).toBeAttached({ timeout: 20000 })
    const href = await link.getAttribute('href')
    expect(href).toContain('/compliance/evidence')
  })
})

// ---------------------------------------------------------------------------
// Section 4: Export actions
// ---------------------------------------------------------------------------

test.describe('Compliance Reporting Workspace — export actions', () => {
  test('export actions section is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const section = page.getByTestId('export-actions-section')
    await expect(section).toBeVisible({ timeout: 20000 })
  })

  test('Export JSON button is visible and enabled', async ({ page }) => {
    await openReportingWorkspace(page)
    const btn = page.getByTestId('export-json-button')
    await expect(btn).toBeVisible({ timeout: 20000 })
    await expect(btn).toBeEnabled()
  })

  test('Export Text Report button is visible and enabled', async ({ page }) => {
    await openReportingWorkspace(page)
    const btn = page.getByTestId('export-text-button')
    await expect(btn).toBeVisible({ timeout: 20000 })
    await expect(btn).toBeEnabled()
  })

  test('Copy to Clipboard button is visible', async ({ page }) => {
    await openReportingWorkspace(page)
    const btn = page.getByTestId('copy-clipboard-button')
    await expect(btn).toBeVisible({ timeout: 20000 })
  })
})

// ---------------------------------------------------------------------------
// Section 5: Workspace navigation
// ---------------------------------------------------------------------------

test.describe('Compliance Reporting Workspace — navigation links', () => {
  test('workspace-nav element is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const nav = page.getByTestId('workspace-nav')
    await expect(nav).toBeAttached({ timeout: 20000 })
  })

  test('back-link to /compliance/launch is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const link = page.getByTestId('nav-launch-console')
    await expect(link).toBeAttached({ timeout: 20000 })
    const href = await link.getAttribute('href')
    expect(href).toContain('/compliance/launch')
  })

  test('link to /compliance/setup is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const link = page.getByTestId('nav-setup')
    await expect(link).toBeAttached({ timeout: 20000 })
  })

  test('link to /compliance/evidence is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const link = page.getByTestId('nav-evidence')
    await expect(link).toBeAttached({ timeout: 20000 })
  })

  test('link to /compliance/policy is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const link = page.getByTestId('nav-policy')
    await expect(link).toBeAttached({ timeout: 20000 })
  })
})

// ---------------------------------------------------------------------------
// Section 6: Wallet-free language
// ---------------------------------------------------------------------------

test.describe('Compliance Reporting Workspace — wallet-free language', () => {
  test('no wallet connector UI is present', async ({ page }) => {
    await openReportingWorkspace(page)
    const nav = page.getByRole('navigation').first()
    const navText = await nav.textContent({ timeout: 10000 }).catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})

// ---------------------------------------------------------------------------
// Section 7: Keyboard navigation
// ---------------------------------------------------------------------------

test.describe('Compliance Reporting Workspace — keyboard navigation', () => {
  test('can tab through interactive elements on the page', async ({ page }) => {
    await openReportingWorkspace(page)
    await page.waitForLoadState('load', { timeout: 10000 })
    // Give page keyboard focus
    await page.locator('body').click()
    await page.keyboard.press('Tab')
    const hasFocusedElement = await page.evaluate(() => {
      const active = document.activeElement
      return active !== null && active !== document.body && active !== document.documentElement
    })
    expect(hasFocusedElement).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 8: Unauthenticated redirect
// ---------------------------------------------------------------------------

test.describe('Compliance Reporting Workspace — unauthenticated redirect', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await clearAuthScript(page)
  })

  test('redirects unauthenticated users away from /compliance/reporting', async ({ page }) => {
    await page.goto('http://localhost:5173/compliance/reporting', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForTimeout(3000)

    const url = page.url()
    const redirectedAway = !url.includes('/compliance/reporting')
    const hasAuthParam = url.includes('showAuth=true')
    const showsAuthModal = await page
      .locator('form').filter({ hasText: /email/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false)

    expect(redirectedAway || hasAuthParam || showsAuthModal).toBe(true)
  })
})
