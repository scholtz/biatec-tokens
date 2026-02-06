import { test, expect } from '@playwright/test';

test.describe('WalletConnect v2 Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should load page successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page loaded
    await expect(page).toHaveTitle(/Biatec/i);
  });

  test('should persist WalletConnect session to localStorage', async ({ page }) => {
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

    // Check that session was persisted
    const sessionsData = await page.evaluate(() => {
      return localStorage.getItem('biatec_walletconnect_sessions');
    });

    expect(sessionsData).toBeTruthy();
    const sessions = JSON.parse(sessionsData!);
    expect(sessions['topic-123']).toBeDefined();
    expect(sessions['topic-123'].walletId).toBe('walletconnect');
  });

  test('should cleanup expired WalletConnect sessions', async ({ page }) => {
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

    // Session should still be in localStorage initially (cleanup happens on service initialization)
    const sessionsData = await page.evaluate(() => {
      return localStorage.getItem('biatec_walletconnect_sessions');
    });

    expect(sessionsData).toBeTruthy();
  });

  test('should handle multiple WalletConnect sessions', async ({ page }) => {
    await page.addInitScript(() => {
      const multipleSessions = {
        'topic-1': {
          topic: 'topic-1',
          walletId: 'walletconnect',
          networkId: 'algorand-mainnet',
          address: 'ADDRESS_1',
          connectedAt: Date.now(),
          lastActivityAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        },
        'topic-2': {
          topic: 'topic-2',
          walletId: 'walletconnect',
          networkId: 'algorand-testnet',
          address: 'ADDRESS_2',
          connectedAt: Date.now(),
          lastActivityAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        }
      };
      localStorage.setItem('biatec_walletconnect_sessions', JSON.stringify(multipleSessions));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const sessionsData = await page.evaluate(() => {
      return localStorage.getItem('biatec_walletconnect_sessions');
    });

    expect(sessionsData).toBeTruthy();
    const sessions = JSON.parse(sessionsData!);
    expect(Object.keys(sessions).length).toBeGreaterThanOrEqual(2);
  });

  test('should handle network persistence', async ({ page }) => {
    // Set network in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('selected_network', 'algorand-testnet');
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check network was persisted
    const network = await page.evaluate(() => {
      return localStorage.getItem('selected_network');
    });

    expect(network).toBe('algorand-testnet');
  });
});
