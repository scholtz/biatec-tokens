/**
 * E2E Tests: Enterprise Risk Report Builder
 *
 * Validates the main user journey through the risk report builder:
 *  - Route accessibility and page structure
 *  - Risk score banner display
 *  - Preset selection workflow
 *  - Section toggle controls
 *  - Export action buttons
 *  - Workspace navigation links
 *  - Wallet-free language
 *  - Keyboard navigation
 *  - Unauthenticated redirect
 *
 * Auth strategy: withAuth() (localStorage seeding — no wallet connectors)
 * Route: /compliance/risk-report
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors, clearAuthScript } from './helpers/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openRiskReportBuilder(page: Parameters<typeof withAuth>[0]) {
  suppressBrowserErrors(page)
  await withAuth(page)
  await page.goto('http://localhost:5173/compliance/risk-report', { timeout: 15000 })
  await page.waitForLoadState('load', { timeout: 10000 })
}

// ---------------------------------------------------------------------------
// Section 1: Page structure and route accessibility
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — page structure', () => {
  test('route /compliance/risk-report is accessible when authenticated', async ({ page }) => {
    await openRiskReportBuilder(page)
    const heading = page.getByRole('heading', { name: /Enterprise Risk Report Builder/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })
  })

  test('page has a single h1 heading (WCAG SC 1.3.1)', async ({ page }) => {
    await openRiskReportBuilder(page)
    const h1s = page.locator('h1')
    await expect(h1s).toHaveCount(1, { timeout: 20000 })
  })

  test('workspace region has role="region" with aria-label', async ({ page }) => {
    await openRiskReportBuilder(page)
    const region = page.locator('[role="region"][aria-label*="Enterprise Risk Report Builder"]')
    await expect(region).toBeAttached({ timeout: 20000 })
  })

  test('skip link targeting #risk-report-main is present (WCAG SC 2.4.1)', async ({ page }) => {
    await openRiskReportBuilder(page)
    const skipLink = page.locator('a[href="#risk-report-main"]')
    await expect(skipLink).toBeAttached({ timeout: 20000 })
  })

  test('page header section is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const header = page.getByTestId('risk-report-header')
    await expect(header).toBeAttached({ timeout: 20000 })
  })
})

// ---------------------------------------------------------------------------
// Section 2: Risk score banner
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — risk score banner', () => {
  test('risk score banner is visible after loading', async ({ page }) => {
    await openRiskReportBuilder(page)
    const banner = page.getByTestId('risk-score-banner')
    await expect(banner).toBeVisible({ timeout: 30000 })
  })

  test('risk band label text is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const label = page.getByTestId('risk-band-label')
    await expect(label).toBeVisible({ timeout: 30000 })
    const text = await label.textContent()
    expect(text).toBeTruthy()
    // Should contain one of the known band labels
    const bands = ['Minimal Risk', 'Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk']
    const hasBand = bands.some(b => text!.includes(b))
    expect(hasBand).toBe(true)
  })

  test('risk score value is present and shows X/100', async ({ page }) => {
    await openRiskReportBuilder(page)
    const scoreEl = page.getByTestId('risk-score-value')
    await expect(scoreEl).toBeVisible({ timeout: 30000 })
    const text = await scoreEl.textContent()
    expect(text).toMatch(/\d+\/100/)
  })

  test('risk score progressbar has ARIA attributes', async ({ page }) => {
    await openRiskReportBuilder(page)
    const bar = page.getByTestId('risk-score-bar')
    await expect(bar).toBeAttached({ timeout: 20000 })
    const valueMin = await bar.getAttribute('aria-valuemin')
    const valueMax = await bar.getAttribute('aria-valuemax')
    const valueNow = await bar.getAttribute('aria-valuenow')
    expect(valueMin).toBe('0')
    expect(valueMax).toBe('100')
    expect(valueNow).not.toBeNull()
    expect(parseInt(valueNow!, 10)).toBeGreaterThanOrEqual(0)
  })

  test('heuristic disclaimer text is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const disclaimer = page.getByTestId('heuristic-disclaimer')
    await expect(disclaimer).toBeAttached({ timeout: 20000 })
  })

  test('readiness score crossref is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const crossref = page.getByTestId('readiness-score-crossref')
    await expect(crossref).toBeVisible({ timeout: 30000 })
  })
})

// ---------------------------------------------------------------------------
// Section 3: Top risks section
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — top risks section', () => {
  test('top risks section is visible', async ({ page }) => {
    await openRiskReportBuilder(page)
    const section = page.getByTestId('top-risks-section')
    await expect(section).toBeVisible({ timeout: 30000 })
  })

  test('top risks section has an aria-labelledby heading', async ({ page }) => {
    await openRiskReportBuilder(page)
    const section = page.getByTestId('top-risks-section')
    const labelledBy = await section.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const heading = page.locator(`#${labelledBy}`)
    await expect(heading).toBeAttached({ timeout: 10000 })
  })
})

// ---------------------------------------------------------------------------
// Section 4: Preset selector
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — preset selector', () => {
  test('preset selector section is visible', async ({ page }) => {
    await openRiskReportBuilder(page)
    const section = page.getByTestId('preset-selector-section')
    await expect(section).toBeVisible({ timeout: 30000 })
  })

  test('operator preset button is visible and selected by default', async ({ page }) => {
    await openRiskReportBuilder(page)
    const btn = page.getByTestId('preset-btn-operator')
    await expect(btn).toBeVisible({ timeout: 30000 })
    const checked = await btn.getAttribute('aria-checked')
    expect(checked).toBe('true')
  })

  test('executive preset button is visible', async ({ page }) => {
    await openRiskReportBuilder(page)
    const btn = page.getByTestId('preset-btn-executive')
    await expect(btn).toBeVisible({ timeout: 30000 })
  })

  test('procurement preset button is visible', async ({ page }) => {
    await openRiskReportBuilder(page)
    const btn = page.getByTestId('preset-btn-procurement')
    await expect(btn).toBeVisible({ timeout: 30000 })
  })

  test('clicking executive preset selects it (aria-checked=true)', async ({ page }) => {
    await openRiskReportBuilder(page)
    const execBtn = page.getByTestId('preset-btn-executive')
    await execBtn.waitFor({ state: 'visible', timeout: 30000 })
    await execBtn.click()
    // Semantic wait: attribute must reflect the new state before asserting
    await expect(execBtn).toHaveAttribute('aria-checked', 'true', { timeout: 5000 })
  })

  test('selecting a preset deselects the previous one', async ({ page }) => {
    await openRiskReportBuilder(page)
    const operatorBtn = page.getByTestId('preset-btn-operator')
    const execBtn = page.getByTestId('preset-btn-executive')
    await execBtn.waitFor({ state: 'visible', timeout: 30000 })
    await execBtn.click()
    // Semantic wait: operatorBtn aria-checked must be false after executive is selected
    await expect(operatorBtn).toHaveAttribute('aria-checked', 'false', { timeout: 5000 })
  })

  test('preset buttons have accessible role="radio"', async ({ page }) => {
    await openRiskReportBuilder(page)
    const btn = page.getByTestId('preset-btn-operator')
    await expect(btn).toBeVisible({ timeout: 30000 })
    const role = await btn.getAttribute('role')
    expect(role).toBe('radio')
  })
})

// ---------------------------------------------------------------------------
// Section 5: Section controls
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — section controls', () => {
  test('section controls section is visible', async ({ page }) => {
    await openRiskReportBuilder(page)
    const section = page.getByTestId('section-controls-section')
    await expect(section).toBeVisible({ timeout: 30000 })
  })

  test('risk-overview toggle is present and has role="switch"', async ({ page }) => {
    await openRiskReportBuilder(page)
    const toggle = page.getByTestId('section-toggle-risk-overview')
    await expect(toggle).toBeAttached({ timeout: 20000 })
    const role = await toggle.getAttribute('role')
    expect(role).toBe('switch')
  })

  test('section toggles have aria-checked attribute', async ({ page }) => {
    await openRiskReportBuilder(page)
    const toggle = page.getByTestId('section-toggle-risk-overview')
    await expect(toggle).toBeAttached({ timeout: 20000 })
    const checked = await toggle.getAttribute('aria-checked')
    expect(['true', 'false']).toContain(checked)
  })

  test('clicking a section toggle changes its aria-checked state', async ({ page }) => {
    await openRiskReportBuilder(page)
    const toggle = page.getByTestId('section-toggle-risk-overview')
    await toggle.waitFor({ state: 'visible', timeout: 20000 })
    const before = await toggle.getAttribute('aria-checked')
    const expectedAfter = before === 'true' ? 'false' : 'true'
    await toggle.click()
    // Semantic wait: attribute must reflect toggled state before asserting
    await expect(page.getByTestId('section-toggle-risk-overview')).toHaveAttribute(
      'aria-checked',
      expectedAfter,
      { timeout: 5000 },
    )
  })
})

// ---------------------------------------------------------------------------
// Section 6: Export actions
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — export actions', () => {
  test('export section is visible', async ({ page }) => {
    await openRiskReportBuilder(page)
    const section = page.getByTestId('export-section')
    await expect(section).toBeVisible({ timeout: 30000 })
  })

  test('export JSON button is enabled', async ({ page }) => {
    await openRiskReportBuilder(page)
    const btn = page.getByTestId('export-json-btn')
    await expect(btn).toBeVisible({ timeout: 30000 })
    await expect(btn).toBeEnabled()
  })

  test('export text button is enabled', async ({ page }) => {
    await openRiskReportBuilder(page)
    const btn = page.getByTestId('export-text-btn')
    await expect(btn).toBeVisible({ timeout: 30000 })
    await expect(btn).toBeEnabled()
  })

  test('copy to clipboard button is visible', async ({ page }) => {
    await openRiskReportBuilder(page)
    const btn = page.getByTestId('copy-clipboard-btn')
    await expect(btn).toBeVisible({ timeout: 30000 })
  })

  test('export section heading is accessible via aria-labelledby', async ({ page }) => {
    await openRiskReportBuilder(page)
    const section = page.getByTestId('export-section')
    const labelledBy = await section.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Section 7: Workspace navigation
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — workspace navigation', () => {
  test('workspace nav is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const nav = page.getByTestId('workspace-nav')
    await expect(nav).toBeAttached({ timeout: 20000 })
  })

  test('navigation link to Reporting Workspace is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const link = page.getByTestId('nav-link-reporting')
    await expect(link).toBeVisible({ timeout: 30000 })
    const href = await link.getAttribute('href')
    expect(href).toContain('/compliance/reporting')
  })

  test('navigation link to Launch Console is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const link = page.getByTestId('nav-link-launch')
    await expect(link).toBeVisible({ timeout: 30000 })
    const href = await link.getAttribute('href')
    expect(href).toContain('/compliance/launch')
  })

  test('navigation link to Evidence Pack is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const link = page.getByTestId('nav-link-evidence')
    await expect(link).toBeVisible({ timeout: 30000 })
    const href = await link.getAttribute('href')
    expect(href).toContain('/compliance/evidence')
  })

  test('navigation link to Compliance Setup is present', async ({ page }) => {
    await openRiskReportBuilder(page)
    const link = page.getByTestId('nav-link-setup')
    await expect(link).toBeVisible({ timeout: 30000 })
    const href = await link.getAttribute('href')
    expect(href).toContain('/compliance/setup')
  })
})

// ---------------------------------------------------------------------------
// Section 8: Wallet-free language
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — wallet-free language', () => {
  test('no wallet connector UI text appears in the navigation', async ({ page }) => {
    await openRiskReportBuilder(page)
    await page.waitForLoadState('load', { timeout: 10000 })
    const nav = page.getByRole('navigation').first()
    const navText = await nav.textContent({ timeout: 10000 }).catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })
})

// ---------------------------------------------------------------------------
// Section 9: Keyboard navigation
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — keyboard navigation', () => {
  test('Tab key moves focus through interactive elements on the page', async ({ page }) => {
    await openRiskReportBuilder(page)
    const heading = page.getByRole('heading', { name: /Enterprise Risk Report Builder/i, level: 1 })
    await expect(heading).toBeVisible({ timeout: 30000 })

    // Give page keyboard focus
    await page.locator('body').click()
    await page.keyboard.press('Tab')

    // Verify some element received focus
    const hasFocusedElement = await page.evaluate(() => {
      const active = document.activeElement
      return active !== null && active !== document.body && active !== document.documentElement
    })
    expect(hasFocusedElement).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 10: Unauthenticated redirect
// ---------------------------------------------------------------------------

test.describe('Enterprise Risk Report Builder — unauthenticated redirect', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await clearAuthScript(page)
  })

  test('redirects unauthenticated users away from /compliance/risk-report', async ({ page }) => {
    await page.goto('http://localhost:5173/compliance/risk-report', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    // Semantic wait: poll until the URL has changed away from the protected route
    // or an auth form / auth query param has appeared (all are valid redirect signals).
    await page.waitForFunction(
      () => {
        const url = window.location.href
        const redirectedAway = !url.includes('/compliance/risk-report')
        const hasAuthParam = url.includes('showAuth=true')
        const showsAuthModal = !!document.querySelector('form')
        return redirectedAway || hasAuthParam || showsAuthModal
      },
      { timeout: 8000 },
    ).catch(() => {/* still assert below — allows partial signal */})

    const url = page.url()
    const redirectedAway = !url.includes('/compliance/risk-report')
    const showsAuthModal = await page
      .locator('form').filter({ hasText: /email/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false)
    const hasAuthParam = url.includes('showAuth=true')

    expect(redirectedAway || showsAuthModal || hasAuthParam).toBe(true)
  })
})
