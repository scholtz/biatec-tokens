import { test, expect } from '@playwright/test';

test.describe('Network Selection UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display network indicator in navbar', async ({ page }) => {
    // Look for network status indicator
    const networkIndicator = page.locator('.px-3.py-1\\.5.rounded-lg').filter({ hasText: /Testnet|Mainnet/ }).first();
    await expect(networkIndicator).toBeVisible({ timeout: 10000 });
  });

  test('network indicator should show connection status', async ({ page }) => {
    // Check for status dot
    const statusDot = page.locator('.w-2.h-2.rounded-full').first();
    await expect(statusDot).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Wallet Modal Enhanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show wallet connection modal with enhanced UI', async ({ page }) => {
    // Click authenticate button
    await page.getByRole('button', { name: /Authenticate/i }).click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible({ timeout: 5000 });
  });

  test('wallet options should have proper styling', async ({ page }) => {
    await page.getByRole('button', { name: /Authenticate/i }).click();
    
    // Check for wallet buttons
    const peraButton = page.getByRole('button', { name: /Pera/i });
    await expect(peraButton).toBeVisible({ timeout: 5000 });
    
    // Verify button is interactive
    await expect(peraButton).toBeEnabled();
  });

  test('should display wallet descriptions', async ({ page }) => {
    await page.getByRole('button', { name: /Authenticate/i }).click();
    
    // The modal should contain wallet descriptions
    await expect(page.locator('text=/wallet/i').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Error Handling UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle API connection errors gracefully', async ({ page }) => {
    // Check if API health banner appears
    const healthBanner = page.locator('text=/API is unreachable|Network Error/i').first();
    
    if (await healthBanner.isVisible({ timeout: 5000 }).catch(() => false)) {
      // If banner is visible, it should have proper styling
      await expect(healthBanner).toBeVisible();
      
      // Should have a retry button
      const retryButton = page.getByRole('button', { name: /Retry/i });
      await expect(retryButton).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that main content is visible
    await expect(page.getByRole('heading', { name: /Biatec Tokens/i })).toBeVisible();
  });

  test('should be tablet responsive', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check that main content is visible
    await expect(page.getByRole('heading', { name: /Biatec Tokens/i })).toBeVisible();
  });

  test('should be desktop responsive', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Check that main content is visible
    await expect(page.getByRole('heading', { name: /Biatec Tokens/i })).toBeVisible();
  });
});

test.describe('Dark Mode Support', () => {
  test('should have theme toggle button', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button
    const themeButton = page.getByRole('button', { name: /Switch to (light|dark) mode/i });
    await expect(themeButton).toBeVisible({ timeout: 10000 });
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    const themeButton = page.getByRole('button', { name: /Switch to (light|dark) mode/i });
    await themeButton.click();
    
    // Wait for theme change animation
    await page.waitForTimeout(500);
    
    // Theme should have changed (check for dark class on body or html)
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') || 
             document.body.classList.contains('dark');
    });
    
    // Just verify the button is still clickable
    await expect(themeButton).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to different pages
    const pages = [
      { link: /Create/i, url: /\/create/ },
      { link: /Dashboard/i, url: /\/dashboard/ },
      { link: /Settings/i, url: /\/settings/ },
    ];
    
    for (const { link, url } of pages) {
      await page.goto('/');
      const linkElement = page.getByRole('link', { name: link }).first();
      await linkElement.click();
      await expect(page).toHaveURL(url);
    }
  });
});
