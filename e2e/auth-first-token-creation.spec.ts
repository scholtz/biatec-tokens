/**
 * E2E Tests for Auth-First Token Creation Journey
 *
 * Tests validate the MVP auth-first routing model:
 * - Unauthenticated users are redirected to login
 * - Authenticated users can access token creation
 * - No wallet/network UI elements visible in auth-first context
 * - Compliance gating surfaces correctly
 *
 * Auth model: email/password only — no wallet connectors.
 * Canonical creation route: /launch/guided
 * Legacy /create/wizard redirects to /launch/guided (covered by wizard-redirect-compat.spec.ts).
 *
 * Critical journey specs use `loginWithCredentials()` which validates the real
 * backend auth contract when a backend is available (falls back to localStorage
 * seeding when the backend is not running in CI).
 */

import { test, expect } from '@playwright/test'
import { loginWithCredentials, withAuth, suppressBrowserErrors, getNavText } from './helpers/auth'

/** Shared test user for auth-first token creation tests */
const AUTH_FIRST_TEST_EMAIL = 'test@example.com'

test.describe('Auth-First Token Creation Journey', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('should redirect unauthenticated user to login when accessing /launch/guided', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/')
    await page.waitForLoadState('load') // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('load') // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    
    // Wait for auth guard redirect - check for URL param OR visible form
    // Semantic wait: check multiple conditions that prove redirect happened
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
    
    // Pass if either URL has auth param OR auth modal is visible
    expect(urlHasAuthParam || authModalVisible).toBe(true)
  })

  test('should redirect unauthenticated user to login when accessing /create', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/')
    await page.waitForLoadState('load') // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route
    await page.goto('/create')
    await page.waitForLoadState('load') // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    
    // Wait for auth guard redirect - semantic wait for redirect evidence
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

  test('should allow authenticated user to access guided token launch', async ({ page }) => {
    // loginWithCredentials() adds ~5s backend timeout + 60s visibility assertion → needs 90s budget
    test.setTimeout(90000)
    // Use canonical auth helper — validates ARC76 session contract before seeding
    await loginWithCredentials(page, AUTH_FIRST_TEST_EMAIL)
    
    // Navigate to guided launch
    await page.goto('/launch/guided', { timeout: 15000 }) // Vite pre-warmed — 15s sufficient; sum 5+15+10+30+15=75s < 90s budget
    await page.waitForLoadState('load', { timeout: 10000 }) // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    
    // Semantic wait: Wait for the actual page title to appear (proves auth store loaded + component mounted)
    const title = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(title).toBeVisible({ timeout: 30000 }) // Reduced from 60s: Vite pre-warmed, fits within 90s budget
    
    // Should show auth-first messaging
    const subtitle = page.getByText(/email.*password.*authentication/i)
    await expect(subtitle).toBeVisible({ timeout: 15000 })
  })

  test('should allow authenticated user to access advanced token creation', async ({ page }) => {
    // loginWithCredentials() adds ~5s backend timeout + 60s visibility assertion → needs 90s budget
    test.setTimeout(90000)
    // Use canonical auth helper — validates ARC76 session contract before seeding
    await loginWithCredentials(page, AUTH_FIRST_TEST_EMAIL)
    
    // Navigate to advanced creation
    await page.goto('/create', { timeout: 15000 }) // Vite pre-warmed — 15s sufficient; sum 5+15+10+30=60s < 90s budget
    await page.waitForLoadState('load', { timeout: 10000 }) // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    
    // Semantic wait: Wait for the actual page heading (proves page loaded successfully after auth)
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 30000 }) // Reduced from 60s: Vite pre-warmed, fits within 90s budget
  })

  test('should not display wallet/network UI elements in top navigation', async ({ page }) => {
    // This test validates the NAVIGATION COMPONENT renders without wallet UI.
    // The nav is identical on all pages — no need to load the auth-heavy /launch/guided page.
    // Using withAuth() (localStorage seeding, no network request) for maximum speed.
    // Total max budget: 0 (withAuth) + 10 (goto) + 5 (load) + 20 (getNavText) = 35s < 60s global
    await withAuth(page)

    await page.goto('/', { timeout: 10000 })
    await page.waitForLoadState('load', { timeout: 5000 }) // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle

    // Use shared getNavText() helper — scoped to nav element, avoids compiled-bundle false positives
    // per AC #3: deterministic assertions must scope to visible DOM, not full HTML.
    const navText = await getNavText(page)

    // Verify no wallet connector references in navigation text
    expect(navText).not.toMatch(/not connected/i)
    expect(navText).not.toMatch(/WalletConnect|MetaMask|Pera\s+Wallet|Defly/i)
    expect(navText).not.toMatch(/connect wallet/i)
  })

  test('should show email/password authentication elements for unauthenticated users', async ({ page }) => {
    // Clear auth
    await page.goto('/')
    await page.waitForLoadState('load') // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('load') // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    
    // Semantic wait: Wait for Sign In button to appear
    const signInButton = page.getByRole('button', { name: /sign in/i }).first()
    await expect(signInButton).toBeVisible({ timeout: 15000 })

    // Sign In button is visible and correctly labeled (email/password flow, not wallet-connect)
    const signInText = await signInButton.textContent().catch(() => '')
    expect(signInText).toMatch(/sign in/i)

    // Use shared getNavText() helper for nav-scoped wallet assertion
    const navText = await getNavText(page)
    expect(navText).not.toMatch(/WalletConnect|Connect Wallet/i)
  })

  test('should maintain auth state across navigation', async ({ page }) => {
    // loginWithCredentials() adds ~5s backend timeout + 60s visibility assertions → needs 90s budget
    test.setTimeout(90000)
    // Use loginWithCredentials for critical journey — validates backend auth contract
    await loginWithCredentials(page, 'auth-persist@example.com')
    
    // Navigate to guided launch
    await page.goto('/launch/guided', { timeout: 10000 }) // Vite pre-warmed — 10s sufficient; 2 routes: 5+10+8+20+10+8+20=81s < 90s budget
    await page.waitForLoadState('load', { timeout: 8000 }) // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    
    // Semantic wait: Wait for page title
    const title1 = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(title1).toBeVisible({ timeout: 20000 }) // Reduced from 60s: Vite pre-warmed, 2-route test needs tight budget
    
    // Navigate to dashboard
    await page.goto('/dashboard', { timeout: 10000 }) // Same reduced timeout for pre-warmed Vite
    await page.waitForLoadState('load', { timeout: 8000 }) // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI
    
    // Semantic wait: Should still be authenticated (page should load, not redirect to login)
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 20000 }) // Reduced from 60s: 2-route test fits within 90s budget
    
    // Verify we're on dashboard (not redirected to home)
    const url = page.url()
    expect(url).toContain('/dashboard')
  })

  test('should display compliance gating when accessing token creation', async ({ page }) => {
    // loginWithCredentials() adds ~5s backend timeout + 60s visibility assertion → needs 90s budget
    test.setTimeout(90000)
    // Use loginWithCredentials for critical journey — validates backend auth contract
    await loginWithCredentials(page, 'compliance@example.com')
    
    // Navigate to guided launch
    await page.goto('/launch/guided', { timeout: 15000 }) // Vite pre-warmed — 15s sufficient; sum 5+15+10+30+5=65s < 90s budget
    await page.waitForLoadState('load', { timeout: 10000 }) // 'load' not 'networkidle' — Vite HMR SSE prevents networkidle in CI

    // Semantic wait: Page should load (compliance gating may be shown or wizard may be accessible)
    const title = page.getByRole('heading', { level: 1 }).first()
    await expect(title).toBeVisible({ timeout: 30000 }) // Reduced from 60s: Vite pre-warmed, fits within 90s budget

    // Check main content area for compliance-related text using body.innerText()
    // (not page.content() which includes compiled bundle strings)
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '') // Explicit timeout prevents inheriting 90s test budget
    const hasComplianceText = bodyText.toLowerCase().includes('compliance')

    // Guided launch should reference compliance somewhere in the visible flow
    expect(hasComplianceText).toBe(true)
  })
})
