/**
 * E2E Tests for Compliance Dashboard Auth-First Flow
 *
 * Critical journey spec: uses backend-realistic, contract-validated session bootstrap
 * via the shared `withAuth()` and `loginWithCredentials()` helpers instead of ad-hoc
 * localStorage.setItem calls. This ensures the ARC76 session contract is validated
 * before every test, and makes the path to real backend auth trivial (swap withAuth
 * for loginWithCredentials when a backend is available in CI).
 *
 * AC #1 (Issue scope): Auth-first E2E paths use contract-validated session bootstrap.
 * AC #4 (Issue scope): Top-nav assertions are component-scoped (nav.textContent()), not
 *        broad page.content() scans.
 *
 * Canonical auth model: email/password only — no wallet connectors.
 * Roadmap: https://raw.githubusercontent.com/scholtz/biatec-tokens/refs/heads/main/business-owner-roadmap.md
 */

import { test, expect } from '@playwright/test'
import { withAuth, loginWithCredentials, suppressBrowserErrors } from './helpers/auth'

test.describe('Compliance Dashboard - Auth-First Flow', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('should redirect unauthenticated user from compliance dashboard to login', async ({ page }) => {
    // Clear auth state
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    
    // Try to access compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Wait for auth guard redirect to complete
    await page.waitForFunction(() => {
      const url = window.location.href
      const hasAuthParam = url.includes('showAuth=true')
      const emailForm = document.querySelector('form input[type="email"]')
      return hasAuthParam || emailForm !== null
    }, { timeout: 10000 })
    
    // Should redirect to home with auth modal trigger
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authModalVisible = await page.locator('form').filter({ hasText: /email/i }).isVisible().catch(() => false)
    
    expect(urlHasAuthParam || authModalVisible).toBe(true)
  })

  test('should allow authenticated user to access compliance dashboard', async ({ page }) => {
    // AC #1: Use contract-validated session bootstrap (withAuth validates ARC76 contract
    // before seeding localStorage — no raw localStorage.setItem shortcuts).
    // loginWithCredentials() is used here as this is a critical journey spec; it attempts
    // real backend auth and falls back to contract-validated seeding when backend is absent.
    await loginWithCredentials(page, 'compliance@example.com')

    // Navigate to compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')

    // Should display the dashboard - semantic wait replaces arbitrary 10s timeout
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 45000 })
  })

  test('should not display wallet UI in compliance dashboard', async ({ page }) => {
    // AC #1: Contract-validated session bootstrap for critical journey.
    await loginWithCredentials(page, 'compliance@example.com')

    // Navigate to compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')

    // Wait for page to load - semantic wait
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 45000 })

    // AC #4: Component-scoped assertion — check nav textContent, not full page.content().
    // page.content() scans compiled JS bundles that embed WalletConnect/Pera/Defly strings
    // from third-party packages. nav.textContent() only captures visible text in the nav.
    const nav = page.getByRole('navigation').first()
    const navText = await nav.textContent().catch(() => '')

    // Verify no wallet-related UI in the navigation
    expect(navText).not.toMatch(/WalletConnect|MetaMask|Pera Wallet|Defly/i)
    expect(navText).not.toMatch(/connect wallet/i)
    expect(navText).not.toMatch(/not connected/i)
  })

  test('should maintain auth state when navigating from compliance to dashboard', async ({ page }) => {
    // AC #1: Contract-validated session bootstrap for critical journey.
    await withAuth(page, {
      address: 'COMPLIANCE_NAV_TEST_USER',
      email: 'nav-test@example.com',
      isConnected: true,
    })
    
    // Start at compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify compliance dashboard loaded - semantic wait
    const heading1 = page.getByRole('heading', { level: 1 }).first()
    await expect(heading1).toBeVisible({ timeout: 45000 })
    
    // Navigate to main dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Should still be authenticated (page loads, not redirected) - semantic wait
    const heading2 = page.getByRole('heading', { level: 1 }).first()
    await expect(heading2).toBeVisible({ timeout: 45000 })
    
    // Verify we're on dashboard
    const url = page.url()
    expect(url).toContain('/dashboard')
  })

  test('should verify business roadmap alignment on compliance page', async ({ page }) => {
    // AC #1: Contract-validated session bootstrap for critical journey.
    await loginWithCredentials(page, 'roadmap@example.com')

    // Navigate to compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')

    // Wait for page to load - semantic wait
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 45000 })

    // Business roadmap requirements — AC #4: use nav.textContent() not page.content().
    const nav = page.getByRole('navigation').first()
    const navText = await nav.textContent().catch(() => '')

    // 1. Email/password only - NO wallet connectors in nav
    expect(navText).not.toMatch(/WalletConnect|MetaMask|Pera Wallet|Defly/i)

    // 2. Backend-driven: no wallet signing prompts in nav
    expect(navText).not.toMatch(/sign transaction|approve in wallet/i)

    // 3. Compliance-first: page body must contain compliance content
    const bodyText = await page.locator('body').innerText().catch(() => '')
    const hasComplianceContent = /compliance/i.test(bodyText)
    expect(hasComplianceContent).toBe(true)
  })
})

test.describe('Compliance Orchestration - Auth-First Flow', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })
  test('should redirect unauthenticated user from compliance orchestration to login', async ({ page }) => {
    // Clear auth state
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    
    // Try to access compliance orchestration
    await page.goto('/compliance/orchestration')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Wait for auth guard redirect to complete
    await page.waitForFunction(() => {
      const url = window.location.href
      const hasAuthParam = url.includes('showAuth=true')
      const emailForm = document.querySelector('form input[type="email"]')
      return hasAuthParam || emailForm !== null
    }, { timeout: 10000 })
    
    // Should redirect to home with auth modal trigger
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authModalVisible = await page.locator('form').filter({ hasText: /email/i }).isVisible().catch(() => false)
    
    expect(urlHasAuthParam || authModalVisible).toBe(true)
  })

  test('should allow authenticated user to access compliance orchestration', async ({ page }) => {
    // AC #1: Contract-validated session bootstrap for critical journey.
    await loginWithCredentials(page, 'orch@example.com')
    
    // Navigate to compliance orchestration
    await page.goto('/compliance/orchestration')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Wait for page heading to appear (proves page loaded)
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 60000 }) // Increased for CI auth store init
  })
})
