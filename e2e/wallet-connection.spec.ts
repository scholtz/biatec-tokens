import { test, expect } from '@playwright/test';

test.describe('Wallet Connection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Biatec Tokens/);
    await expect(page.getByRole('heading', { name: /Next-Generation Tokenization Platform/i })).toBeVisible();
  });

  test('should show network status indicator', async ({ page }) => {
    // Check for network status indicator in navbar
    const networkStatus = page.locator('text=Testnet, text=Mainnet').first();
    await expect(networkStatus).toBeVisible({ timeout: 10000 });
  });

  test('should have authentication button', async ({ page }) => {
    const authButton = page.getByRole('button', { name: /Authenticate/i });
    await expect(authButton).toBeVisible();
  });

  test('should open authentication modal on button click', async ({ page }) => {
    const authButton = page.getByRole('button', { name: /Authenticate/i });
    await authButton.click();
    
    // Wait for modal to appear
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible({ timeout: 5000 });
  });

  test('should display wallet options in authentication modal', async ({ page }) => {
    const authButton = page.getByRole('button', { name: /Authenticate/i });
    await authButton.click();
    
    // Check for wallet options
    await expect(page.getByText(/Or connect with/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Pera/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Defly/i })).toBeVisible();
  });

  test('should be able to close authentication modal', async ({ page }) => {
    const authButton = page.getByRole('button', { name: /Authenticate/i });
    await authButton.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible({ timeout: 5000 });
    
    // Click "Go back" button
    const goBackButton = page.getByRole('button', { name: /Go back/i });
    await goBackButton.click();
    
    // Modal should be closed
    await expect(page.getByRole('heading', { name: /Sign in/i })).not.toBeVisible();
  });

  test('should navigate to token creation page', async ({ page }) => {
    const createButton = page.getByRole('link', { name: /Create Token/i }).first();
    await createButton.click();
    
    await expect(page).toHaveURL(/\/create/);
  });

  test('should navigate to dashboard', async ({ page }) => {
    const dashboardButton = page.getByRole('link', { name: /Dashboard/i }).first();
    await dashboardButton.click();
    
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display token standards section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Supported Token Standards/i })).toBeVisible();
    
    // Check for some token standards
    await expect(page.getByText(/ASA/)).toBeVisible();
    await expect(page.getByText(/ARC3FT/)).toBeVisible();
    await expect(page.getByText(/ARC200/)).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('Biatec Tokens');
  });
});
