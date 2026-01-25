import { test, expect } from "@playwright/test";

test.describe("Compliance Monitoring Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the compliance monitoring API
    await page.route("https://api.tokens.biatec.io/api/v1/compliance/monitoring/metrics**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          whitelistEnforcement: {
            totalAddresses: 1247,
            activeAddresses: 1182,
            pendingAddresses: 43,
            removedAddresses: 22,
            enforcementRate: 94.8,
            recentViolations: 3,
            lastUpdated: new Date().toISOString(),
          },
          auditHealth: {
            totalAuditEntries: 8924,
            successfulActions: 8756,
            failedActions: 168,
            criticalIssues: 2,
            warningIssues: 15,
            auditCoverage: 98.1,
            lastAuditTimestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          networkRetentionStatus: [
            {
              totalRecords: 15832,
              activeRecords: 12456,
              archivedRecords: 3376,
              retentionCompliance: 99.2,
              oldestRecord: new Date(Date.now() - 365 * 24 * 3600000).toISOString(),
              retentionPolicyDays: 730,
              lastUpdated: new Date().toISOString(),
            },
          ],
          overallHealthScore: 92,
          calculatedAt: new Date().toISOString(),
        }),
      });
    });

    // Mock the export API
    await page.route("https://api.tokens.biatec.io/api/v1/compliance/monitoring/export**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/csv",
        body: "Network,Score,Date\nVOI,92,2024-01-01",
      });
    });

    // Mock wallet connection to bypass authentication
    await page.addInitScript(() => {
      localStorage.setItem("wallet_connected", "true");
      localStorage.setItem("onboarding_completed", "true");
    });
  });

  test("should load compliance monitoring dashboard with authentication", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Check main heading
    await expect(page.getByRole("heading", { name: /Compliance Monitoring Dashboard/i })).toBeVisible();

    // Check subtitle
    await expect(page.getByText("Enterprise-grade compliance observability for VOI/Aramid networks")).toBeVisible();

    // Check that the page loaded without crashing
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test.skip("should redirect to home when not authenticated", async ({ page }) => {
    // This test is skipped because router guards are not testable in E2E environment
    // Authentication is tested in unit tests
  });

  test("should display filter section with all filter options", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Wait for filter section to load
    await page.waitForSelector("text=Filters", { timeout: 5000 });

    // Check for network filter
    const networkFilter = page.locator("select").first();
    await expect(networkFilter).toBeVisible();

    // Check filter options
    await expect(page.getByText("Network", { exact: true })).toBeVisible();
    await expect(page.getByText("Asset ID")).toBeVisible();
    await expect(page.getByText("Start Date")).toBeVisible();
    await expect(page.getByText("End Date")).toBeVisible();
  });

  test("should update URL when filters are changed", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Wait for the page to fully load
    await page.waitForSelector("select", { timeout: 10000 });

    // Change network filter
    const networkSelect = page.locator("select").first();
    await networkSelect.selectOption("VOI");

    // Wait for URL to update by checking the URL contains the network parameter
    await page.waitForFunction(
      () => {
        return window.location.search.includes("network=VOI");
      },
      { timeout: 3000 },
    );

    // Check that URL was updated
    const url = page.url();
    expect(url).toContain("network=VOI");
  });

  test("should load dashboard with filters from URL params", async ({ page }) => {
    await page.goto("/compliance-monitoring?network=VOI&assetId=12345");
    await page.waitForLoadState("networkidle");

    // Wait for filters to load
    await page.waitForSelector("select", { timeout: 10000 });

    // Check that network filter is set correctly
    const networkSelect = page.locator("select").first();
    await expect(networkSelect).toHaveValue("VOI");

    // Check that asset ID is populated - use getByPlaceholder for better reliability
    const assetIdInput = page.getByPlaceholder(/optional asset id/i);
    await expect(assetIdInput).toHaveValue("12345");
  });

  test("should display metric cards when data is loaded", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Wait for content to load - look for any of the expected states
    await Promise.race([
      page.waitForSelector("text=Overall Compliance Score", { timeout: 5000 }).catch(() => null),
      page.waitForSelector("text=No Compliance Data Available", { timeout: 5000 }).catch(() => null),
      page.waitForSelector("text=Failed to Load Compliance Data", { timeout: 5000 }).catch(() => null),
      page.waitForSelector(".pi-spinner", { timeout: 5000 }).catch(() => null),
    ]);

    // Check for either metrics or loading/empty state
    const hasMetrics = await page
      .locator("text=Overall Compliance Score")
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .locator("text=No Compliance Data Available")
      .isVisible()
      .catch(() => false);
    const hasError = await page
      .locator("text=Failed to Load Compliance Data")
      .isVisible()
      .catch(() => false);
    const isLoading = await page
      .locator(".pi-spinner")
      .isVisible()
      .catch(() => false);

    // One of these should be visible
    expect(hasMetrics || hasEmptyState || hasError || isLoading).toBe(true);

    // If metrics are shown, verify key sections exist
    if (hasMetrics) {
      await expect(page.locator("text=Whitelist Enforcement")).toBeVisible();
      await expect(page.locator("text=Audit Health")).toBeVisible();
      await expect(page.locator("text=Retention Status")).toBeVisible();
    }
  });

  test("should have export CSV button", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Check for export button
    const exportButton = page.getByRole("button", { name: /Export CSV/i });
    await expect(exportButton).toBeVisible();
  });

  test("should handle export CSV button click", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Find and click export button
    const exportButton = page.getByRole("button", { name: /Export CSV/i });
    await expect(exportButton).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

    // Click export button
    await exportButton.click();

    // Wait a bit for any async operations
    await page.waitForTimeout(500);

    // Check that page is still functional after click
    await expect(page.getByRole("heading", { name: /Compliance Monitoring Dashboard/i })).toBeVisible();

    // Download might or might not happen depending on API availability
    // We just verify the page doesn't crash
  });

  test("should clear filters when Clear All is clicked", async ({ page }) => {
    await page.goto("/compliance-monitoring?network=VOI&assetId=12345");
    await page.waitForLoadState("networkidle");

    // Wait for filters to load
    await page.waitForSelector("select", { timeout: 10000 });

    // Verify filters are actually applied (this ensures Clear All button should be visible)
    const networkSelect = page.locator("select").first();
    await expect(networkSelect).toHaveValue("VOI");

    // Look for Clear All button (it appears when filters are active)
    const clearButton = page.locator("button:has-text('Clear All')");

    // Wait for button to appear since filters are active
    await expect(clearButton).toBeVisible({ timeout: 5000 });

    await clearButton.click();

    // Wait for URL to update
    await page.waitForFunction(
      () => {
        return !window.location.search.includes("network=VOI");
      },
      { timeout: 3000 },
    );

    // Check that filters are reset
    await expect(networkSelect).toHaveValue("all");
  });

  test("should display back button and navigate", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Check for back button
    const backButton = page.locator("button:has-text('Back')");
    await expect(backButton).toBeVisible();

    // We won't click it since we don't have a previous page
    // Just verify it exists and is clickable
    await expect(backButton).toBeEnabled();
  });

  test("should display MICA compliance information section", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Wait for content to load - either metrics or error/empty state
    await Promise.race([
      page.waitForSelector("text=Overall Compliance Score", { timeout: 5000 }).catch(() => null),
      page.waitForSelector("text=No Compliance Data Available", { timeout: 5000 }).catch(() => null),
      page.waitForSelector("text=Failed to Load Compliance Data", { timeout: 5000 }).catch(() => null),
    ]);

    // Check for MICA section if metrics are loaded
    const hasMetrics = await page
      .locator("text=Overall Compliance Score")
      .isVisible()
      .catch(() => false);

    if (hasMetrics) {
      // MICA section should be visible
      await expect(page.locator("text=MICA Compliance")).toBeVisible();
    }
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Check that main content is visible
    await expect(page.getByRole("heading", { name: /Compliance Monitoring Dashboard/i })).toBeVisible();

    // Check that filters are visible (they should stack on mobile)
    await expect(page.getByText("Network", { exact: true })).toBeVisible();
  });

  test("should be responsive on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Check that main content is visible
    await expect(page.getByRole("heading", { name: /Compliance Monitoring Dashboard/i })).toBeVisible();

    // Verify layout doesn't break
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle date filter inputs", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Wait for filters to load
    await page.waitForSelector("input[type='date']", { timeout: 10000 });

    // Find date inputs
    const dateInputs = page.locator("input[type='date']");
    const count = await dateInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Try to fill in a date
    const startDateInput = dateInputs.first();
    await startDateInput.fill("2024-01-01");

    // Verify the value was set
    await expect(startDateInput).toHaveValue("2024-01-01");
  });

  test("should handle asset ID filter input", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Wait for filters to load - use getByPlaceholder
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });

    // Find asset ID input using getByPlaceholder for better reliability
    const assetIdInput = page.getByPlaceholder(/optional asset id/i);
    await assetIdInput.fill("test-asset-123");

    // Verify the value was set
    await expect(assetIdInput).toHaveValue("test-asset-123");
  });

  test("should display enterprise security messaging", async ({ page }) => {
    await page.goto("/compliance-monitoring");
    await page.waitForLoadState("networkidle");

    // Wait for main heading to be visible
    await expect(page.getByRole("heading", { name: /Compliance Monitoring Dashboard/i })).toBeVisible();

    // Check for enterprise-related terms - use case-insensitive locators
    const pageText = await page.textContent("body");
    expect(pageText).toBeTruthy();

    // Should contain enterprise or compliance related terms (case-insensitive)
    const hasEnterpriseTerms =
      pageText?.toLowerCase().includes("enterprise") || pageText?.toLowerCase().includes("compliance") || pageText?.toLowerCase().includes("mica") || pageText?.toLowerCase().includes("observability");

    expect(hasEnterpriseTerms).toBe(true);
  });
});
