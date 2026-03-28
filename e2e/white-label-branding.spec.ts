/**
 * E2E tests for White-Label Branding Workspace
 * Route: /enterprise/branding (requires authentication)
 */
import { test, expect } from '@playwright/test'
import { loginWithCredentials, suppressBrowserErrors } from './helpers/auth'
import { BRAND_TEST_IDS } from '../src/utils/whiteLabelBranding'

test.describe('White-Label Branding Workspace', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await loginWithCredentials(page)
    await page.goto('http://localhost:5173/enterprise/branding', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
  })

  test('page loads and renders the workspace heading', async ({ page }) => {
    const heading = page.locator(`[data-testid="${BRAND_TEST_IDS.PAGE_HEADING}"]`)
    await expect(heading).toBeVisible({ timeout: 20000 })
    const text = await heading.textContent({ timeout: 5000 })
    expect(text).toContain('White-Label Branding')
  })

  test('workspace shell renders with correct data-testid', async ({ page }) => {
    const shell = page.locator(`[data-testid="${BRAND_TEST_IDS.WORKSPACE_SHELL}"]`)
    await expect(shell).toBeAttached({ timeout: 20000 })
  })

  test('publish state badge is present', async ({ page }) => {
    const badge = page.locator(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
    await expect(badge).toBeVisible({ timeout: 20000 })
  })

  test('identity section: org name and product label fields are visible', async ({ page }) => {
    const orgInput = page.locator(`[data-testid="${BRAND_TEST_IDS.ORG_NAME_INPUT}"]`)
    const labelInput = page.locator(`[data-testid="${BRAND_TEST_IDS.PRODUCT_LABEL_INPUT}"]`)
    await expect(orgInput).toBeVisible({ timeout: 20000 })
    await expect(labelInput).toBeVisible({ timeout: 15000 })
  })

  test('color section: accent and secondary color inputs are visible', async ({ page }) => {
    const accentInput = page.locator(`[data-testid="${BRAND_TEST_IDS.ACCENT_COLOR_INPUT}"]`)
    const secondaryInput = page.locator(`[data-testid="${BRAND_TEST_IDS.SECONDARY_COLOR_INPUT}"]`)
    await expect(accentInput).toBeVisible({ timeout: 20000 })
    await expect(secondaryInput).toBeVisible({ timeout: 15000 })
  })

  test('preview panel is present', async ({ page }) => {
    const preview = page.locator(`[data-testid="${BRAND_TEST_IDS.PREVIEW_PANEL}"]`)
    await expect(preview).toBeAttached({ timeout: 20000 })
  })

  test('save draft and publish buttons are present', async ({ page }) => {
    const saveBtn = page.locator(`[data-testid="${BRAND_TEST_IDS.SAVE_DRAFT_BUTTON}"]`)
    const publishBtn = page.locator(`[data-testid="${BRAND_TEST_IDS.PUBLISH_BUTTON}"]`)
    await expect(saveBtn).toBeVisible({ timeout: 20000 })
    await expect(publishBtn).toBeVisible({ timeout: 15000 })
  })

  test('no wallet connector UI in navigation', async ({ page }) => {
    await page.waitForLoadState('load', { timeout: 10000 })
    const nav = page.getByRole('navigation').first()
    await expect(nav).toBeAttached({ timeout: 15000 })
    const navText = await nav.textContent({ timeout: 10000 }).catch(() => '')
    expect(navText).not.toMatch(/WalletConnect|MetaMask|\bPera\b|Defly/i)
  })

  test('default org name is pre-filled with fallback value', async ({ page }) => {
    const orgInput = page.locator(`[data-testid="${BRAND_TEST_IDS.ORG_NAME_INPUT}"]`)
    await expect(orgInput).toBeVisible({ timeout: 20000 })
    const value = await orgInput.inputValue({ timeout: 5000 })
    // fetchBrandingConfig returns null, so DEFAULT_BRAND_CONFIG is used
    expect(value).toBe('Biatec Tokens')
  })

  test('publish state badge shows "Draft" on initial load', async ({ page }) => {
    const badge = page.locator(`[data-testid="${BRAND_TEST_IDS.PUBLISH_STATE_BADGE}"]`)
    await expect(badge).toBeVisible({ timeout: 20000 })
    const text = await badge.textContent({ timeout: 5000 })
    expect(text?.trim()).toBe('Draft')
  })

  test('validation errors hidden when default config is loaded', async ({ page }) => {
    await page.waitForLoadState('load', { timeout: 10000 })
    const heading = page.locator(`[data-testid="${BRAND_TEST_IDS.PAGE_HEADING}"]`)
    await expect(heading).toBeVisible({ timeout: 20000 })
    const errorsEl = page.locator(`[data-testid="${BRAND_TEST_IDS.VALIDATION_ERRORS}"]`)
    await expect(errorsEl).not.toBeAttached({ timeout: 5000 })
  })

  test('accessibility: workspace region has aria-label (WCAG SC 1.3.6)', async ({ page }) => {
    const shell = page.locator(`[data-testid="${BRAND_TEST_IDS.WORKSPACE_SHELL}"]`)
    await expect(shell).toBeAttached({ timeout: 20000 })
    const ariaLabel = await shell.getAttribute('aria-label', { timeout: 5000 })
    expect(ariaLabel).toBeTruthy()
  })

  test('accessibility: heading is an h1 element', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible({ timeout: 20000 })
    const text = await h1.textContent({ timeout: 5000 })
    expect(text).toContain('White-Label Branding')
  })
})

test.describe('White-Label Branding Workspace — sidebar link', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    await loginWithCredentials(page)
    await page.goto('http://localhost:5173/', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
  })

  test('sidebar contains Enterprise Branding link', async ({ page }) => {
    const link = page.locator('a[href="/enterprise/branding"], a[to="/enterprise/branding"]').first()
    const byText = page.getByRole('link', { name: /Enterprise Branding/i }).first()
    const linkVisible = await byText.isVisible({ timeout: 5000 }).catch(() => false)
    // Use count() > 0 for cross-version Playwright compatibility (isAttached() may not be available)
    const linkAttached = await link.count().then(c => c > 0).catch(() => false)
    expect(linkVisible || linkAttached).toBe(true)
  })
})

test.describe('White-Label Branding Workspace — unauthenticated redirect', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('redirects unauthenticated users away from /enterprise/branding', async ({ page }) => {
    await page.goto('http://localhost:5173/enterprise/branding', { timeout: 15000 })
    await page.waitForLoadState('load', { timeout: 10000 })
    await page.waitForTimeout(3000)
    const url = page.url()
    const redirectedAway = !url.includes('/enterprise/branding')
    const hasAuthParam = url.includes('showAuth=true')
    const showsAuthForm = await page
      .locator('form').filter({ hasText: /email/i }).first()
      .isVisible({ timeout: 3000 }).catch(() => false)
    expect(redirectedAway || hasAuthParam || showsAuthForm).toBe(true)
  })
})
