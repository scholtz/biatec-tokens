import { test, expect } from "@playwright/test";

/**
 * E2E tests for Wallet-Free Authentication Flow
 * 
 * Tests validate the new showAuth parameter, hidden network selector,
 * and email/password-only authentication path (AC #1-5 from PR feedback)
 * 
 * Related Issue: Frontend MVP readiness - wallet-free auth and token creation UX
 * Business Value: Non-crypto businesses need email/password auth without wallet knowledge
 * Risk: Wallet prompts create compliance concerns and user confusion for regulated customers
 */
test.describe("Wallet-Free Authentication Flow", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip Firefox due to consistent networkidle timeout issues
    test.skip(browserName === "firefox", "Firefox has persistent networkidle timeout issues");
    
    // Clear all storage before each test for isolation
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  /**
   * AC #1: Protected routes redirect to home with showAuth parameter (not showOnboarding)
   */
  test("should redirect unauthenticated user to home with showAuth query parameter", async ({ page }) => {
    await page.goto("/create");
    await page.waitForLoadState("domcontentloaded");
    
    // Should redirect to home with showAuth parameter
    await page.waitForURL("/?showAuth=true", { timeout: 10000 });
    
    // Verify we're on the home page
    await expect(page).toHaveTitle(/Biatec Tokens/);
  });

  /**
   * AC #2: Sign-in modal shows email/password form without network selector
   */
  test("should display email/password sign-in modal without network selector", async ({ page }) => {
    // Navigate directly to home with showAuth parameter
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Check for Sign In header
    const signInHeader = page.locator('h2:has-text("Sign In")');
    await expect(signInHeader).toBeVisible({ timeout: 10000 });
    
    // Verify email input is visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    
    // Verify password input is visible
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    
    // Network selector should NOT be visible in the modal (hidden by prop)
    // The modal should focus on email/password authentication only
    const networkSelectorLabel = page.locator('label:has-text("Select Network")');
    const isNetworkSelectorVisible = await networkSelectorLabel.isVisible().catch(() => false);
    expect(isNetworkSelectorVisible).toBe(false);
  });

  /**
   * AC #3: Token Creator redirects to auth modal when unauthenticated
   */
  test("should show auth modal when accessing token creator without authentication", async ({ page }) => {
    await page.goto("/create");
    await page.waitForLoadState("domcontentloaded");
    
    // Should redirect to home with showAuth
    await page.waitForURL("/?showAuth=true", { timeout: 10000 });
    
    // Modal should be visible
    const signInHeader = page.locator('h2:has-text("Sign In")');
    await expect(signInHeader).toBeVisible({ timeout: 10000 });
    
    // Verify the redirect path is stored for post-auth navigation
    const redirectPath = await page.evaluate(() => {
      return localStorage.getItem("redirect_after_auth");
    });
    expect(redirectPath).toBe("/create");
  });

  /**
   * AC #4: NetworkSwitcher is hidden from navbar (no "Not connected" status)
   */
  test("should not display network status or NetworkSwitcher in navbar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // NetworkSwitcher component should be commented out/hidden per MVP requirements
    // The button may technically exist in the DOM but should not be visible to users
    const networkSwitcherButton = page.locator('button:has-text("VOI")');
    const isVisible = await networkSwitcherButton.isVisible().catch(() => false);
    
    // Network switcher should not be prominently visible
    // (It might exist in DOM but be hidden via CSS or conditional rendering)
    expect(isVisible).toBe(false);
  });

  /**
   * AC #5: Onboarding wizard is hidden (replaced with sign-in modal)
   */
  test("should not show onboarding wizard, only sign-in modal", async ({ page }) => {
    // Try to access with old showOnboarding parameter (backward compatibility)
    await page.goto("/?showOnboarding=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Old wizard should NOT be visible
    const wizardTitle = page.locator('h2:has-text("Welcome to Biatec Tokens")');
    const isWizardVisible = await wizardTitle.isVisible().catch(() => false);
    expect(isWizardVisible).toBe(false);
    
    // Sign-in modal should be visible instead
    const signInHeader = page.locator('h2:has-text("Sign In")');
    await expect(signInHeader).toBeVisible({ timeout: 10000 });
  });

  /**
   * AC #6: Wallet provider links are hidden by default (only visible in advanced options)
   */
  test("should hide wallet provider links unless advanced options expanded", async ({ page }) => {
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Sign-in modal should be visible
    const signInHeader = page.locator('h2:has-text("Sign In")');
    await expect(signInHeader).toBeVisible({ timeout: 10000 });
    
    // Wallet download links should NOT be immediately visible
    const peraWalletLink = page.locator('a[href*="perawallet.app"]');
    const isPeraVisible = await peraWalletLink.isVisible().catch(() => false);
    expect(isPeraVisible).toBe(false);
    
    // Email/password form should be prominently visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  /**
   * AC #7: Settings route redirects to auth modal when not authenticated
   */
  test("should redirect settings route to auth modal when unauthenticated", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");
    
    // Should redirect to home with showAuth
    await page.waitForURL("/?showAuth=true", { timeout: 10000 });
    
    // Auth modal should be visible
    const signInHeader = page.locator('h2:has-text("Sign In")');
    await expect(signInHeader).toBeVisible({ timeout: 10000 });
    
    // Redirect path should be stored
    const redirectPath = await page.evaluate(() => {
      return localStorage.getItem("redirect_after_auth");
    });
    expect(redirectPath).toBe("/settings");
  });

  /**
   * AC #8: showAuth parameter triggers modal on home page
   */
  test("should open sign-in modal when showAuth=true in URL", async ({ page }) => {
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Modal should be visible
    const signInHeader = page.locator('h2:has-text("Sign In")');
    await expect(signInHeader).toBeVisible({ timeout: 10000 });
    
    // Email form should be visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  /**
   * AC #9: Email/password form validation works correctly
   */
  test("should validate email/password form inputs", async ({ page }) => {
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Find the sign-in button
    const signInButton = page.locator('button:has-text("Sign In with Email")');
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    
    // Button should be disabled initially (no inputs)
    const isDisabled = await signInButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    // Fill email only
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");
    
    // Button should still be disabled (no password)
    const stillDisabled = await signInButton.isDisabled();
    expect(stillDisabled).toBe(true);
    
    // Fill password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill("password123");
    
    // Button should now be enabled
    const nowEnabled = await signInButton.isDisabled();
    expect(nowEnabled).toBe(false);
  });

  /**
   * AC #10: Modal can be closed without completing auth
   */
  test("should allow closing sign-in modal without authentication", async ({ page }) => {
    await page.goto("/?showAuth=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    // Modal should be visible
    const signInHeader = page.locator('h2:has-text("Sign In")');
    await expect(signInHeader).toBeVisible({ timeout: 10000 });
    
    // Find close button in modal - it's inside a button element
    const closeButton = page.locator('button:has(.pi-times)').first();
    await closeButton.click();
    
    // Wait for modal close animation and verify it's hidden
    await page.waitForTimeout(1000);
    
    // Modal should no longer be visible - use waitFor with hidden state
    await signInHeader.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // If waitFor fails, check manually
    });
    
    const isModalVisible = await signInHeader.isVisible().catch(() => false);
    expect(isModalVisible).toBe(false);
  });
});
