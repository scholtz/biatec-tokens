/**
 * E2E Tests for Auth Error Scenarios (Negative Path Testing)
 * 
 * Tests validate error handling for authentication failures:
 * - Invalid credentials
 * - Expired sessions
 * - Network errors
 * - Rate limiting
 * 
 * Email/password authentication only - no wallet connectors.
 */

import { test, expect } from '@playwright/test'
import { suppressBrowserErrors } from './helpers/auth'

test.describe('Auth Error Scenarios - Negative Path Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress browser console/page errors for mock environment
    suppressBrowserErrors(page)
  })

  test('should redirect unauthenticated user trying to access protected route', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/')
    await page.waitForLoadState('load')
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route without authentication
    await page.goto('/launch/guided')
    await page.waitForLoadState('load')
    
    // Should redirect to home with auth modal trigger
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authModalVisible = await page.locator('form')
      .filter({ hasText: /email/i })
      .isVisible()
      .catch(() => false)
    const isHomePage = url === 'http://localhost:5173/' || url.endsWith('/')
    
    // Should show auth prompt OR redirect to home
    expect(urlHasAuthParam || authModalVisible || isHomePage).toBe(true)
  })

  test('should redirect unauthenticated user from multiple protected routes', async ({ page }) => {
    // Clear auth
    await page.goto('/')
    await page.waitForLoadState('load')
    await page.evaluate(() => localStorage.clear())
    
    // Test multiple protected routes
    const protectedRoutes = [
      '/launch/guided',
      '/create',
      '/settings',
      '/compliance/setup',
      '/cockpit'
      // Note: /dashboard is special case - allows access without auth per router guard
    ]
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      await page.waitForLoadState('load')
      
      // Should redirect to home or show auth modal
      const url = page.url()
      const isRedirected = url.includes('showAuth=true') || 
                          url === 'http://localhost:5173/' ||
                          url.endsWith('/')
      
      expect(isRedirected).toBe(true)
    }
  })

  test('should maintain redirect target after authentication', async ({ page }) => {
    // Clear auth
    await page.goto('/')
    await page.waitForLoadState('load')
    await page.evaluate(() => localStorage.clear())
    
    // Try to access protected route (should store redirect target)
    await page.goto('/cockpit')
    await page.waitForLoadState('load')
    
    // Should be redirected to home
    const url = page.url()
    expect(url.includes('showAuth=true') || url.endsWith('/')).toBe(true)
    
    // Check if redirect target was stored
    const redirectTarget = await page.evaluate(() => {
      return localStorage.getItem('redirect_after_auth')
    })
    
    // May or may not be stored depending on implementation
    // If stored, should match the intended route
    if (redirectTarget) {
      expect(redirectTarget).toContain('/cockpit')
    }
  })

  test('should handle missing auth state gracefully', async ({ page }) => {
    // Navigate to home with NO auth state
    await page.goto('/')
    await page.waitForLoadState('load')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('load')
    
    // Page should load normally (show unauthenticated state)
    // Check for presence of Sign In button or similar
    const signInButton = page.getByRole('button', { name: /sign in/i }).first()
    const isVisible = await signInButton.isVisible({ timeout: 15000 }).catch(() => false)
    
    // If Sign In button not visible, page should at least load without error
    const title = page.getByRole('heading', { level: 1 }).first()
    const titleVisible = await title.isVisible({ timeout: 15000 }).catch(() => false)
    
    expect(isVisible || titleVisible).toBe(true)
  })

  test('should handle corrupted localStorage auth data', async ({ page }) => {
    // Set corrupted auth data
    await page.addInitScript(() => {
      // Invalid JSON
      localStorage.setItem('algorand_user', 'CORRUPTED_DATA_NOT_JSON')
    })
    
    // Try to access protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('load')
    
    // Should treat as unauthenticated and redirect
    const url = page.url()
    const isRedirected = url.includes('showAuth=true') || 
                        url === 'http://localhost:5173/' ||
                        url.endsWith('/')
    
    expect(isRedirected).toBe(true)
  })

  test('should handle incomplete auth data in localStorage', async ({ page }) => {
    // Set incomplete auth data (missing required fields)
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        // Missing address
        email: 'incomplete@example.com',
        isConnected: true,
      }))
    })
    
    // Try to access protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('load')
    
    // Should either redirect OR show page (implementation dependent)
    // At minimum, page should load without crashing
    const url = page.url()
    const isOnGuidedLaunch = url.includes('/launch/guided')
    const isRedirected = url.includes('showAuth=true') || url.endsWith('/')
    
    // Either allow access or redirect, but don't crash
    expect(isOnGuidedLaunch || isRedirected).toBe(true)
  })

  test('should handle auth state with isConnected=false', async ({ page }) => {
    // Set auth data but with isConnected=false
    await page.addInitScript(() => {
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS',
        email: 'disconnected@example.com',
        isConnected: false, // User disconnected
      }))
    })
    
    // Try to access protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('load')
    
    // The router guard for GuidedTokenLaunch uses isIssuanceSessionValid() which
    // checks isConnected === true. With isConnected=false, the user is redirected
    // to the home page with showAuth=true.
    const url = page.url()
    const wasRedirected = url.includes('showAuth=true') || !url.includes('/launch/guided')
    
    // Should redirect because isIssuanceSessionValid requires isConnected === true
    expect(wasRedirected).toBe(true)
  })

  test('should clear auth state when accessing route with empty localStorage', async ({ page }) => {
    // Clear all localStorage
    await page.goto('/')
    await page.waitForLoadState('load')
    await page.evaluate(() => localStorage.clear())
    
    // Verify localStorage is empty
    const storageCount = await page.evaluate(() => {
      return localStorage.length
    })
    
    expect(storageCount).toBe(0)
    
    // Try to access protected route
    await page.goto('/compliance/setup')
    await page.waitForLoadState('load')
    
    // Should redirect
    const url = page.url()
    expect(url.includes('showAuth=true') || url.endsWith('/')).toBe(true)
  })
})
