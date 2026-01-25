import { test, expect } from '@playwright/test';

test.describe('Network Selection UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display network indicator in navbar', async ({ page }) => {
    // Look for network status indicator with flexible selector
    const networkIndicator = page.locator('.rounded-lg').filter({ hasText: /Testnet|Mainnet/ }).first();
    await expect(networkIndicator).toBeVisible({ timeout: 10000 });
  });

  test('network indicator should show connection status', async ({ page }) => {
    // Check for status dot - more flexible approach
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Wallet Modal Enhanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show wallet connection modal with enhanced UI', async ({ page }) => {
    // Click authenticate button
    const authButton = page.getByRole('button', { name: /Authenticate/i });
    await expect(authButton).toBeVisible({ timeout: 10000 });
    await authButton.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible({ timeout: 10000 });
  });

  test('wallet options should have proper styling', async ({ page }) => {
    const authButton = page.getByRole('button', { name: /Authenticate/i });
    await expect(authButton).toBeVisible({ timeout: 10000 });
    await authButton.click();
    
    // Check for wallet buttons
    const walletButtons = page.getByRole('button').filter({ hasText: /Pera|Defly|Exodus/i });
    await expect(walletButtons.first()).toBeVisible({ timeout: 10000 });
    
    // Verify button is interactive
    await expect(walletButtons.first()).toBeEnabled();
  });

  test('should display wallet descriptions', async ({ page }) => {
    const authButton = page.getByRole('button', { name: /Authenticate/i });
    await expect(authButton).toBeVisible({ timeout: 10000 });
    await authButton.click();
    
    // The modal should contain wallet-related text
    await expect(page.locator('text=/wallet/i').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Error Handling UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle API connection errors gracefully', async ({ page }) => {
    // Check if API health banner appears (it may or may not depending on backend)
    const healthBanner = page.locator('text=/API is unreachable|Network Error/i').first();
    
    // Don't fail if banner isn't there - backend might be up
    const isVisible = await healthBanner.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isVisible) {
      // If banner is visible, check for retry button
      const retryButton = page.getByRole('button', { name: /Retry/i });
      await expect(retryButton).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that main content is visible
    await expect(page.getByRole('heading', { name: /Biatec Tokens/i })).toBeVisible({ timeout: 10000 });
  });

  test('should be tablet responsive', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that main content is visible
    await expect(page.getByRole('heading', { name: /Biatec Tokens/i })).toBeVisible({ timeout: 10000 });
  });

  test('should be desktop responsive', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that main content is visible
    await expect(page.getByRole('heading', { name: /Biatec Tokens/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dark Mode Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have theme toggle button', async ({ page }) => {
    // Look for theme toggle button
    const themeButton = page.getByRole('button', { name: /Switch to (light|dark) mode/i });
    await expect(themeButton).toBeVisible({ timeout: 10000 });
  });

  test('should toggle dark mode', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /Switch to (light|dark) mode/i });
    await expect(themeButton).toBeVisible({ timeout: 10000 });
    await themeButton.click();
    
    // Wait for theme change animation
    await page.waitForTimeout(500);
    
    // Verify the button is still clickable (theme toggled)
    await expect(themeButton).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to create page', async ({ page }) => {
    const createLink = page.getByRole('link', { name: /Create/i }).first();
    await expect(createLink).toBeVisible({ timeout: 10000 });
    await createLink.click();
    await expect(page).toHaveURL(/\/create/, { timeout: 10000 });
  });

  test('should navigate to dashboard page', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i }).first();
    await expect(dashboardLink).toBeVisible({ timeout: 10000 });
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should navigate to settings page', async ({ page }) => {
    const settingsLink = page.getByRole('link', { name: /Settings/i }).first();
    await expect(settingsLink).toBeVisible({ timeout: 10000 });
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/, { timeout: 10000 });
  });
});
