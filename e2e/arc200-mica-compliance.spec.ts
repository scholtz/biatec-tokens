import { test, expect } from "@playwright/test";

test.describe("ARC-200 Token Creation with MICA Compliance", () => {
  test.beforeEach(async ({ page }) => {
    // Mock wallet connection to avoid redirects
    await page.addInitScript(() => {
      localStorage.setItem("wallet_connected", "true");
      localStorage.setItem("onboarding_completed", "true");
    });
    // Navigate to token creator page
    await page.goto("/create");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display MICA compliance form for ARC-200 tokens", async ({ page }) => {
    // Check page loaded
    await expect(page).toHaveTitle(/Biatec Tokens|Create/i);

    // Select VOI network (optional)
    const voiButton = page
      .locator("button")
      .filter({ hasText: /VOI Network/i })
      .first();
    if (await voiButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voiButton.click();
      await page.waitForTimeout(500);
    }

    // Select ARC-200 standard
    const arc200Button = page
      .locator("text=Or Select Token Standard Manually")
      .locator("..")
      .locator("button")
      .filter({ hasText: /ARC200/i })
      .first();
    await expect(arc200Button).toBeVisible({ timeout: 10000 });
    await arc200Button.click();
    await page.waitForTimeout(2000);

    // Check that MICA compliance form appears
    await expect(page.getByRole('heading', { name: /^MICA Compliance Metadata/ })).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=(Required for ARC-200)")).toBeVisible({ timeout: 5000 });
  });

  test("should validate required MICA compliance fields", async ({ page }) => {
    // Select VOI network (optional)
    const voiButton = page
      .locator("button")
      .filter({ hasText: /VOI Network/i })
      .first();
    if (await voiButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voiButton.click();
      await page.waitForTimeout(500);
    }

    // Select ARC-200 standard
    const arc200Button = page
      .locator("text=Or Select Token Standard Manually")
      .locator("..")
      .locator("button")
      .filter({ hasText: /ARC200/i })
      .first();
    await arc200Button.click();
    await page.waitForTimeout(2000);

    // Check for validation errors when fields are empty
    await expect(page.locator("text=Issuer legal name is required")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Registration number is required")).toBeVisible({ timeout: 3000 });
  });

  test("should complete ARC-200 token creation with MICA compliance metadata", async ({ page }) => {
    // Select VOI network (optional)
    const voiButton = page
      .locator("button")
      .filter({ hasText: /VOI Network/i })
      .first();
    if (await voiButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voiButton.click();
      await page.waitForTimeout(500);
    }

    // Select ARC-200 standard
    const arc200Button = page
      .locator("text=Or Select Token Standard Manually")
      .locator("..")
      .locator("button")
      .filter({ hasText: /ARC200/i })
      .first();
    await arc200Button.click();
    await page.waitForTimeout(2000);

    // Fill in token basic information
    await page.fill('input[placeholder*="My Awesome Token"]', "Test MICA Token");
    await page.fill('input[placeholder*="MAT"]', "TMT");
    await page.fill('textarea[placeholder*="Describe your token"]', "A test token with MICA compliance metadata.");

    // Fill in MICA compliance fields
    const issuerNameInput = page.locator("label").filter({ hasText: "Issuer Legal Name" }).locator("..").locator("input").first();
    await issuerNameInput.fill("Test Company Ltd.");

    const registrationInput = page.locator("label").filter({ hasText: "Registration Number" }).locator("..").locator("input").first();
    await registrationInput.fill("12345678");

    const jurisdictionSelect = page.locator('label:has-text("Jurisdiction")').locator("..").locator("select").first();
    await jurisdictionSelect.selectOption("EU");

    const classificationSelect = page.locator('label:has-text("Token Classification")').locator("..").locator("select").first();
    await classificationSelect.selectOption("utility");

    const purposeTextarea = page.locator('label:has-text("Token Purpose")').locator("..").locator("textarea").first();
    await purposeTextarea.fill("This is a comprehensive test token purpose that provides detailed information about the utility token functionality and rights conferred to token holders.");

    const emailInput = page.locator('label:has-text("Compliance Contact Email")').locator("..").locator('input[type="email"]').first();
    await emailInput.fill("compliance@testcompany.com");

    // Check for success message
    await expect(page.locator("text=All required MICA compliance fields are complete")).toBeVisible({ timeout: 10000 });
  });
});
