/**
 * Redirect Compatibility Tests — Legacy /create/wizard Route
 *
 * Retained per issue specification: "Retain a maximum of 2–3
 * redirect-compatibility tests that assert /create/wizard performs a
 * 301/302 redirect to the canonical path."
 *
 * These tests are the ONLY permitted tests that navigate to /create/wizard.
 * All other spec files must use the canonical /launch/guided route.
 *
 * Router definition: src/router/index.ts
 *   { path: '/create/wizard', redirect: '/launch/guided' }
 */

import { test, expect } from '@playwright/test'
import { withAuth, clearAuthScript, suppressBrowserErrors } from './helpers/auth'

// ---------------------------------------------------------------------------
// Redirect-compatibility tests (max 3 — do NOT add more)
// ---------------------------------------------------------------------------

test.describe('Legacy /create/wizard redirect compatibility', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('/create/wizard redirects to /launch/guided for authenticated user', async ({ page }) => {
    // AC: /create/wizard must redirect to canonical /launch/guided
    await withAuth(page)
    await page.goto('/create/wizard')
    await page.waitForLoadState('load')

    // Semantic wait: URL must leave the deprecated path
    await page.waitForFunction(
      () => !window.location.pathname.includes('/create/wizard'),
      { timeout: 20000 },
    )

    const url = page.url()
    expect(url).not.toContain('/create/wizard')
    // Must land on canonical guided launch route
    expect(url).toContain('/launch/guided')
  })

  test('/create/wizard does not render wizard UI after redirect', async ({ page }) => {
    // AC: legacy wizard UI component must never be served from the deprecated path
    await withAuth(page)
    await page.goto('/create/wizard')
    await page.waitForLoadState('load')

    await page.waitForFunction(
      () => !window.location.pathname.includes('/create/wizard'),
      { timeout: 20000 },
    )

    // Wizard-era heading must not appear after redirect
    const wizardHeading = page.getByRole('heading', { name: /token creation wizard/i })
    const isWizardVisible = await wizardHeading.isVisible().catch(() => false)
    expect(isWizardVisible).toBe(false)
  })

  test('/create/wizard redirects unauthenticated user away from deprecated path', async ({
    page,
  }) => {
    // AC: unauthenticated access must not render wizard UI regardless of auth state
    await clearAuthScript(page)
    await page.goto('/create/wizard')
    await page.waitForLoadState('load')

    // Semantic wait: redirect away from legacy path OR auth prompt appears
    await page.waitForFunction(
      () => {
        const url = window.location.href
        const emailInput = document.querySelector("input[type='email']")
        return !url.includes('/create/wizard') || emailInput !== null
      },
      { timeout: 20000 },
    )

    const url = page.url()
    expect(url).not.toContain('/create/wizard')
  })
})
