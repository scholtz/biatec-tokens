import { test, expect } from '@playwright/test';

test.describe('ARC-200 Token Creation with MICA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to token creator page
    await page.goto('/creator');
    await page.waitForLoadState('networkidle');
  });

  test('should display MICA compliance form for ARC-200 tokens', async ({ page }) => {
    // Check page loaded
    await expect(page).toHaveTitle(/Biatec Tokens|Create/i);

    // Select VOI network
    const voiButton = page.locator('button').filter({ hasText: /VOI Network/i }).first();
    if (await voiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voiButton.click();
    }

    // Select ARC-200 standard
    const arc200Button = page.locator('button').filter({ hasText: /ARC-200/i }).first();
    await expect(arc200Button).toBeVisible({ timeout: 10000 });
    await arc200Button.click();

    // Check that MICA compliance form appears and shows "Required for ARC-200"
    await expect(page.locator('text=MICA Compliance Metadata')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Required for ARC-200')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required MICA compliance fields', async ({ page }) => {
    // Select VOI network
    const voiButton = page.locator('button').filter({ hasText: /VOI Network/i }).first();
    if (await voiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voiButton.click();
    }

    // Select ARC-200 standard
    const arc200Button = page.locator('button').filter({ hasText: /ARC-200/i }).first();
    await arc200Button.click();
    await page.waitForTimeout(1000);

    // Check for validation errors when fields are empty
    await expect(page.locator('text=Issuer legal name is required')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Registration number is required')).toBeVisible();
    await expect(page.locator('text=Jurisdiction is required')).toBeVisible();
    await expect(page.locator('text=Token purpose is required')).toBeVisible();
    await expect(page.locator('text=Compliance contact email is required')).toBeVisible();
  });

  test('should complete ARC-200 token creation with MICA compliance metadata', async ({ page }) => {
    // Select VOI network
    const voiButton = page.locator('button').filter({ hasText: /VOI Network/i }).first();
    if (await voiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voiButton.click();
    }

    // Select ARC-200 standard
    const arc200Button = page.locator('button').filter({ hasText: /ARC-200/i }).first();
    await arc200Button.click();
    await page.waitForTimeout(1000);

    // Fill in token basic information
    await page.fill('input[placeholder*="My Awesome Token"]', 'Test MICA Token');
    await page.fill('input[placeholder*="MAT"]', 'TMT');
    await page.fill('textarea[placeholder*="Describe your token"]', 'A test token with MICA compliance metadata for E2E testing purposes.');

    // Fill in MICA compliance fields
    // Issuer Legal Name
    const issuerNameInput = page.locator('input').filter({ 
      has: page.locator('xpath=preceding-sibling::label[contains(text(), "Issuer Legal Name")]') 
    }).first();
    await issuerNameInput.fill('Test Company Ltd.');

    // Registration Number
    const registrationInput = page.locator('label:has-text("Registration Number")').locator('..').locator('input').first();
    await registrationInput.fill('12345678');

    // Jurisdiction
    const jurisdictionSelect = page.locator('label:has-text("Jurisdiction")').locator('..').locator('select').first();
    await jurisdictionSelect.selectOption('EU');

    // Token Classification
    const classificationSelect = page.locator('label:has-text("Token Classification")').locator('..').locator('select').first();
    await classificationSelect.selectOption('utility');

    // Token Purpose
    const purposeTextarea = page.locator('label:has-text("Token Purpose")').locator('..').locator('textarea').first();
    await purposeTextarea.fill('This is a comprehensive test token purpose that provides detailed information about the utility token functionality and the rights conferred to token holders. This token will be used for platform access and rewards within our ecosystem.');

    // Compliance Contact Email
    const emailInput = page.locator('label:has-text("Compliance Contact Email")').locator('..').locator('input[type="email"]').first();
    await emailInput.fill('compliance@testcompany.com');

    // Check for success message
    await expect(page.locator('text=All required MICA compliance fields are complete')).toBeVisible({ timeout: 10000 });

    // Note: We don't submit the form in E2E tests as it would require wallet connection
    // The test validates that the form can be filled correctly with proper validation
  });

  test('should show classification guidance for different token types', async ({ page }) => {
    // Select VOI network
    const voiButton = page.locator('button').filter({ hasText: /VOI Network/i }).first();
    if (await voiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voiButton.click();
    }

    // Select ARC-200 standard
    const arc200Button = page.locator('button').filter({ hasText: /ARC-200/i }).first();
    await arc200Button.click();
    await page.waitForTimeout(1000);

    // Select Utility Token and check guidance
    const classificationSelect = page.locator('label:has-text("Token Classification")').locator('..').locator('select').first();
    await classificationSelect.selectOption('utility');
    await expect(page.locator('text=Provides access to goods or services')).toBeVisible({ timeout: 5000 });

    // Select E-Money Token and check guidance
    await classificationSelect.selectOption('e-money');
    await expect(page.locator('text=e-money authorization')).toBeVisible({ timeout: 5000 });

    // Select Asset-Referenced Token and check guidance
    await classificationSelect.selectOption('asset-referenced');
    await expect(page.locator('text=prospectus approval')).toBeVisible({ timeout: 5000 });
  });

  test('should validate email format in compliance contact field', async ({ page }) => {
    // Select VOI network
    const voiButton = page.locator('button').filter({ hasText: /VOI Network/i }).first();
    if (await voiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voiButton.click();
    }

    // Select ARC-200 standard
    const arc200Button = page.locator('button').filter({ hasText: /ARC-200/i }).first();
    await arc200Button.click();
    await page.waitForTimeout(1000);

    // Fill minimum required fields first
    const issuerNameInput = page.locator('label:has-text("Issuer Legal Name")').locator('..').locator('input').first();
    await issuerNameInput.fill('Test Company Ltd.');

    const registrationInput = page.locator('label:has-text("Registration Number")').locator('..').locator('input').first();
    await registrationInput.fill('12345678');

    const jurisdictionSelect = page.locator('label:has-text("Jurisdiction")').locator('..').locator('select').first();
    await jurisdictionSelect.selectOption('EU');

    const purposeTextarea = page.locator('label:has-text("Token Purpose")').locator('..').locator('textarea').first();
    await purposeTextarea.fill('This is a comprehensive test token purpose that provides detailed information about the utility and rights.');

    // Enter invalid email
    const emailInput = page.locator('label:has-text("Compliance Contact Email")').locator('..').locator('input[type="email"]').first();
    await emailInput.fill('invalid-email');
    
    // Check for validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible({ timeout: 5000 });

    // Enter valid email
    await emailInput.fill('valid@email.com');
    
    // Error should disappear
    await expect(page.locator('text=Invalid email format')).not.toBeVisible({ timeout: 5000 });
  });

  test('should validate token purpose minimum length', async ({ page }) => {
    // Select VOI network
    const voiButton = page.locator('button').filter({ hasText: /VOI Network/i }).first();
    if (await voiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voiButton.click();
    }

    // Select ARC-200 standard
    const arc200Button = page.locator('button').filter({ hasText: /ARC-200/i }).first();
    await arc200Button.click();
    await page.waitForTimeout(1000);

    // Fill minimum required fields
    const issuerNameInput = page.locator('label:has-text("Issuer Legal Name")').locator('..').locator('input').first();
    await issuerNameInput.fill('Test Company Ltd.');

    const registrationInput = page.locator('label:has-text("Registration Number")').locator('..').locator('input').first();
    await registrationInput.fill('12345678');

    const jurisdictionSelect = page.locator('label:has-text("Jurisdiction")').locator('..').locator('select').first();
    await jurisdictionSelect.selectOption('EU');

    const emailInput = page.locator('label:has-text("Compliance Contact Email")').locator('..').locator('input[type="email"]').first();
    await emailInput.fill('compliance@test.com');

    // Enter short purpose (less than 50 characters)
    const purposeTextarea = page.locator('label:has-text("Token Purpose")').locator('..').locator('textarea').first();
    await purposeTextarea.fill('Too short');
    
    // Check for validation error
    await expect(page.locator('text=Token purpose must be at least 50 characters')).toBeVisible({ timeout: 5000 });

    // Enter valid length purpose
    await purposeTextarea.fill('This is a comprehensive test token purpose that provides detailed information about the token and its use cases.');
    
    // Error should disappear and success message should appear
    await expect(page.locator('text=Token purpose must be at least 50 characters')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=All required MICA compliance fields are complete')).toBeVisible({ timeout: 5000 });
  });

  test('should handle optional MICA compliance fields', async ({ page }) => {
    // Select VOI network
    const voiButton = page.locator('button').filter({ hasText: /VOI Network/i }).first();
    if (await voiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voiButton.click();
    }

    // Select ARC-200 standard
    const arc200Button = page.locator('button').filter({ hasText: /ARC-200/i }).first();
    await arc200Button.click();
    await page.waitForTimeout(1000);

    // Fill required fields first
    const issuerNameInput = page.locator('label:has-text("Issuer Legal Name")').locator('..').locator('input').first();
    await issuerNameInput.fill('Test Company Ltd.');

    const registrationInput = page.locator('label:has-text("Registration Number")').locator('..').locator('input').first();
    await registrationInput.fill('12345678');

    const jurisdictionSelect = page.locator('label:has-text("Jurisdiction")').locator('..').locator('select').first();
    await jurisdictionSelect.selectOption('EU');

    const classificationSelect = page.locator('label:has-text("Token Classification")').locator('..').locator('select').first();
    await classificationSelect.selectOption('utility');

    const purposeTextarea = page.locator('label:has-text("Token Purpose")').locator('..').locator('textarea').first();
    await purposeTextarea.fill('This is a comprehensive test token purpose that provides detailed information about the utility token.');

    const emailInput = page.locator('label:has-text("Compliance Contact Email")').locator('..').locator('input[type="email"]').first();
    await emailInput.fill('compliance@test.com');

    // Fill optional fields
    const licenseInput = page.locator('label:has-text("Regulatory License")').locator('..').locator('input').first();
    await licenseInput.fill('FCA-123456');

    const jurisdictionsInput = page.locator('input[placeholder*="ISO codes"]').first();
    await jurisdictionsInput.fill('US, CN, KP');

    const whitepaperInput = page.locator('label:has-text("Whitepaper URL")').locator('..').locator('input[type="url"]').first();
    await whitepaperInput.fill('https://testcompany.com/whitepaper.pdf');

    const termsInput = page.locator('label:has-text("Terms & Conditions URL")').locator('..').locator('input[type="url"]').first();
    await termsInput.fill('https://testcompany.com/terms');

    // Check KYC checkbox
    const kycCheckbox = page.locator('input[type="checkbox"]').first();
    await kycCheckbox.check();

    // Verify form is still valid
    await expect(page.locator('text=All required MICA compliance fields are complete')).toBeVisible({ timeout: 5000 });
  });

  test('should not allow non-ARC-200 tokens without MICA compliance', async ({ page }) => {
    // Select VOI network
    const voiButton = page.locator('button').filter({ hasText: /VOI Network/i }).first();
    if (await voiButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await voiButton.click();
    }

    // Select ASA standard (not ARC-200)
    const asaButton = page.locator('button').filter({ hasText: /^ASA$/i }).first();
    if (await asaButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await asaButton.click();
      await page.waitForTimeout(1000);

      // MICA compliance should not be required (no "Required for ARC-200" text)
      const requiredText = page.locator('text=Required for ARC-200');
      expect(await requiredText.isVisible().catch(() => false)).toBe(false);
    }
  });
});
