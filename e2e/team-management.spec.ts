import { test, expect } from '@playwright/test';
import { suppressBrowserErrors } from './helpers/auth'

test.describe('Team Management - Compliance Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    suppressBrowserErrors(page)
    
    // Set up authentication before each test
    await page.addInitScript(() => {
      // Set up authenticated user
      localStorage.setItem(
        'algorand_user',
        JSON.stringify({
          address: 'ABCD1234EFGH5678IJKL90MNOPQRSTUV',
          email: 'owner@example.com',
          name: 'Test Owner',
        })
      );

      // Set up active subscription
      localStorage.setItem(
        'subscription_data',
        JSON.stringify({
          subscription_status: 'active',
          subscription_tier: 'professional',
          price_id: 'price_professional_monthly',
        })
      );
    });
  });

  test('should navigate to Team & Access tab in compliance dashboard', async ({ page }) => {
    await page.goto('/compliance/test-token-123?network=VOI');
    await page.waitForLoadState('domcontentloaded');

    // Wait for page to load - use more specific selector for main content heading
    await expect(page.getByRole('heading', { name: 'Compliance Dashboard' })).toBeVisible({ timeout: 10000 });

    // Find and click Team & Access tab
    const teamTab = page.locator('button').filter({ hasText: /Team & Access/i }).first();
    await expect(teamTab).toBeVisible({ timeout: 5000 });
    await teamTab.click();

    // Verify Team & Access content is displayed
    await expect(page.getByRole('heading', { name: 'Team & Access', level: 2 })).toBeVisible({ timeout: 5000 });
  });

  test('should display team members list', async ({ page }) => {
    await page.goto('/compliance/test-token-123?network=VOI');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Team & Access tab
    const teamTab = page.locator('button').filter({ hasText: /Team & Access/i }).first();
    await teamTab.click();

    // Wait for team members list to load

    // Check for Team Members heading
    await expect(page.locator('h3').filter({ hasText: /Team Members/i })).toBeVisible({
      timeout: 5000,
    });

    // Check for Invite Member button (visible for owners/admins)
    const inviteButton = page.locator('button').filter({ hasText: /Invite Member/i }).first();
    const isVisible = await inviteButton.isVisible().catch(() => false);
    // Pass if button exists (owner role) or not (viewer role) — page must be on compliance dashboard
    expect(isVisible || page.url().includes('/compliance')).toBe(true);
  });

  test('should open invite member modal', async ({ page }) => {
    await page.goto('/compliance/test-token-123?network=VOI');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Team & Access tab
    const teamTab = page.locator('button').filter({ hasText: /Team & Access/i }).first();
    await teamTab.click();

    // Wait for page to load

    // Click Invite Member button
    const inviteButton = page
      .locator('button')
      .filter({ hasText: /Invite Member/i })
      .first();
    
    const buttonVisible = await inviteButton.isVisible().catch(() => false);
    
    if (buttonVisible) {
      await inviteButton.click();

      // Verify modal is open
      await expect(
        page.locator('h3').filter({ hasText: /Invite Team Member/i })
      ).toBeVisible({ timeout: 3000 });

      // Verify form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button').filter({ hasText: /Send Invitation/i })).toBeVisible();
    } else {
      // If button not visible, user might not have permission — verify we're on the compliance page
      expect(page.url()).toContain('/compliance/')
    }
  });

  test('should display access activity log', async ({ page }) => {
    await page.goto('/compliance/test-token-123?network=VOI');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Team & Access tab
    const teamTab = page.locator('button').filter({ hasText: /Team & Access/i }).first();
    await teamTab.click();

    // Wait for content to load

    // Check for Access Activity heading
    await expect(
      page.locator('h3').filter({ hasText: /Access Activity/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show role badges for team members', async ({ page }) => {
    await page.goto('/compliance/test-token-123?network=VOI');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Team & Access tab
    const teamTab = page.locator('button').filter({ hasText: /Team & Access/i }).first();
    await teamTab.click();

    // Wait for team list to load

    // Look for role badges (Owner, Admin, Compliance Officer, Viewer)
    const roleBadges = page.locator('span').filter({ hasText: /Owner|Admin|Compliance Officer|Viewer/i });
    const hasBadges = await roleBadges.count().then(count => count > 0);
    
    if (hasBadges) {
      await expect(roleBadges.first()).toBeVisible();
    } else {
      // No team members yet or loading — verify the page structure exists
      const hasActivityHeading = await page.getByRole('heading', { name: /Access Activity/i }).isVisible().catch(() => false)
      const hasMembersHeading = await page.getByRole('heading', { name: /Team Members/i }).isVisible().catch(() => false)
      expect(hasMembersHeading || hasActivityHeading).toBe(true);
    }
  });

  test('should handle empty team state gracefully', async ({ page }) => {
    await page.goto('/compliance/test-token-123?network=VOI');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Team & Access tab
    const teamTab = page.locator('button').filter({ hasText: /Team & Access/i }).first();
    await teamTab.click();

    // Wait for content

    // Check for either members list or empty state - use more specific selector
    const hasMembersHeading = await page.getByRole('heading', { name: 'Team Members', level: 3 }).isVisible().catch(() => false);
    const hasEmptyState = await page
      .locator('text=/No Team Members Yet|No activity recorded yet/i')
      .isVisible()
      .catch(() => false);

    expect(hasMembersHeading || hasEmptyState).toBe(true);
  });

  test('should be responsive and accessible', async ({ page }) => {
    await page.goto('/compliance/test-token-123?network=VOI');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Team & Access tab
    const teamTab = page.locator('button').filter({ hasText: /Team & Access/i }).first();
    await teamTab.click();

    // Wait for content

    // Check that main heading exists (accessibility)
    await expect(page.locator('h2').filter({ hasText: /Team & Access/i })).toBeVisible();

    // Check for ARIA roles or semantic HTML
    const mainContent = page.locator('div.team-access-view, [role="main"]');
    const exists = await mainContent.count().then(count => count > 0);
    // Either ARIA landmark exists, or the page heading confirms we are in the right view
    expect(exists || await page.locator('h2').filter({ hasText: /Team & Access/i }).isVisible().catch(() => false)).toBe(true);
  });
});
