import { test, expect } from "@playwright/test";

test.describe("Wallet Connection Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock wallet connection and onboarding completion to avoid onboarding redirects
    await page.addInitScript(() => {
      localStorage.setItem("wallet_connected", "true");
      localStorage.setItem("onboarding_completed", "true");
    });
    await page.goto("/");
    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
  });

  test("should display the homepage", async ({ page }) => {
    await expect(page).toHaveTitle(/Biatec Tokens/);
    await expect(page.getByRole("heading", { name: /Next-Generation Tokenization Platform/i })).toBeVisible({ timeout: 10000 });
  });

  test("should show network status indicator", async ({ page }) => {
    // Check for network status indicator in navbar - more flexible selector
    const networkStatus = page
      .locator(".rounded-lg")
      .filter({ hasText: /Testnet|Mainnet/ })
      .first();
    await expect(networkStatus).toBeVisible({ timeout: 10000 });
  });

  test("should have authentication button", async ({ page }) => {
    const authButton = page.getByRole("button", { name: /Authenticate/i });
    await expect(authButton).toBeVisible({ timeout: 10000 });
  });

  test("should open authentication modal on button click", async ({ page }) => {
    const authButton = page.getByRole("button", { name: /Authenticate/i });
    await expect(authButton).toBeVisible({ timeout: 10000 });
    await authButton.click();

    // Wait for modal to appear
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible({ timeout: 10000 });
  });

  test("should display wallet options in authentication modal", async ({ page }) => {
    const authButton = page.getByRole("button", { name: /Authenticate/i });
    await expect(authButton).toBeVisible({ timeout: 10000 });
    await authButton.click();

    // Check for wallet options
    await expect(page.getByText(/Or connect with/i)).toBeVisible({ timeout: 10000 });
    // Check for at least one wallet option
    const walletButtons = page.getByRole("button").filter({ hasText: /Pera|Defly|Exodus|Kibisis|Lute|Biatec/i });
    await expect(walletButtons.first()).toBeVisible({ timeout: 10000 });
  });

  test("should be able to close authentication modal", async ({ page }) => {
    const authButton = page.getByRole("button", { name: /Authenticate/i });
    await expect(authButton).toBeVisible({ timeout: 10000 });
    await authButton.click();

    // Wait for modal
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible({ timeout: 10000 });

    // Click "Go back" button
    const goBackButton = page.getByRole("button", { name: /Go back/i });
    await expect(goBackButton).toBeVisible({ timeout: 5000 });
    await goBackButton.click();

    // Modal should be closed
    await expect(page.getByRole("heading", { name: /Sign in/i })).not.toBeVisible({ timeout: 5000 });
  });

  test("should navigate to token creation page", async ({ page }) => {
    const createButton = page.getByRole("link", { name: /Create Token/i }).first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    await expect(page).toHaveURL(/\/create/, { timeout: 10000 });
  });

  test("should navigate to dashboard", async ({ page }) => {
    const dashboardButton = page.getByRole("link", { name: /Dashboard/i }).first();
    await expect(dashboardButton).toBeVisible({ timeout: 10000 });
    await dashboardButton.click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should display token standards section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Supported Token Standards/i })).toBeVisible({ timeout: 10000 });

    // Check for some token standards
    await expect(page.getByText(/ASA/).first()).toBeVisible({ timeout: 5000 });
  });

  test("should have proper meta tags", async ({ page }) => {
    const title = await page.title();
    expect(title).toContain("Biatec");
  });
});
