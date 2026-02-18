/**
 * E2E Tests for Compliance Dashboard Auth-First Flow
 * 
 * Additional tests to improve coverage of compliance flows
 * with auth-first patterns and business roadmap alignment.
 */

import { test, expect } from '@playwright/test'

test.describe('Compliance Dashboard - Auth-First Flow', () => {
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

  test('should redirect unauthenticated user from compliance dashboard to login', async ({ page }) => {
    // Clear auth state
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.evaluate(() => localStorage.clear())
    
    // Try to access compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Auth guard redirect
    
    // Should redirect to home with auth modal trigger
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authModalVisible = await page.locator('form').filter({ hasText: /email/i }).isVisible().catch(() => false)
    
    expect(urlHasAuthParam || authModalVisible).toBe(true)
  })

  test('should allow authenticated user to access compliance dashboard', async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_COMPLIANCE_USER',
        email: 'compliance@example.com',
        isConnected: true,
      }))
    })
    
    // Navigate to compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Should display the dashboard - semantic wait replaces arbitrary 10s timeout
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 45000 })
  })

  test('should not display wallet UI in compliance dashboard', async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_COMPLIANCE_USER',
        email: 'compliance@example.com',
        isConnected: true,
      }))
    })
    
    // Navigate to compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Wait for page to load - semantic wait
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 45000 })
    
    // Get page content
    const content = await page.content()
    
    // Verify no wallet-related UI
    expect(content).not.toMatch(/WalletConnect|MetaMask|Pera.*Wallet|Defly/i)
    expect(content).not.toContain('connect wallet')
    expect(content).not.toContain('Not connected')
  })

  test('should maintain auth state when navigating from compliance to dashboard', async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_NAV_USER',
        email: 'nav-test@example.com',
        isConnected: true,
      }))
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
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ROADMAP_USER',
        email: 'roadmap@example.com',
        isConnected: true,
      }))
    })
    
    // Navigate to compliance dashboard
    await page.goto('/compliance/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Wait for page to load - semantic wait
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 45000 })
    
    // Get page content
    const content = await page.content()
    
    // Business roadmap requirements:
    // 1. Email/password only - NO wallet connectors
    expect(content).not.toMatch(/WalletConnect|MetaMask|Pera.*Wallet|Defly/i)
    
    // 2. Backend-driven (no frontend signing)
    expect(content).not.toContain('sign transaction')
    expect(content).not.toContain('approve in wallet')
    
    // 3. Compliance-first (compliance content should be present)
    const hasComplianceContent = content.includes('compliance') || content.includes('Compliance')
    expect(hasComplianceContent).toBe(true)
  })
})

test.describe('Compliance Orchestration - Auth-First Flow', () => {
  test('should redirect unauthenticated user from compliance orchestration to login', async ({ page }) => {
    // Clear auth state
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.evaluate(() => localStorage.clear())
    
    // Try to access compliance orchestration
    await page.goto('/compliance/orchestration')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Auth guard redirect
    
    // Should redirect to home with auth modal trigger
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authModalVisible = await page.locator('form').filter({ hasText: /email/i }).isVisible().catch(() => false)
    
    expect(urlHasAuthParam || authModalVisible).toBe(true)
  })

  test('should allow authenticated user to access compliance orchestration', async ({ page }) => {
    // Set up authenticated session
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ORCH_USER',
        email: 'orch@example.com',
        isConnected: true,
      }))
    })
    
    // Navigate to compliance orchestration
    await page.goto('/compliance/orchestration')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000) // CI needs extra time
    
    // Should display the page
    const heading = page.getByRole('heading', { level: 1 }).first()
    await expect(heading).toBeVisible({ timeout: 45000 })
  })
})
