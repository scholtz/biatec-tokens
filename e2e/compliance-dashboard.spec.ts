import { test, expect } from '@playwright/test';

test.describe('Compliance Dashboard 1.0', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication in localStorage before navigation
    await page.addInitScript(() => {
      const mockUser = {
        address: 'TEST_USER_ADDRESS_123',
        email: 'test@example.com',
        isAuthenticated: true,
      };
      localStorage.setItem('algorand_user', JSON.stringify(mockUser));
    });

    // Navigate to compliance dashboard
    await page.goto('/compliance/test-token-123?network=VOI');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display compliance dashboard page title', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle(/Biatec/i);
    
    // Check main heading
    const heading = page.getByRole('heading', { name: 'Compliance Dashboard', level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display overview tab as default', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check that Overview tab is visible and active
    const overviewTab = page.getByRole('button', { name: /overview/i });
    await expect(overviewTab).toBeVisible({ timeout: 10000 });
    
    // Overview tab should have active styling (biatec-accent color)
    await expect(overviewTab).toHaveClass(/border-biatec-accent/);
  });

  test('should display MICA Readiness Panel on overview tab', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for MICA Readiness Panel to load
    const micaHeading = page.getByRole('heading', { name: 'MICA Readiness', level: 2 });
    await expect(micaHeading).toBeVisible({ timeout: 10000 });
    
    // Check for key content
    await expect(page.getByText(/EU Markets in Crypto-Assets/i)).toBeVisible();
    await expect(page.getByText(/Overall Readiness Score/i)).toBeVisible();
    
    // Check for refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh MICA readiness data/i });
    await expect(refreshButton).toBeVisible();
  });

  test('should display Audit Trail Summary Panel on overview tab', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for Audit Trail Panel
    const auditHeading = page.getByRole('heading', { name: 'Audit Trail', level: 2 });
    await expect(auditHeading).toBeVisible({ timeout: 10000 });
    
    // Check for export buttons
    const csvButton = page.getByRole('button', { name: /Export.*CSV/i });
    await expect(csvButton).toBeVisible();
    
    const jsonButton = page.getByRole('button', { name: /Export.*JSON/i });
    await expect(jsonButton).toBeVisible();
    
    const viewButton = page.getByRole('button', { name: /View Full Log/i });
    await expect(viewButton).toBeVisible();
  });

  test('should display Whitelist Status Panel on overview tab', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for Whitelist Status Panel
    const whitelistHeading = page.getByRole('heading', { name: 'Whitelist Status', level: 2 });
    await expect(whitelistHeading).toBeVisible({ timeout: 10000 });
    
    // Check for manage button
    const manageButton = page.getByRole('button', { name: /Manage whitelist/i });
    await expect(manageButton).toBeVisible();
    
    // Check for metrics
    await expect(page.getByText(/Total Addresses/i)).toBeVisible();
    await expect(page.getByText(/Coverage/i)).toBeVisible();
  });

  test('should display Compliance Reports Panel on overview tab', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for Reports Panel
    const reportsHeading = page.getByRole('heading', { name: 'Compliance Reports', level: 2 });
    await expect(reportsHeading).toBeVisible({ timeout: 10000 });
    
    // Check for generate button
    const generateButton = page.getByRole('button', { name: /Generate.*report/i });
    await expect(generateButton).toBeVisible();
  });

  test('should display Compliance Alerts Panel on overview tab', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for Alerts Panel
    const alertsHeading = page.getByRole('heading', { name: /Compliance Alerts/i, level: 2 });
    await expect(alertsHeading).toBeVisible({ timeout: 10000 });
    
    // Check for "Coming Soon" badge
    await expect(page.getByText(/Coming Soon/i)).toBeVisible();
    
    // Check for notify button
    const notifyButton = page.getByRole('button', { name: /Notify Me When Available/i });
    await expect(notifyButton).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click on Audit Log tab
    const auditLogTab = page.getByRole('button', { name: /Audit Log/i });
    await auditLogTab.click();
    await expect(auditLogTab).toHaveClass(/border-biatec-accent/);
    
    // Click on Whitelist Management tab
    const whitelistTab = page.getByRole('button', { name: /Whitelist Management/i }).first();
    await whitelistTab.click();
    await expect(whitelistTab).toHaveClass(/border-biatec-accent/);
    
    // Navigate back to Overview
    const overviewTab = page.getByRole('button', { name: /Overview/i });
    await overviewTab.click();
    await expect(overviewTab).toHaveClass(/border-biatec-accent/);
  });

  test('should handle MICA panel refresh button click', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for MICA panel to load
    const refreshButton = page.getByRole('button', { name: /Refresh MICA readiness data/i });
    await expect(refreshButton).toBeVisible({ timeout: 10000 });
    
    // Click refresh button
    await refreshButton.click();
    
    // Button should be disabled during refresh
    await expect(refreshButton).toBeDisabled();
    
    // Wait for refresh to complete
    await page.waitForTimeout(1000);
    
    // Button should be enabled again
    await expect(refreshButton).toBeEnabled();
  });

  test('should handle audit trail CSV export button click', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for audit panel
    const csvButton = page.getByRole('button', { name: /Export.*CSV/i });
    await expect(csvButton).toBeVisible({ timeout: 10000 });
    
    // Click export button
    await csvButton.click();
    
    // Button should be disabled during export
    await expect(csvButton).toBeDisabled();
    
    // Wait for export to complete
    await page.waitForTimeout(2000);
    
    // Button should be enabled again
    await expect(csvButton).toBeEnabled();
  });

  test('should navigate to full audit log when view button clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for audit panel
    const viewButton = page.getByRole('button', { name: /View Full Log/i });
    await expect(viewButton).toBeVisible({ timeout: 10000 });
    
    // Click view button
    await viewButton.click();
    
    // Should navigate to audit-log tab
    await page.waitForTimeout(500);
    const auditLogTab = page.getByRole('button', { name: /Audit Log/i });
    await expect(auditLogTab).toHaveClass(/border-biatec-accent/);
  });

  test('should navigate to whitelist management when manage button clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for whitelist panel
    const manageButton = page.getByRole('button', { name: /Manage whitelist/i });
    await expect(manageButton).toBeVisible({ timeout: 10000 });
    
    // Click manage button
    await manageButton.click();
    
    // Should navigate to whitelist tab
    await page.waitForTimeout(500);
    const whitelistTab = page.getByRole('button', { name: /Whitelist Management/i }).first();
    await expect(whitelistTab).toHaveClass(/border-biatec-accent/);
  });

  test('should expand and collapse MICA article details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for MICA panel to load
    await page.waitForTimeout(1000);
    
    // Find first expandable article button
    const expandButtons = page.getByRole('button', { name: /Toggle details for/i });
    const firstButton = expandButtons.first();
    await expect(firstButton).toBeVisible({ timeout: 10000 });
    
    // Check initial state (collapsed)
    await expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    
    // Click to expand
    await firstButton.click();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click again to collapse
    await firstButton.click();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should display all five key panels in grid layout', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verify all 5 panels are present
    const micaPanel = page.getByRole('heading', { name: 'MICA Readiness', level: 2 });
    const auditPanel = page.getByRole('heading', { name: 'Audit Trail', level: 2 });
    const whitelistPanel = page.getByRole('heading', { name: 'Whitelist Status', level: 2 });
    const reportsPanel = page.getByRole('heading', { name: 'Compliance Reports', level: 2 });
    const alertsPanel = page.getByRole('heading', { name: /Compliance Alerts/i, level: 2 });
    
    await expect(micaPanel).toBeVisible({ timeout: 10000 });
    await expect(auditPanel).toBeVisible({ timeout: 10000 });
    await expect(whitelistPanel).toBeVisible({ timeout: 10000 });
    await expect(reportsPanel).toBeVisible({ timeout: 10000 });
    await expect(alertsPanel).toBeVisible({ timeout: 10000 });
  });

  test('should not display any wallet connector prompts', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check that no wallet-related text appears
    const pageContent = await page.textContent('body');
    
    // Verify no wallet terms are present
    expect(pageContent).not.toMatch(/connect.*wallet/i);
    expect(pageContent).not.toMatch(/pera.*wallet/i);
    expect(pageContent).not.toMatch(/defly.*wallet/i);
    expect(pageContent).not.toMatch(/private.*key/i);
  });

  test('should be accessible with proper ARIA labels', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for proper ARIA labels on interactive elements
    await expect(page.getByRole('button', { name: /Refresh MICA readiness data/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Export.*CSV/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export.*JSON/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage whitelist/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate.*report/i })).toBeVisible();
  });

  test('should use semantic HTML headings', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for h1
    const h1 = page.getByRole('heading', { name: 'Compliance Dashboard', level: 1 });
    await expect(h1).toBeVisible({ timeout: 10000 });
    
    // Check for h2 headings
    await expect(page.getByRole('heading', { name: 'MICA Readiness', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Audit Trail', level: 2 })).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Test desktop viewport (default)
    await expect(page.getByRole('heading', { name: 'MICA Readiness', level: 2 })).toBeVisible({ timeout: 10000 });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'MICA Readiness', level: 2 })).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'Compliance Dashboard', level: 1 })).toBeVisible();
  });
});
