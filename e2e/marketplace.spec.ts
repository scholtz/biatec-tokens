import { test, expect } from "@playwright/test";

test.describe("Marketplace", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip Firefox due to consistent networkidle timeout issues
    test.skip(browserName === "firefox", "Firefox has persistent networkidle timeout issues");

    await page.goto("/marketplace");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should load marketplace page with title and description", async ({ page }) => {
    // Check main heading
    const heading = page.getByRole("heading", { name: /Token Marketplace/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check description
    await expect(page.locator("text=Discover and trade regulated tokens")).toBeVisible();
  });

  test("should display marketplace tokens after loading", async ({ page }) => {
    // Wait for tokens to load
    await page.waitForTimeout(1000);

    // Check for token cards
    const tokenCards = page.locator(".marketplace-token-card");
    const count = await tokenCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display filter controls", async ({ page }) => {
    // Check for search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Check for filter dropdowns
    const networkSelect = page.locator('select').filter({ hasText: /All Networks/i }).first();
    await expect(networkSelect).toBeVisible();

    const complianceSelect = page.locator('select').filter({ hasText: /All Compliance/i }).first();
    await expect(complianceSelect).toBeVisible();

    const assetClassSelect = page.locator('select').filter({ hasText: /All Types/i }).first();
    await expect(assetClassSelect).toBeVisible();
  });

  test("should filter tokens by search query", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Get initial token count
    const initialCards = page.locator(".marketplace-token-card");
    const initialCount = await initialCards.count();

    // Search for a specific token
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("MICA");
    await page.waitForTimeout(500);

    // Check that filtered results are displayed
    const filteredCards = page.locator(".marketplace-token-card");
    const filteredCount = await filteredCards.count();

    // Should have fewer or equal results
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test("should filter tokens by network", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Select VOI network
    const networkSelect = page.locator('select').first();
    await networkSelect.selectOption("VOI");
    await page.waitForTimeout(500);

    // Check that tokens are filtered
    const tokenCards = page.locator(".marketplace-token-card");
    const count = await tokenCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify network is shown in filter count
    await expect(page.locator("text=/\\d+ of \\d+ tokens/")).toBeVisible();
  });

  test("should filter tokens by compliance badge", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Select MICA Compliant filter
    const complianceSelect = page.locator('select').nth(1);
    await complianceSelect.selectOption("MICA Compliant");
    await page.waitForTimeout(500);

    // Check that tokens are filtered
    const tokenCards = page.locator(".marketplace-token-card");
    const count = await tokenCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should filter tokens by asset class", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Select FT (Fungible Tokens)
    const assetClassSelect = page.locator('select').nth(2);
    await assetClassSelect.selectOption("FT");
    await page.waitForTimeout(500);

    // Check that tokens are filtered
    const tokenCards = page.locator(".marketplace-token-card");
    const count = await tokenCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should persist filters in URL", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Apply filters
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("token");

    const networkSelect = page.locator('select').first();
    await networkSelect.selectOption("VOI");

    await page.waitForTimeout(500);

    // Check URL contains filter parameters
    const url = page.url();
    expect(url).toContain("search=token");
    expect(url).toContain("network=VOI");
  });

  test("should show active filter badges", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Apply a network filter
    const networkSelect = page.locator('select').first();
    await networkSelect.selectOption("VOI");
    await page.waitForTimeout(500);

    // Check for active filter badge
    const filterBadge = page.locator("text=VOI").filter({ has: page.locator(".pi-times") });
    await expect(filterBadge).toBeVisible();
  });

  test("should clear individual filter by changing select", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Apply a filter
    const networkSelect = page.locator('select').first();
    await networkSelect.selectOption("VOI");
    await page.waitForTimeout(500);

    // Verify URL has the filter
    let url = page.url();
    expect(url).toContain("network=VOI");
    
    // Clear by changing select back to All
    await networkSelect.selectOption("All");
    await page.waitForTimeout(500);

    // Verify filter was cleared in URL
    url = page.url();
    expect(url).not.toContain("network=VOI");
  });

  test("should reset all filters", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Apply multiple filters
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("test");

    const networkSelect = page.locator('select').first();
    await networkSelect.selectOption("VOI");

    await page.waitForTimeout(500);

    // Click reset button
    const resetButton = page.locator("button").filter({ hasText: /Reset All/i });
    await resetButton.click();
    await page.waitForTimeout(500);

    // Verify all filters are reset
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe("");

    const networkValue = await networkSelect.inputValue();
    expect(networkValue).toBe("All");
  });

  test("should open token detail drawer when clicking token card", async ({ page }) => {
    // Wait for tokens to load
    await page.waitForTimeout(1000);

    // Click on first token card
    const firstCard = page.locator(".marketplace-token-card").first();
    await firstCard.click();
    await page.waitForTimeout(500);

    // Check that drawer opened with token details
    const drawer = page.locator(".fixed.inset-0.z-50");
    await expect(drawer).toBeVisible();

    // Check for close button in drawer
    const closeButton = page.locator('button[aria-label="Close drawer"]');
    await expect(closeButton).toBeVisible();
  });

  test("should close token detail drawer", async ({ page }) => {
    // Wait for tokens to load
    await page.waitForTimeout(1000);

    // Open drawer
    const firstCard = page.locator(".marketplace-token-card").first();
    await firstCard.click();
    await page.waitForTimeout(500);

    // Close drawer
    const closeButton = page.locator('button[aria-label="Close drawer"]');
    await closeButton.click();
    await page.waitForTimeout(500);

    // Verify drawer is closed
    const drawer = page.locator(".fixed.inset-0.z-50");
    await expect(drawer).not.toBeVisible();
  });

  test("should display empty state when no tokens match filters", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Search for something that won't match
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("nonexistent-xyz-123");
    await page.waitForTimeout(500);

    // Check for empty state
    await expect(page.locator("text=No tokens found")).toBeVisible();
    await expect(page.locator("text=Try adjusting your filters")).toBeVisible();
  });

  test("should show clear filters button in empty state", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Apply filter that results in no matches
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("nonexistent-xyz-123");
    await page.waitForTimeout(500);

    // Check for clear filters button in empty state
    const clearButton = page.locator("button").filter({ hasText: /Clear Filters/i });
    await expect(clearButton).toBeVisible();
  });

  test("should display token compliance badges", async ({ page }) => {
    // Wait for tokens to load
    await page.waitForTimeout(1000);

    // Check that at least one token has compliance badges
    const badges = page.locator(".marketplace-token-card .px-2.py-1.text-xs.font-medium.rounded-full");
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display token prices", async ({ page }) => {
    // Wait for tokens to load
    await page.waitForTimeout(1000);

    // Check that at least one token shows a price
    const prices = page.locator("text=/\\$[0-9,.]+/");
    const count = await prices.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/marketplace");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // Check that page is still functional
    const heading = page.getByRole("heading", { name: /Token Marketplace/i });
    await expect(heading).toBeVisible();

    // Check that filters are stacked vertically (grid-cols-1 on mobile)
    const filterContainer = page.locator(".grid.grid-cols-1.md\\:grid-cols-3");
    await expect(filterContainer).toBeVisible();
  });
});
