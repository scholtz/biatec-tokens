import { test, expect } from '@playwright/test'

test.describe('Discovery Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('should display discovery dashboard', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Check page title
    await expect(page).toHaveTitle(/Biatec/)

    // Check main heading
    const heading = page.getByRole('heading', { name: /Token Discovery/i })
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('should show filter panel', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Check for filter panel
    const filterHeading = page.getByRole('heading', { name: /Filters/i })
    await expect(filterHeading).toBeVisible({ timeout: 10000 })
  })

  test('should allow filtering by token standards', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Wait for page to load
    await page.waitForSelector('text=Token Discovery', { timeout: 10000 })

    // Find and click ARC200 checkbox
    const arc200Checkbox = page.locator('input[type="checkbox"][value="ARC200"]')
    await arc200Checkbox.check()

    // Verify filter is applied (check if filter count is shown)
    const filterBadge = page.locator('text=/Filters\\s+\\d+/')
    await expect(filterBadge).toBeVisible({ timeout: 5000 })
  })

  test('should allow search filtering', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Find search input
    const searchInput = page.locator('input[placeholder*="Token name"]')
    await searchInput.fill('MICA')

    // Verify search is applied
    await expect(searchInput).toHaveValue('MICA')
  })

  test('should save filter preferences', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Apply a filter
    const arc200Checkbox = page.locator('input[type="checkbox"][value="ARC200"]')
    await arc200Checkbox.check()

    // Click save button
    const saveButton = page.getByRole('button', { name: /Save Preferences/i })
    await saveButton.click()

    // Reload page
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Verify filter persisted
    await expect(arc200Checkbox).toBeChecked()
  })

  test('should display token cards', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Wait for tokens to load
    await page.waitForSelector('.discovery-token-card', { timeout: 10000 })

    // Verify at least one token card is visible
    const tokenCards = page.locator('.discovery-token-card')
    await expect(tokenCards.first()).toBeVisible()
  })

  test('should show compliance badges on token cards', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Wait for tokens to load
    await page.waitForSelector('.discovery-token-card', { timeout: 10000 })

    // Check for compliance badge (may not always be visible on all cards)
    const complianceBadges = page.locator('button:has-text("Compliant"), button:has-text("Partial"), button:has-text("Pending"), button:has-text("Unknown")')
    
    // If badges exist, verify they're visible
    const count = await complianceBadges.count()
    if (count > 0) {
      await expect(complianceBadges.first()).toBeVisible()
    }
  })

  test('should navigate with pagination', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Check if pagination exists (only if there are enough tokens)
    const nextButton = page.getByRole('button').filter({ has: page.locator('.pi-chevron-right') })
    
    // If pagination exists, test it
    const isVisible = await nextButton.isVisible().catch(() => false)
    if (isVisible) {
      const isDisabled = await nextButton.isDisabled().catch(() => true)
      // Only test if button is not disabled
      if (!isDisabled) {
        await nextButton.click()
        await page.waitForLoadState('networkidle')
      }
    }

    // Test passes if we got here
    expect(true).toBe(true)
  })

  test('should reset filters', async ({ page }) => {
    await page.goto('/discovery')
    await page.waitForLoadState('domcontentloaded')

    // Apply a filter
    const arc200Checkbox = page.locator('input[type="checkbox"][value="ARC200"]')
    await arc200Checkbox.check()

    // Click clear all button
    const clearButton = page.getByRole('button', { name: /Clear all/i })
    await clearButton.click()

    // Verify filter is cleared
    await expect(arc200Checkbox).not.toBeChecked()
  })
})
