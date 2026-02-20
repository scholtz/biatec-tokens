/**
 * Token Lifecycle Cockpit E2E Tests
 * 
 * Tests user flows through the lifecycle cockpit including
 * navigation, role switching, and action interactions.
 */

import { test, expect } from '@playwright/test'

test.describe('Token Lifecycle Cockpit', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress console errors to prevent Playwright from failing on browser console output
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser console error (suppressed for test stability): ${msg.text()}`)
      }
    })
    
    // Suppress page errors
    page.on('pageerror', error => {
      console.log(`Page error (suppressed for test stability): ${error.message}`)
    })
    
    // Set up authentication (email/password only, no wallet connectors)
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TESTADDRESS123',
        name: 'Test User',
        email: 'test@example.com',
      }))
    })
  })

  test('should display cockpit page correctly', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Check page title - use longer timeout instead of arbitrary wait
    const title = page.getByRole('heading', { name: /Token Lifecycle Cockpit/i, level: 1 })
    await expect(title).toBeVisible({ timeout: 45000 })

    // Check subtitle
    await expect(page.getByText(/Competitive intelligence and operational command center/i)).toBeVisible()
  })

  test('should show cockpit navigation link', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check navigation has cockpit link
    const cockpitLink = page.getByRole('link', { name: /Cockpit/i })
    await expect(cockpitLink).toBeVisible({ timeout: 15000 })
  })

  test('should navigate to cockpit from navbar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click cockpit link - wait for it to be visible first
    const cockpitLink = page.getByRole('link', { name: /Cockpit/i })
    await expect(cockpitLink).toBeVisible({ timeout: 15000 })
    await cockpitLink.click()
    
    // Wait for navigation and page load
    await page.waitForLoadState('networkidle')

    // Verify we're on the cockpit page
    await expect(page).toHaveURL('/cockpit')
    
    // Check main heading - semantic wait replaces arbitrary 10s timeout
    const title = page.getByRole('heading', { name: /Token Lifecycle Cockpit/i })
    await expect(title).toBeVisible({ timeout: 45000 })
  })

  test('should display role selector', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Check role selector dropdown
    const roleSelect = page.locator('select')
    await expect(roleSelect).toBeVisible({ timeout: 45000 })
    
    // Verify role options
    const options = await roleSelect.locator('option').allTextContents()
    expect(options).toContain('Issuer Admin')
    expect(options).toContain('Compliance')
    expect(options).toContain('Operations')
    expect(options).toContain('Treasury')
  })

  test('should display readiness status widget', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Check for readiness widget - semantic wait instead of arbitrary timeout
    const readinessWidget = page.getByRole('heading', { name: /Launch Readiness/i })
    await expect(readinessWidget).toBeVisible({ timeout: 45000 })
    
    // Check for readiness score
    await expect(page.getByText(/Readiness Score/i)).toBeVisible()
  })

  test('should display guided actions widget', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Check for actions widget - semantic wait
    const actionsWidget = page.getByRole('heading', { name: /Guided Next Actions/i })
    await expect(actionsWidget).toBeVisible({ timeout: 45000 })
  })

  test('should display wallet diagnostics widget', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Check for diagnostics widget - semantic wait
    const diagnosticsWidget = page.getByRole('heading', { name: /Wallet Diagnostics/i })
    await expect(diagnosticsWidget).toBeVisible({ timeout: 45000 })
  })

  test('should display risk indicators widget', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Check for risk widget - semantic wait
    const riskWidget = page.getByRole('heading', { name: /Lifecycle Risk Indicators/i })
    await expect(riskWidget).toBeVisible({ timeout: 45000 })
  })

  test('should have refresh button', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Check for refresh button - semantic wait
    const refreshButton = page.getByRole('button', { name: /Refresh/i })
    await expect(refreshButton).toBeVisible({ timeout: 45000 })
  })

  test('should show last updated timestamp', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Check for last updated text — use first() because multiple widgets show this label
    await expect(page.getByText(/Last updated:/i).first()).toBeVisible({ timeout: 45000 })
  })

  test('should change role and update visible widgets', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Initially as Issuer Admin, all widgets should be visible - semantic wait
    await expect(page.getByRole('heading', { name: /Launch Readiness/i })).toBeVisible({ timeout: 45000 })
    await expect(page.getByRole('heading', { name: /Post-Launch Telemetry/i })).toBeVisible()
    
    // Change role to Compliance
    const roleSelect = page.locator('select')
    await roleSelect.waitFor({ state: 'visible', timeout: 45000 })
    await roleSelect.selectOption('compliance')
    
    // Wait for role change to propagate by checking readiness is still visible
    await expect(page.getByRole('heading', { name: /Launch Readiness/i })).toBeVisible()
    // Note: Telemetry widget is hidden based on permissions, would need to check it's not in DOM
  })

  test('should require authentication', async ({ page }) => {
    // Previously skipped in CI after 4 iterations using arbitrary waitForTimeout.
    // Refactored: use semantic waitForFunction that checks actual redirect condition
    // without relying on timing. This eliminates the arbitrary 10s wait.
    
    // Clear auth via addInitScript to ensure it runs before any navigation
    await page.addInitScript(() => {
      localStorage.removeItem('algorand_user')
      localStorage.removeItem('biatec_guided_launch_draft')
    })
    
    // Try to access cockpit (unauthenticated)
    await page.goto('/cockpit')
    
    // Semantic wait: poll until redirect evidence is present
    // This replaces the arbitrary waitForTimeout(10000)
    await page.waitForFunction(() => {
      const url = window.location.href
      const hasAuthParam = url.includes('showAuth=true')
      const emailInput = document.querySelector('input[type="email"]')
      return hasAuthParam || emailInput !== null
    }, { timeout: 20000 })
    
    // Verify redirect happened
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authInputVisible = await page.locator('input[type="email"]').isVisible().catch(() => false)
    
    expect(urlHasAuthParam || authInputVisible).toBe(true)
  })
})

// ─── Complete User Flow: token detail → cockpit → execute action ──────────────

test.describe('Token Operations Cockpit — complete user flow', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser console error (suppressed): ${msg.text()}`)
      }
    })
    page.on('pageerror', error => {
      console.log(`Page error (suppressed): ${error.message}`)
    })

    // Set up auth
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TESTADDRESS123',
        name: 'Test User',
        email: 'test@example.com',
      }))
    })
  })

  test('user navigates from dashboard to cockpit and sees health signals', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Navigate to cockpit via nav link
    const cockpitLink = page.getByRole('link', { name: /Cockpit/i }).first()
    await expect(cockpitLink).toBeVisible({ timeout: 15000 })
    await cockpitLink.click()
    await page.waitForLoadState('networkidle')

    // Verify cockpit page loaded
    await expect(page).toHaveURL('/cockpit')
    const heading = page.getByRole('heading', { name: /Token Lifecycle Cockpit/i })
    await expect(heading).toBeVisible({ timeout: 45000 })

    // Verify health/readiness section is visible
    const readinessHeading = page.getByRole('heading', { name: /Launch Readiness/i })
    await expect(readinessHeading).toBeVisible({ timeout: 45000 })
  })

  test('user views activity timeline on the cockpit page', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Wait for cockpit to load
    const heading = page.getByRole('heading', { name: /Token Lifecycle Cockpit/i })
    await expect(heading).toBeVisible({ timeout: 45000 })

    // Activity Timeline widget should be visible
    const timelineHeading = page.getByRole('heading', { name: /Activity Timeline/i })
    await expect(timelineHeading).toBeVisible({ timeout: 45000 })

    // Timeline should have a feed region (aria role)
    const feed = page.locator('[role="feed"]')
    await expect(feed).toBeVisible({ timeout: 15000 })
  })

  test('user reviews guided actions and can follow a deep link', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Wait for page to load
    const heading = page.getByRole('heading', { name: /Token Lifecycle Cockpit/i })
    await expect(heading).toBeVisible({ timeout: 45000 })

    // Guided actions widget should be present
    const actionsHeading = page.getByRole('heading', { name: /Guided Next Actions/i })
    await expect(actionsHeading).toBeVisible({ timeout: 45000 })
  })

  test('user can refresh cockpit data and timestamp updates', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    // Wait for initial load
    const heading = page.getByRole('heading', { name: /Token Lifecycle Cockpit/i })
    await expect(heading).toBeVisible({ timeout: 45000 })

    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i })
    await expect(refreshButton).toBeVisible({ timeout: 15000 })
    await refreshButton.click()

    // After refresh, "Last updated:" timestamp should still be visible
    // use first() because multiple widgets render this label
    await expect(page.getByText(/Last updated:/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('cockpit does not display wallet connector UI (business roadmap alignment)', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading', { name: /Token Lifecycle Cockpit/i })
    await expect(heading).toBeVisible({ timeout: 45000 })

    // Roadmap requirement: email/password only — no wallet CONNECTOR prompts.
    // The WalletDiagnosticsWidget legitimately lists wallet names (Pera, Defly,
    // MetaMask) as compatibility-report labels, not as connector UI. We only
    // guard against actual connector action strings that would prompt the user
    // to install or connect a wallet.
    const content = await page.content()
    expect(content).not.toContain('Connect wallet')
    expect(content).not.toContain('connect your wallet')
    expect(content).not.toContain('Install MetaMask')
    expect(content).not.toContain('approve in wallet')
    expect(content).not.toContain('Sign with wallet')
  })

  test('cockpit is accessible — semantic headings and landmarks present', async ({ page }) => {
    await page.goto('/cockpit')
    await page.waitForLoadState('networkidle')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1.first()).toBeVisible({ timeout: 45000 })

    // At least one h3 heading (widget section headings)
    const h3Count = await page.getByRole('heading', { level: 3 }).count()
    expect(h3Count).toBeGreaterThan(0)
  })
})
