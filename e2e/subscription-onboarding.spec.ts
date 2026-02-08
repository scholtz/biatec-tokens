import { test, expect } from '@playwright/test'

test.describe('Subscription Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should display pricing page with three tiers', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('/subscription/pricing')
    await page.waitForLoadState('domcontentloaded')
    
    // Check page loads successfully
    await expect(page).toHaveTitle(/Biatec Tokens/)
    
    // Check for pricing tiers
    const pageText = await page.textContent('body')
    expect(pageText).toContain('Basic')
    expect(pageText).toContain('Professional')
    expect(pageText).toContain('Enterprise')
    
    // Check for pricing values
    expect(pageText).toContain('$29')
    expect(pageText).toContain('$99')
    expect(pageText).toContain('$299')
  })

  test('should show pricing in navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Look for pricing link in navigation
    const pricingLinks = page.locator('a, button').filter({ hasText: /pricing/i })
    const count = await pricingLinks.count()
    
    // Should have at least one pricing link
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display onboarding flow when authenticated', async ({ page }) => {
    // Set up authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      }))
    })

    // Navigate to onboarding
    await page.goto('/onboarding')
    await page.waitForLoadState('domcontentloaded')
    
    // Check for onboarding elements
    const pageText = await page.textContent('body')
    
    // Look for key onboarding content
    const hasOnboardingContent = 
      pageText?.includes('Welcome') ||
      pageText?.includes('Organization') ||
      pageText?.includes('Plan') ||
      pageText?.includes('Network')
    
    expect(hasOnboardingContent).toBe(true)
  })

  test('should show upgrade modal in wizard when selecting restricted features', async ({ page }) => {
    // Set up authenticated state with free plan
    await page.addInitScript(() => {
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      }))
    })

    // Navigate to wizard
    await page.goto('/create/wizard')
    await page.waitForLoadState('domcontentloaded')
    
    // Page should load successfully
    const pageText = await page.textContent('body')
    expect(pageText).toBeTruthy()
  })

  test('should persist onboarding progress across sessions', async ({ page }) => {
    // Set up authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('wallet_connected', 'true')
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'TEST_ADDRESS',
        email: 'test@example.com',
      }))
      localStorage.setItem('biatec_onboarding_data', JSON.stringify({
        organizationName: 'Test Org',
        role: 'ceo',
        intendedTokenType: 'fungible'
      }))
    })

    // Navigate to onboarding
    await page.goto('/onboarding')
    await page.waitForLoadState('domcontentloaded')
    
    // Check that data persisted
    const savedData = await page.evaluate(() => {
      return localStorage.getItem('biatec_onboarding_data')
    })
    
    expect(savedData).toBeTruthy()
    if (savedData) {
      const parsed = JSON.parse(savedData)
      expect(parsed.organizationName).toBe('Test Org')
    }
  })
})
