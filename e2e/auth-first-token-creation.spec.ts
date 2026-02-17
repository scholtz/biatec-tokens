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
  test('should redirect unauthenticated user to login when accessing /launch/guided', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Wait for auth guard redirect
    
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
    await page.waitForTimeout(1000)
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route
    await page.goto('/create')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Wait for auth guard redirect
    
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
    await page.waitForTimeout(10000) // CI needs extra time for auth store init + mount
    
    // Should display the page title
    const title = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(title).toBeVisible({ timeout: 45000 })
    
    // Should show auth-first messaging
    const subtitle = page.getByText(/email.*password.*authentication/i)
    await expect(subtitle).toBeVisible({ timeout: 45000 })
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
    await page.waitForTimeout(10000) // CI needs extra time
    
    // Should display the page (check for token creation related content)
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 45000 })
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
    await page.waitForTimeout(10000)
    
    // Get page content
    const content = await page.content()
    
    // Verify no "Not connected" text
    expect(content).not.toContain('Not connected')
    
    // Verify no wallet connector references in navigation
    expect(content).not.toMatch(/WalletConnect/i)
    expect(content).not.toMatch(/MetaMask/i)
    expect(content).not.toMatch(/Pera\s+Wallet/i)
    expect(content).not.toMatch(/Defly/i)
    
    // Navigation should show email-based auth indicator
    const userEmail = page.getByText('test@example.com')
    await expect(userEmail).toBeVisible({ timeout: 15000 })
  })

  test('should show email/password authentication elements for unauthenticated users', async ({ page }) => {
    // Clear auth
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Should show Sign In button (not "Connect Wallet")
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await expect(signInButton).toBeVisible({ timeout: 15000 })
    
    // Button text should not mention wallet
    const buttonText = await signInButton.textContent()
    expect(buttonText).not.toMatch(/wallet|connect/i)
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
    await page.waitForTimeout(10000)
    
    // Verify authenticated
    const email1 = page.getByText('auth-persist@example.com')
    await expect(email1).toBeVisible({ timeout: 45000 })
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)
    
    // Should still be authenticated
    const email2 = page.getByText('auth-persist@example.com')
    await expect(email2).toBeVisible({ timeout: 30000 })
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
    await page.waitForTimeout(10000)
    
    // Page should load (compliance gating may be shown or wizard may be accessible)
    const title = page.getByRole('heading', { level: 1 }).first()
    await expect(title).toBeVisible({ timeout: 45000 })
    
    // Check if compliance-related text is present (either in gating or in steps)
    const pageContent = await page.content()
    const hasComplianceText = pageContent.includes('compliance') || pageContent.includes('Compliance')
    
    // Guided launch should reference compliance somewhere in the flow
    expect(hasComplianceText).toBe(true)
  })
})
