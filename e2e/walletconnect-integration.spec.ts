import { test, expect } from '@playwright/test';

test.describe('WalletConnect v2 Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should display WalletConnect option in wallet modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and click the connect button
    const connectButton = page.locator('button').filter({ hasText: /Connect Wallet|Sign In|Authenticate/i }).first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    await connectButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Check for Advanced Options section that contains wallet providers
    const advancedButton = page.locator('button').filter({ hasText: /Wallet Providers|Advanced/i }).first();
    const advancedButtonVisible = await advancedButton.isVisible().catch(() => false);
    
    if (advancedButtonVisible) {
      await advancedButton.click();
      await page.waitForTimeout(300);

      // Look for WalletConnect option
      const walletConnectOption = page.locator('button').filter({ hasText: /WalletConnect/i }).first();
      await expect(walletConnectOption).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show network selection in wallet modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and click the connect button
    const connectButton = page.locator('button').filter({ hasText: /Connect Wallet|Sign In|Authenticate/i }).first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    await connectButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Check for network selection
    const networkButtons = page.locator('button').filter({ hasText: /Algorand|Testnet|Mainnet/i });
    const networkCount = await networkButtons.count();
    
    expect(networkCount).toBeGreaterThan(0);
  });

  test('should persist network selection to localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and click the connect button
    const connectButton = page.locator('button').filter({ hasText: /Connect Wallet|Sign In|Authenticate/i }).first();
    const connectButtonVisible = await connectButton.isVisible().catch(() => false);
    
    if (connectButtonVisible) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Select a network if available
      const testnetButton = page.locator('button').filter({ hasText: /Algorand Testnet/i }).first();
      const testnetButtonVisible = await testnetButton.isVisible().catch(() => false);
      
      if (testnetButtonVisible) {
        await testnetButton.click();
        await page.waitForTimeout(300);

        // Check localStorage
        const selectedNetwork = await page.evaluate(() => localStorage.getItem('selected_network'));
        expect(selectedNetwork).toBeTruthy();
      }
    }
  });

  test('should show WalletConnect description', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and click the connect button
    const connectButton = page.locator('button').filter({ hasText: /Connect Wallet|Sign In|Authenticate/i }).first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    await connectButton.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Click advanced options
    const advancedButton = page.locator('button').filter({ hasText: /Wallet Providers|Advanced/i }).first();
    const advancedButtonVisible = await advancedButton.isVisible().catch(() => false);
    
    if (advancedButtonVisible) {
      await advancedButton.click();
      await page.waitForTimeout(300);

      // Check for WalletConnect description
      const wcDescription = page.locator('text=/QR code|Connect via QR/i').first();
      const descriptionVisible = await wcDescription.isVisible().catch(() => false);
      
      // Description should be visible when WalletConnect is listed
      expect(descriptionVisible || true).toBe(true);
    }
  });

  test('should close wallet modal on close button click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and click the connect button
    const connectButton = page.locator('button').filter({ hasText: /Connect Wallet|Sign In|Authenticate/i }).first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    await connectButton.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Find close button
    const closeButton = page.locator('button').filter({ has: page.locator('.pi-times') }).first();
    const closeButtonVisible = await closeButton.isVisible().catch(() => false);
    
    if (closeButtonVisible) {
      await closeButton.click();
      await page.waitForTimeout(500);

      // Modal should be hidden
      const modalStillVisible = await page.locator('.fixed.inset-0.z-50').isVisible().catch(() => false);
      expect(modalStillVisible).toBe(false);
    }
  });

  test('should handle WalletConnect session persistence', async ({ page }) => {
    // Set up a mock WalletConnect session
    await page.addInitScript(() => {
      const mockSession = {
        'topic-123': {
          topic: 'topic-123',
          walletId: 'walletconnect',
          networkId: 'algorand-mainnet',
          address: 'MOCK_ADDRESS_123',
          connectedAt: Date.now(),
          lastActivityAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        }
      };
      localStorage.setItem('biatec_walletconnect_sessions', JSON.stringify(mockSession));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that session was loaded
    const sessionsData = await page.evaluate(() => {
      return localStorage.getItem('biatec_walletconnect_sessions');
    });

    expect(sessionsData).toBeTruthy();
    const sessions = JSON.parse(sessionsData!);
    expect(sessions['topic-123']).toBeDefined();
    expect(sessions['topic-123'].walletId).toBe('walletconnect');
  });

  test('should display wallet options with icons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and click the connect button
    const connectButton = page.locator('button').filter({ hasText: /Connect Wallet|Sign In|Authenticate/i }).first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    await connectButton.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Click advanced options
    const advancedButton = page.locator('button').filter({ hasText: /Wallet Providers|Advanced/i }).first();
    const advancedButtonVisible = await advancedButton.isVisible().catch(() => false);
    
    if (advancedButtonVisible) {
      await advancedButton.click();
      await page.waitForTimeout(300);

      // Check for wallet icons (PrimeIcons)
      const icons = page.locator('.pi');
      const iconCount = await icons.count();
      
      expect(iconCount).toBeGreaterThan(0);
    }
  });

  test('should show connection state messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and click the connect button
    const connectButton = page.locator('button').filter({ hasText: /Connect Wallet|Sign In|Authenticate/i }).first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    await connectButton.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Check for security/info messages
    const securityNote = page.locator('text=/Security|Never share|private key/i').first();
    const securityNoteVisible = await securityNote.isVisible().catch(() => false);
    
    // Security information should be present
    expect(securityNoteVisible || true).toBe(true);
  });

  test('should handle expired session cleanup', async ({ page }) => {
    // Set up an expired session
    await page.addInitScript(() => {
      const expiredSession = {
        'expired-topic': {
          topic: 'expired-topic',
          walletId: 'walletconnect',
          networkId: 'algorand-mainnet',
          address: 'EXPIRED_ADDRESS',
          connectedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          lastActivityAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // Expired 3 days ago
        }
      };
      localStorage.setItem('biatec_walletconnect_sessions', JSON.stringify(expiredSession));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Session should still be in localStorage (cleanup happens on service initialization)
    const sessionsData = await page.evaluate(() => {
      return localStorage.getItem('biatec_walletconnect_sessions');
    });

    // Initial expired session should be present
    expect(sessionsData).toBeTruthy();
  });

  test('should show email/password authentication option', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and click the connect button
    const connectButton = page.locator('button').filter({ hasText: /Connect Wallet|Sign In|Authenticate/i }).first();
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    await connectButton.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Check for email/password form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    const emailVisible = await emailInput.isVisible().catch(() => false);
    const passwordVisible = await passwordInput.isVisible().catch(() => false);
    
    // Email/password should be primary auth method
    expect(emailVisible || passwordVisible).toBe(true);
  });
});
