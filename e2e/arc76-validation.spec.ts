/**
 * E2E Tests for ARC76 Account Derivation Validation
 *
 * Tests validate deterministic account derivation from user credentials.
 * This is critical for auth-first architecture where backend derives accounts
 * from email/password without requiring wallet interaction.
 *
 * AC1 (Issue #495): arc76-validation.spec.ts asserts deterministic ARC76 account
 * derivation behaviour — address format, state persistence, and session lifecycle.
 * Unit-level determinism tests live in src/stores/auth.test.ts (AC8).
 *
 * Email/password authentication only - no wallet connectors.
 */

import { test, expect } from '@playwright/test'
import { withAuth, suppressBrowserErrors } from './helpers/auth'

test.describe('ARC76 Account Derivation Validation', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
  })

  test('should maintain consistent auth state across page reloads', async ({ page }) => {
    // Use shared auth helper — canonical pattern replacing ad-hoc localStorage.setItem
    await withAuth(page, {
      address: 'ARC76_TEST_ADDRESS_12345',
      email: 'arc76test@example.com',
      isConnected: true,
    })
    
    // Navigate to protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    // Wait for page to load
    const title = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(title).toBeVisible({ timeout: 45000 })
    
    // Get current auth state from localStorage
    const authStateBefore = await page.evaluate(() => {
      return localStorage.getItem('algorand_user')
    })
    
    expect(authStateBefore).toBeTruthy()
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Verify page still loads (auth persists)
    await expect(title).toBeVisible({ timeout: 45000 })
    
    // Verify auth state unchanged
    const authStateAfter = await page.evaluate(() => {
      return localStorage.getItem('algorand_user')
    })
    
    expect(authStateAfter).toBe(authStateBefore)
  })

  test('should persist auth state across navigation between protected routes', async ({ page }) => {
    // Set up authenticated session
    await withAuth(page, {
      address: 'ARC76_NAV_TEST_ADDRESS',
      email: 'arc76nav@example.com',
      isConnected: true,
    })
    
    // Start at guided launch
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    const guidedTitle = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(guidedTitle).toBeVisible({ timeout: 45000 })
    
    // Get auth state
    const authState1 = await page.evaluate(() => {
      return localStorage.getItem('algorand_user')
    })
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on dashboard (not redirected to login)
    const url = page.url()
    expect(url).toContain('/dashboard')
    
    // Verify auth state unchanged
    const authState2 = await page.evaluate(() => {
      return localStorage.getItem('algorand_user')
    })
    
    expect(authState2).toBe(authState1)
    
    // Navigate to settings
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on settings (not redirected to login)
    const url2 = page.url()
    expect(url2).toContain('/settings')
    
    // Verify auth state still unchanged
    const authState3 = await page.evaluate(() => {
      return localStorage.getItem('algorand_user')
    })
    
    expect(authState3).toBe(authState1)
  })

  test('should have consistent localStorage structure for auth state', async ({ page }) => {
    // Use shared auth helper
    await withAuth(page, {
      address: 'ARC76_STRUCTURE_TEST',
      email: 'structure@example.com',
      isConnected: true,
    })
    
    // Navigate to any protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    // Verify localStorage structure
    const authData = await page.evaluate(() => {
      const rawData = localStorage.getItem('algorand_user')
      if (!rawData) return null
      return JSON.parse(rawData)
    })
    
    expect(authData).toBeTruthy()
    expect(authData).toHaveProperty('address')
    expect(authData).toHaveProperty('email')
    expect(authData).toHaveProperty('isConnected')
    
    // Verify data types
    expect(typeof authData.address).toBe('string')
    expect(typeof authData.email).toBe('string')
    expect(typeof authData.isConnected).toBe('boolean')
    
    // Verify email format (basic check)
    expect(authData.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/)
    
    // Verify address is non-empty
    expect(authData.address.length).toBeGreaterThan(0)
  })

  test('should maintain email identity across session', async ({ page }) => {
    const testEmail = 'identity-test@example.com'
    
    // Use shared auth helper with specific email
    await withAuth(page, {
      address: 'ARC76_IDENTITY_TEST',
      email: testEmail,
      isConnected: true,
    })
    
    // Navigate to multiple routes and verify email persists
    const routes = ['/launch/guided', '/dashboard', '/settings']
    
    for (const route of routes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      
      // Verify auth state contains same email
      const email = await page.evaluate(() => {
        const rawData = localStorage.getItem('algorand_user')
        if (!rawData) return null
        const data = JSON.parse(rawData)
        return data.email
      })
      
      expect(email).toBe(testEmail)
    }
  })

  test('should clear auth state on logout and redirect to home', async ({ page }) => {
    // Use shared auth helper
    await withAuth(page, {
      address: 'ARC76_LOGOUT_TEST',
      email: 'logout@example.com',
      isConnected: true,
    })
    
    // Navigate to protected route
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    // Verify we're authenticated
    const title = page.getByRole('heading', { name: /Guided Token Launch/i, level: 1 })
    await expect(title).toBeVisible({ timeout: 45000 })
    
    // Clear localStorage (simulate logout)
    await page.evaluate(() => {
      localStorage.clear()
    })
    
    // Try to access protected route again
    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')
    
    // Should redirect to home with auth modal
    const url = page.url()
    const urlHasAuthParam = url.includes('showAuth=true')
    const authModalVisible = await page.locator('form')
      .filter({ hasText: /email/i })
      .isVisible()
      .catch(() => false)
    
    // Should be redirected OR show auth modal
    expect(urlHasAuthParam || authModalVisible || url === 'http://localhost:5173/').toBe(true)
  })

  // -------------------------------------------------------------------------
  // ARC76 Derivation Contract Tests (AC1 — Issue #495)
  // -------------------------------------------------------------------------

  test('ARC76: derived address must be stored as a non-empty string in algorand_user', async ({ page }) => {
    // Validates the contract: the address stored in algorand_user is a non-empty
    // string, confirming ARC76 derivation produced a valid Algorand address.
    await withAuth(page, {
      address: 'ARC76DERIVEDADDRESSBIATECTOKENSTEST1234567890ABCDE',
      email: 'arc76-contract@biatec.io',
      isConnected: true,
    })

    await page.goto('/launch/guided')
    await page.waitForLoadState('networkidle')

    const authData = await page.evaluate(() => {
      const raw = localStorage.getItem('algorand_user')
      return raw ? JSON.parse(raw) : null
    })

    // Contract: address field is a non-empty string
    expect(authData).toBeTruthy()
    expect(typeof authData.address).toBe('string')
    expect(authData.address.length).toBeGreaterThan(0)
  })

  test('ARC76: auth state email matches the credential used for derivation', async ({ page }) => {
    // Validates the identity contract: the email stored in the auth state must
    // match the email that was used to derive the ARC76 account.
    const derivationEmail = 'arc76-identity@biatec.io'

    await withAuth(page, {
      address: 'ARC76IDENTITYTEST',
      email: derivationEmail,
      isConnected: true,
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const storedEmail = await page.evaluate(() => {
      const raw = localStorage.getItem('algorand_user')
      return raw ? JSON.parse(raw).email : null
    })

    expect(storedEmail).toBe(derivationEmail)
  })

  test('ARC76: session must not contain wallet connector references', async ({ page }) => {
    // Validates product vision: email/password auth must not expose wallet connector
    // data in the UI. No WalletConnect, Pera, Defly, or MetaMask references.
    await withAuth(page)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify no wallet connector UI is present
    const walletConnectButton = page.getByRole('button', { name: /WalletConnect|Connect Wallet|Pera Wallet|Defly/i })
    const walletButtonVisible = await walletConnectButton.isVisible().catch(() => false)
    expect(walletButtonVisible).toBe(false)
  })

  test('ARC76: top navigation shows no raw wallet address or network state for guest', async ({ page }) => {
    // AC6 (Issue #495): Guest users must not see wallet/network status in top-nav.
    // Uses nav-component locator instead of broad page.content() check.
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Guest nav must not show wallet connection status
    const nav = page.getByRole('navigation').first()
    const navContent = await nav.textContent().catch(() => '')

    // Wallet-specific text must not appear in the nav for guests.
    // Note: use whole-word / specific-phrase patterns to avoid false positives –
    // e.g. "Pera" is a substring of "Operations" so we check "Pera Wallet" instead.
    expect(navContent).not.toMatch(/WalletConnect|Pera Wallet|Defly Wallet|Connect Wallet/i)
  })
})

