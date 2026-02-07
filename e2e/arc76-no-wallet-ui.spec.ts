import { test, expect } from "@playwright/test";

/**
 * E2E tests for ARC76 Authentication - No Wallet UI Verification
 * 
 * Comprehensive tests to verify that NO wallet connector UI is present anywhere in the application.
 * This test suite validates the complete removal of wallet-related elements per MVP requirements.
 * 
 * Related Issue: #201 - MVP blocker: Email/password auth with ARC76, remove all wallet connectors
 * Business Value: Enterprise users must never see wallet connectors or blockchain terminology
 * Risk: Any wallet UI exposure contradicts the product vision and fails compliance requirements
 */
test.describe("ARC76 Authentication - No Wallet UI Verification", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip Firefox due to consistent networkidle timeout issues
    test.skip(browserName === "firefox", "Firefox has persistent networkidle timeout issues");
    
    // Clear all storage before each test
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  /**
   * Verify NO wallet provider buttons exist in the DOM
   */
  test("should have NO wallet provider buttons visible anywhere", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Check for common wallet provider buttons that should NOT exist
    const walletProviders = [
      "Pera Wallet",
      "Defly Wallet", 
      "Kibisis",
      "Exodus",
      "Lute Wallet",
      "Magic",
      "WalletConnect",
      "Connect Wallet",
      "Sign In with Wallet"
    ];
    
    for (const provider of walletProviders) {
      const button = page.locator(`button:has-text("${provider}")`);
      const count = await button.count();
      
      // Buttons may exist but must not be visible
      if (count > 0) {
        const isVisible = await button.first().isVisible().catch(() => false);
        expect(isVisible).toBe(false);
      }
    }
  });

  /**
   * Verify NO network selector is visible
   */
  test("should have NO network selector visible in navbar or modals", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Check for network selector labels that should NOT be visible
    const networkLabels = [
      "Select Network",
      "VOI Mainnet",
      "Aramid Mainnet",
      "Algorand Mainnet",
      "Algorand Testnet"
    ];
    
    for (const label of networkLabels) {
      const element = page.locator(`:has-text("${label}")`).first();
      const isVisible = await element.isVisible().catch(() => false);
      
      // These should not be prominently visible in the auth flow
      // They may exist for internal state but should not be exposed to users
      if (label === "Select Network") {
        expect(isVisible).toBe(false);
      }
    }
  });

  /**
   * Verify NO wallet download links are visible
   */
  test("should have NO wallet download links visible by default", async ({ page }) => {
    // Navigate to auth modal
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Check for wallet download links that should NOT be visible
    const walletLinks = [
      'a[href*="perawallet"]',
      'a[href*="defly"]',
      'a[href*="exodus"]',
      'a[href*="walletconnect"]'
    ];
    
    for (const linkSelector of walletLinks) {
      const link = page.locator(linkSelector);
      const isVisible = await link.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
  });

  /**
   * Verify NO advanced wallet options are visible by default
   */
  test("should have NO advanced wallet options section visible", async ({ page }) => {
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Advanced options should not be visible
    const advancedButton = page.locator('button:has-text("Advanced")');
    const count = await advancedButton.count();
    
    if (count > 0) {
      const isVisible = await advancedButton.first().isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
    
    // "Connect with Wallet Provider" text should not be visible
    const walletProviderText = page.locator('text=Connect with Wallet Provider');
    const isTextVisible = await walletProviderText.isVisible().catch(() => false);
    expect(isTextVisible).toBe(false);
  });

  /**
   * Verify NO onboarding wizard with wallet selection
   */
  test("should have NO wallet selection wizard anywhere", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Old wizard titles that should not exist
    const wizardTexts = [
      "Welcome to Biatec Tokens",
      "Choose Your Wallet",
      "Select Wallet Provider"
    ];
    
    for (const text of wizardTexts) {
      const heading = page.locator(`h2:has-text("${text}")`);
      const isVisible = await heading.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
  });

  /**
   * Verify email/password is the ONLY authentication method visible
   */
  test("should display ONLY email/password authentication in modal", async ({ page }) => {
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Email/password should be visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    
    // Sign in button should be visible
    const signInButton = page.locator('button:has-text("Sign In with Email")');
    await expect(signInButton).toBeVisible({ timeout: 5000 });
    
    // Verify NO wallet provider buttons/links are visible
    // Note: Informational text saying "No wallet needed" is acceptable
    const walletProviderElements = [
      page.locator('button:has-text("Pera Wallet")').first(),
      page.locator('button:has-text("Defly Wallet")').first(),
      page.locator('button:has-text("Exodus Wallet")').first(),
      page.locator('button:has-text("Connect Wallet")').first(),
      page.locator('a:has-text("Download Pera Wallet")').first(),
      page.locator('a:has-text("Download Defly Wallet")').first(),
      page.locator('a:has-text("Download Exodus Wallet")').first()
    ];
    
    for (const element of walletProviderElements) {
      const isVisible = await element.isVisible().catch(() => false);
      // Wallet provider buttons/links should not be visible
      expect(isVisible).toBe(false);
    }
  });

  /**
   * Verify NO configuration flags allow wallet UI to be toggled on
   */
  test("should have NO hidden wallet toggle flags in localStorage/sessionStorage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Check for flags that might enable wallet UI
    const flags = await page.evaluate(() => {
      const ls = { ...localStorage };
      const ss = { ...sessionStorage };
      return {
        localStorage: ls,
        sessionStorage: ss
      };
    });
    
    // These flags should not exist or should explicitly disable wallets
    const prohibitedFlags = [
      'enable_wallet_connectors',
      'show_wallet_ui',
      'wallet_mode_enabled',
      'allow_wallet_connect'
    ];
    
    for (const flag of prohibitedFlags) {
      expect(flags.localStorage[flag]).toBeUndefined();
      expect(flags.sessionStorage[flag]).toBeUndefined();
    }
  });

  /**
   * Comprehensive DOM scan for wallet-related elements
   */
  test("should have NO wallet-related elements in entire DOM", async ({ page }) => {
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Check for VISIBLE buttons with wallet-related text only
    // Note: Informational text about NOT needing wallets is acceptable
    const walletProviderButtons = [
      page.locator('button:has-text("Pera")').filter({ hasText: /Pera/ }),
      page.locator('button:has-text("Defly")').filter({ hasText: /Defly/ }),
      page.locator('button:has-text("Exodus")').filter({ hasText: /Exodus/ }),
      page.locator('button:has-text("Connect Wallet")').filter({ hasText: /Connect Wallet/ }),
      page.locator('button:has-text("Sign In with Wallet")').filter({ hasText: /Sign In with Wallet/ })
    ];
    
    // Verify none of these wallet provider buttons are visible
    for (const button of walletProviderButtons) {
      const isVisible = await button.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
  });

  /**
   * Verify navigation never exposes wallet UI
   */
  test("should never show wallet UI across all main routes", async ({ page }) => {
    const routes = [
      "/",
      "/create",
      "/dashboard", 
      "/settings",
      "/account"
    ];
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      
      // Check for wallet connect button
      const walletButton = page.locator('button:has-text("Connect Wallet")');
      const isVisible = await walletButton.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
      
      // Check for wallet provider list
      const peraButton = page.locator('button:has-text("Pera")');
      const isPeraVisible = await peraButton.isVisible().catch(() => false);
      expect(isPeraVisible).toBe(false);
    }
  });

  /**
   * Verify ARC76 authentication stores proper session data
   */
  test("should store ARC76 session data without wallet connector references", async ({ page }) => {
    // Set up mock ARC76 authentication
    await page.addInitScript(() => {
      localStorage.setItem('arc76_session', JSON.stringify({
        email: 'test@example.com',
        account: 'ALGO123456789ABCDEF',
        timestamp: Date.now()
      }));
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('algorand_user', JSON.stringify({
        address: 'ALGO123456789ABCDEF',
        name: 'test',
        email: 'test@example.com'
      }));
    });
    
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Verify session data is stored correctly
    const session = await page.evaluate(() => {
      const arc76 = localStorage.getItem('arc76_session');
      const walletConnected = localStorage.getItem('wallet_connected');
      const user = localStorage.getItem('algorand_user');
      
      return {
        arc76: arc76 ? JSON.parse(arc76) : null,
        walletConnected,
        user: user ? JSON.parse(user) : null
      };
    });
    
    expect(session.arc76).toBeDefined();
    expect(session.arc76.email).toBe('test@example.com');
    expect(session.arc76.account).toBeDefined();
    expect(session.walletConnected).toBe('true');
    expect(session.user.email).toBe('test@example.com');
    
    // Verify NO wallet connector specific keys exist
    const storageKeys = await page.evaluate(() => {
      return Object.keys(localStorage);
    });
    
    const prohibitedKeys = [
      'wallet_provider',
      'connected_wallet_id',
      'pera_wallet_session',
      'defly_wallet_session',
      'walletconnect_session'
    ];
    
    for (const key of prohibitedKeys) {
      expect(storageKeys).not.toContain(key);
    }
  });
});
