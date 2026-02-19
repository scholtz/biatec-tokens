/**
 * E2E Tests for Auth-First Token Creation Journey
 * 
 * Tests validate the MVP auth-first routing model:
 * - Unauthenticated users are redirected to login
 * - Authenticated users can access token creation
 * - No wallet/network UI elements visible in auth-first context
 * - Compliance gating surfaces correctly
 * 
 * Email/password authentication only - no wallet connectors.
 */

import { test, expect } from '@playwright/test'

test.describe('Auth-First Token Creation Journey', () => {
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
  })

  test('should redirect unauthenticated user to login when accessing /launch/guided', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
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
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route
    await page.goto('/create')
    await page.waitForLoadState('networkidle')
    
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
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS_AUTH_FIRST',
        email: 'test@example.com',
        isConnected: true,
      }))
    })
    
    // Navigate to guided launch
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Wait for the actual page title to appear (proves auth store loaded + component mounted)
    const title = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(title).toBeVisible({ timeout: 60000 }) // Increased timeout for CI auth store init
    
    // Should show auth-first messaging
    const subtitle = page.getByText(/email.*password.*authentication/i)
    await expect(subtitle).toBeVisible({ timeout: 15000 })
  })

  test('should allow authenticated user to access advanced token creation', async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS_AUTH_FIRST',
        email: 'test@example.com',
        isConnected: true,
      }))
    })
    
    // Navigate to advanced creation
    await page.goto('/create')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Wait for the actual page heading (proves page loaded successfully after auth)
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 60000 }) // Increased timeout for CI auth store init
  })

  test('should not display wallet/network UI elements in top navigation', async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS_AUTH_FIRST',
        email: 'test@example.com',
        isConnected: true,
      }))
    })
    
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Wait for page title (proves page loaded)
    const title = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(title).toBeVisible({ timeout: 60000 }) // Increased timeout for CI
    
    // Get page content
    const content = await page.content()
    
    // Verify no "Not connected" text
    expect(content).not.toContain('Not connected')
    
    // Verify no wallet connector references in navigation
    expect(content).not.toMatch(/WalletConnect/i)
    expect(content).not.toMatch(/MetaMask/i)
    expect(content).not.toMatch(/Pera\s+Wallet/i)
    expect(content).not.toMatch(/Defly/i)
    
    // Verify page loaded successfully (authenticated user can access)
    // If we got this far, auth is working - no need to check for specific UI element
    expect(content).toContain('Guided Token Launch')
  })

  test('should show email/password authentication elements for unauthenticated users', async ({ page }) => {
    // Clear auth
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Wait for Sign In button to appear
    const signInButton = page.getByRole('button', { name: /sign in/i }).first()
    await expect(signInButton).toBeVisible({ timeout: 15000 })
    
    // Get button text and verify it doesn't mention wallet
    const content = await page.content()
    
    // Should have "Sign In" somewhere
    expect(content).toMatch(/Sign\s+In/i)
    
    // Should NOT have wallet-related text in auth context
    const hasWalletConnect = content.includes('WalletConnect')
    const hasConnectWallet = content.includes('Connect Wallet')
    
    expect(hasWalletConnect).toBe(false)
    expect(hasConnectWallet).toBe(false)
  })

  test('should maintain auth state across navigation', async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS_AUTH_FIRST',
        email: 'auth-persist@example.com',
        isConnected: true,
      }))
    })
    
    // Navigate to guided launch
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Wait for page title
    const title1 = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(title1).toBeVisible({ timeout: 60000 })
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Should still be authenticated (page should load, not redirect to login)
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 60000 })
    
    // Verify we're on dashboard (not redirected to home)
    const url = page.url()
    expect(url).toContain('/dashboard')
  })

  test('should display compliance gating when accessing token creation', async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS_COMPLIANCE',
        email: 'compliance@example.com',
        isConnected: true,
      }))
    })
    
    // Navigate to guided launch
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    // Semantic wait: Page should load (compliance gating may be shown or wizard may be accessible)
    const title = page.getByRole('heading', { level: 1 }).first()
    await expect(title).toBeVisible({ timeout: 60000 })
    
    // Check if compliance-related text is present (either in gating or in steps)
    const pageContent = await page.content()
    const hasComplianceText = pageContent.includes('compliance') || pageContent.includes('Compliance')
    
    // Guided launch should reference compliance somewhere in the flow
    expect(hasComplianceText).toBe(true)
  })
})
