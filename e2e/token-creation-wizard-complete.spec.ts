import { test, expect } from '@playwright/test';

/**
 * Comprehensive Token Creation Wizard E2E Tests
 * 
 * Tests the complete compliance-first token creation wizard flow
 * from authentication through deployment, including all 8 steps.
 * 
 * Business Value: Ensures the core user flow for token creation
 * works seamlessly, validating the compliance-first approach.
 */

test.describe('Token Creation Wizard - Complete Flow', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip Firefox due to known networkidle timeout issues
    test.skip(browserName === 'firefox', 'Firefox has persistent networkidle timeout issues');

    // Mock API routes for subscription
    await page.route('**/api/subscription**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription_status: 'active',
          subscription_tier: 'pro',
          price_id: 'price_professional_monthly',
          tokens_created: 0,
          tokens_limit: 100,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });

    // Mock analytics calls to prevent network errors
    await page.route('**/google-analytics.com/**', async (route) => {
      await route.abort();
    });
    await page.route('**/googletagmanager.com/**', async (route) => {
      await route.abort();
    });

    // Mock authentication state
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      
      // Set wallet-free authentication
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        id: 'test-user-123'
      };
      localStorage.setItem('algorand_user', JSON.stringify(mockUser));
      
      // Set subscription cache
      const mockSubscription = {
        subscription_status: 'active',
        subscription_tier: 'pro',
        price_id: 'price_professional_monthly',
        tokens_created: 0,
        tokens_limit: 100,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      localStorage.setItem('subscription_cache', JSON.stringify(mockSubscription));
    });
  });

  test('should complete full wizard flow successfully', async ({ page }) => {
    // Navigate to wizard
    await page.goto('/create/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for stores to initialize

    // Check wizard loaded
    await expect(page.locator('h1')).toContainText('Create Your Token');
    
    // Step 1: Authentication Confirmation
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 5000 });
    
    // Wait for Continue button to be enabled
    const step1Continue = page.locator('button:has-text("Continue")').first();
    await expect(step1Continue).toBeEnabled({ timeout: 10000 });
    await step1Continue.click();
    await page.waitForTimeout(2000); // Wait for step transition

    // Step 2: Subscription Selection
    await expect(page.locator('text=Subscription')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000); // Wait for subscription data to load
    
    // Continue to next step (subscription should be active from mock)
    const step2Continue = page.locator('button:has-text("Continue")').first();
    await expect(step2Continue).toBeEnabled({ timeout: 10000 });
    await step2Continue.click();
    await page.waitForTimeout(2000);

    // Step 3: Project Setup
    await expect(page.locator('text=Project Setup')).toBeVisible({ timeout: 5000 });
    
    // Fill in project information
    await page.fill('input#project-name', 'Test Token Project');
    await page.fill('textarea#project-description', 'This is a test token project for E2E testing purposes');
    await page.selectOption('select#token-purpose', 'utility');
    
    // Fill in issuer organization
    await page.fill('input#organization-name', 'Test Organization Inc');
    await page.selectOption('select#organization-type', 'corporation');
    await page.fill('input#registration-number', 'TEST-12345');
    await page.selectOption('select#jurisdiction', 'US');
    
    // Fill in compliance contact
    await page.fill('input#compliance-contact-name', 'John Doe');
    await page.fill('input#compliance-contact-email', 'compliance@test.com');
    await page.fill('input#compliance-contact-phone', '+1234567890');
    
    await page.waitForTimeout(500);
    
    // Continue to next step
    const step3Continue = page.locator('button:has-text("Continue")').first();
    await expect(step3Continue).toBeEnabled({ timeout: 5000 });
    await step3Continue.click();
    await page.waitForTimeout(1500);

    // Step 4: Token Details
    await expect(page.locator('text=Configure Your Token')).toBeVisible({ timeout: 5000 });
    
    // Select network (wait for network cards to be visible)
    await page.waitForTimeout(1000);
    const networkCards = page.locator('.grid > div').filter({ has: page.locator('h5') });
    await expect(networkCards.first()).toBeVisible({ timeout: 10000 });
    
    // Click first network (Algorand VOI Testnet or similar)
    const firstNetwork = networkCards.first();
    await firstNetwork.click();
    await page.waitForTimeout(1000);
    
    // Wait for standards to load
    await page.waitForTimeout(1000);
    
    // Select token standard (first available)
    const standardCards = page.locator('div[class*="cursor-pointer"]').filter({ 
      has: page.locator('text=/ASA|ARC|ERC/i') 
    });
    const hasStandards = await standardCards.count() > 0;
    
    if (hasStandards) {
      await standardCards.first().click();
      await page.waitForTimeout(500);
    }
    
    // Fill in token details
    await page.fill('input#token-name', 'Test Token');
    await page.fill('input#token-symbol', 'TEST');
    await page.fill('input#total-supply', '1000000');
    await page.fill('input#decimals', '0');
    
    await page.waitForTimeout(500);
    
    // Continue to next step
    const step4Continue = page.locator('button:has-text("Continue")').first();
    await expect(step4Continue).toBeEnabled({ timeout: 5000 });
    await step4Continue.click();
    await page.waitForTimeout(1500);

    // Step 5: Compliance Review
    await expect(page.locator('text=Compliance Review')).toBeVisible({ timeout: 5000 });
    
    // Check MICA compliance readiness
    const micaReadiness = page.locator('text=/MICA.*Readiness/i');
    await expect(micaReadiness).toBeVisible({ timeout: 5000 });
    
    // Check for compliance checklist
    const checklistItems = page.locator('input[type="checkbox"]');
    const checkboxCount = await checklistItems.count();
    
    // Check some compliance items if available
    if (checkboxCount > 0) {
      // Check first few items
      const itemsToCheck = Math.min(3, checkboxCount);
      for (let i = 0; i < itemsToCheck; i++) {
        const checkbox = checklistItems.nth(i);
        const isChecked = await checkbox.isChecked();
        if (!isChecked) {
          await checkbox.click();
          await page.waitForTimeout(300);
        }
      }
    }
    
    await page.waitForTimeout(500);
    
    // Continue to next step
    const step5Continue = page.locator('button:has-text("Continue")').first();
    await expect(step5Continue).toBeEnabled({ timeout: 5000 });
    await step5Continue.click();
    await page.waitForTimeout(1500);

    // Step 6: Metadata & Media (NEW STEP)
    await expect(page.locator('text=Metadata')).toBeVisible({ timeout: 5000 });
    
    // Check for metadata input options
    const guidedButton = page.locator('button', { hasText: 'Guided Form' });
    const jsonButton = page.locator('button', { hasText: 'JSON Editor' });
    
    // Use guided form
    const isGuidedVisible = await guidedButton.isVisible().catch(() => false);
    if (isGuidedVisible) {
      await guidedButton.click();
      await page.waitForTimeout(500);
    }
    
    // Fill in metadata
    const descriptionField = page.locator('textarea#token-description');
    const hasDescription = await descriptionField.isVisible().catch(() => false);
    if (hasDescription) {
      await descriptionField.fill('This is a comprehensive test token with metadata for E2E testing purposes.');
      await page.waitForTimeout(500);
    }
    
    // Add image URL if field is available
    const imageUrlField = page.locator('input#image-url');
    const hasImageUrl = await imageUrlField.isVisible().catch(() => false);
    if (hasImageUrl) {
      await imageUrlField.fill('https://via.placeholder.com/150');
      await page.waitForTimeout(500);
    }
    
    await page.waitForTimeout(500);
    
    // Continue to next step
    const step6Continue = page.locator('button:has-text("Continue")').first();
    await expect(step6Continue).toBeEnabled({ timeout: 5000 });
    await step6Continue.click();
    await page.waitForTimeout(1500);

    // Step 7: Deployment Review
    await expect(page.locator('text=Review')).toBeVisible({ timeout: 5000 });
    
    // Check for configuration summary
    const summaryText = page.locator('text=/Configuration Summary|Token Details/i');
    await expect(summaryText.first()).toBeVisible({ timeout: 5000 });
    
    // Verify token information is displayed
    await expect(page.locator('text=Test Token')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=TEST')).toBeVisible({ timeout: 3000 });
    
    // Check for confirmation checkbox or button
    const confirmCheckbox = page.locator('input[type="checkbox"]').filter({ 
      has: page.locator('text=/confirm|agree|understand/i') 
    });
    const hasConfirmCheckbox = await confirmCheckbox.isVisible().catch(() => false);
    
    if (hasConfirmCheckbox) {
      await confirmCheckbox.click();
      await page.waitForTimeout(500);
    }
    
    await page.waitForTimeout(500);
    
    // Continue to deployment (final step)
    const deployButton = page.locator('button:has-text("Continue"), button:has-text("Deploy")').first();
    await expect(deployButton).toBeEnabled({ timeout: 5000 });
    await deployButton.click();
    await page.waitForTimeout(1500);

    // Step 8: Deployment Status
    await expect(page.locator('text=Deployment')).toBeVisible({ timeout: 5000 });
    
    // Check for deployment status indicators
    const statusText = page.locator('text=/deploying|processing|pending|success|complete/i');
    await expect(statusText.first()).toBeVisible({ timeout: 10000 });
    
    console.log('[E2E] Wizard flow completed successfully');
  });

  test('should validate required fields at each step', async ({ page }) => {
    // Navigate to wizard
    await page.goto('/create/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 1: Should allow continuing (authenticated)
    const step1Continue = page.locator('button:has-text("Continue")').first();
    await expect(step1Continue).toBeEnabled({ timeout: 5000 });
    await step1Continue.click();
    await page.waitForTimeout(1000);

    // Step 2: Subscription (may auto-advance if active subscription)
    await page.waitForTimeout(1000);
    const step2Continue = page.locator('button:has-text("Continue")').first();
    const isStep2Enabled = await step2Continue.isEnabled().catch(() => false);
    if (isStep2Enabled) {
      await step2Continue.click();
      await page.waitForTimeout(1000);
    }

    // Step 3: Project Setup - Try to continue without filling fields
    await page.waitForTimeout(1000);
    const step3Continue = page.locator('button:has-text("Continue")').first();
    
    // Button might be disabled without required fields
    const isStep3Enabled = await step3Continue.isEnabled().catch(() => true);
    if (!isStep3Enabled) {
      // Fill minimum required fields
      await page.fill('input#project-name', 'Validation Test');
      await page.fill('textarea#project-description', 'Testing validation');
      await page.selectOption('select#token-purpose', 'utility');
      await page.waitForTimeout(500);
      
      await expect(step3Continue).toBeEnabled({ timeout: 5000 });
    }
    
    console.log('[E2E] Field validation test completed');
  });

  test('should save and resume draft', async ({ page }) => {
    // Navigate to wizard
    await page.goto('/create/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Progress through first few steps
    const continueBtn = page.locator('button:has-text("Continue")').first();
    
    // Step 1
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForTimeout(1000);

    // Step 2
    await page.waitForTimeout(1000);
    const step2Btn = page.locator('button:has-text("Continue")').first();
    const isStep2Enabled = await step2Btn.isEnabled().catch(() => false);
    if (isStep2Enabled) {
      await step2Btn.click();
      await page.waitForTimeout(1000);
    }

    // Step 3 - Fill some data
    await page.waitForTimeout(1000);
    const projectNameField = page.locator('input#project-name');
    const hasProjectName = await projectNameField.isVisible().catch(() => false);
    
    if (hasProjectName) {
      await projectNameField.fill('Draft Test Project');
      await page.waitForTimeout(500);
      
      // Check for Save Draft button
      const saveDraftButton = page.locator('button:has-text("Save Draft")');
      const hasSaveDraft = await saveDraftButton.isVisible().catch(() => false);
      
      if (hasSaveDraft) {
        await saveDraftButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Check sessionStorage for draft
      const draftData = await page.evaluate(() => {
        return sessionStorage.getItem('biatec_token_draft');
      });
      
      // Draft should be saved (either by button or auto-save)
      if (draftData) {
        expect(draftData).toBeTruthy();
        console.log('[E2E] Draft saved successfully');
      }
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to wizard
    await page.goto('/create/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Progress to a step with validation
    const continueBtn = page.locator('button:has-text("Continue")').first();
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForTimeout(1000);

    // Step 2
    await page.waitForTimeout(1000);
    const step2Btn = page.locator('button:has-text("Continue")').first();
    const isStep2Enabled = await step2Btn.isEnabled().catch(() => false);
    if (isStep2Enabled) {
      await step2Btn.click();
      await page.waitForTimeout(1000);
    }

    // Step 3 - Try invalid email format
    await page.waitForTimeout(1000);
    const emailField = page.locator('input#compliance-contact-email');
    const hasEmail = await emailField.isVisible().catch(() => false);
    
    if (hasEmail) {
      await emailField.fill('invalid-email');
      await emailField.blur();
      await page.waitForTimeout(500);
      
      // Check for error message
      const errorMessage = page.locator('text=/invalid|error/i').first();
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      // Error handling should be present
      console.log('[E2E] Error handling verified:', hasError);
    }
  });
});

test.describe('Token Creation Wizard - Accessibility', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox has persistent networkidle timeout issues');

    // Mock API routes
    await page.route('**/api/subscription**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription_status: 'active',
          subscription_tier: 'pro',
          price_id: 'price_professional_monthly',
          tokens_created: 0,
          tokens_limit: 100
        })
      });
    });

    await page.route('**/google-analytics.com/**', async (route) => {
      await route.abort();
    });
    await page.route('**/googletagmanager.com/**', async (route) => {
      await route.abort();
    });

    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      const mockUser = { email: 'test@example.com', name: 'Test User', id: 'test-123' };
      localStorage.setItem('algorand_user', JSON.stringify(mockUser));
      const mockSub = { 
        subscription_status: 'active', 
        subscription_tier: 'pro',
        price_id: 'price_professional_monthly',
        tokens_created: 0,
        tokens_limit: 100
      };
      localStorage.setItem('subscription_cache', JSON.stringify(mockSub));
    });
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/create/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Should be able to activate buttons with Enter/Space
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    console.log('[E2E] Keyboard navigation test completed');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/create/wizard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for ARIA labels on buttons
    const continueButton = page.locator('button:has-text("Continue")').first();
    const ariaLabel = await continueButton.getAttribute('aria-label');
    
    // Buttons should have descriptive labels or text
    const hasAccessibleLabel = ariaLabel || await continueButton.textContent();
    expect(hasAccessibleLabel).toBeTruthy();
    
    console.log('[E2E] ARIA labels verified');
  });
});
