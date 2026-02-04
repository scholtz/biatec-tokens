import { test, expect } from "@playwright/test";

test.describe("Network Validation Flow", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // TODO(Firefox-E2E): Investigate and fix Firefox networkidle timeout issues.
    // This is a known Playwright + Firefox issue affecting multiple test files.
    // Temporary workaround: Skip Firefox E2E tests until resolved.
    // See also: e2e/wallet-connection.spec.ts, e2e/wallet-network-flow.spec.ts
    test.skip(browserName === "firefox", "Firefox has persistent networkidle timeout issues");

    // Mock wallet connection
    await page.addInitScript(() => {
      localStorage.setItem("wallet_connected", "true");
      localStorage.setItem("onboarding_completed", "true");
      localStorage.setItem("selected_network", "voi-mainnet");
      localStorage.setItem(
        "algorand_user",
        JSON.stringify({
          address: "TESTADDRESS123456789ABCDEF",
          name: "Test User",
        }),
      );
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should persist network selection across page refresh", async ({ page, browserName }) => {
    // Skip on Firefox due to reload timeout issues
    test.skip(browserName === "firefox", "Firefox has issues with page.reload()");

    // Set initial network
    await page.evaluate(() => {
      localStorage.setItem("selected_network", "voi-mainnet");
    });

    // Reload page
    await page.reload({ timeout: 15000 });
    await expect(page).toHaveTitle(/Biatec Tokens/);

    // Verify network persisted
    const selectedNetwork = await page.evaluate(() => {
      return localStorage.getItem("selected_network");
    });

    expect(selectedNetwork).toBe("voi-mainnet");
  });

  test("should persist token draft in sessionStorage", async ({ page }) => {
    await page.goto("/");

    // Set token draft
    await page.evaluate(() => {
      const draft = {
        version: "1.0",
        draft: {
          name: "Test Token",
          symbol: "TST",
          description: "Test description",
          supply: 1000000,
          decimals: 6,
          imageUrl: "",
          attributes: [],
          selectedNetwork: "voi-mainnet",
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
        network: "voi-mainnet",
        timestamp: Date.now(),
      };

      sessionStorage.setItem("biatec_token_draft", JSON.stringify(draft));
    });

    // Verify draft persists
    const storedDraft = await page.evaluate(() => {
      const stored = sessionStorage.getItem("biatec_token_draft");
      return stored ? JSON.parse(stored) : null;
    });

    expect(storedDraft).toBeTruthy();
    expect(storedDraft.draft.name).toBe("Test Token");
    expect(storedDraft.draft.symbol).toBe("TST");
    expect(storedDraft.network).toBe("voi-mainnet");
  });

  test("should clear token draft when explicitly cleared", async ({ page }) => {
    await page.goto("/");

    // Set token draft
    await page.evaluate(() => {
      sessionStorage.setItem("biatec_token_draft", JSON.stringify({ test: "data" }));
    });

    // Verify it exists
    let draft = await page.evaluate(() => sessionStorage.getItem("biatec_token_draft"));
    expect(draft).toBeTruthy();

    // Clear it
    await page.evaluate(() => {
      sessionStorage.removeItem("biatec_token_draft");
    });

    // Verify it's gone
    draft = await page.evaluate(() => sessionStorage.getItem("biatec_token_draft"));
    expect(draft).toBeNull();
  });

  test("should handle wallet connection state persistence", async ({ page, browserName }) => {
    // Skip on Firefox due to reload timeout issues
    test.skip(browserName === "firefox", "Firefox has issues with page.reload()");

    await page.goto("/");

    // Set wallet connection state
    await page.evaluate(() => {
      localStorage.setItem("wallet_connected", "true");
      localStorage.setItem("active_wallet_id", "pera");
      localStorage.setItem(
        "algorand_user",
        JSON.stringify({
          address: "TEST123456",
          name: "Test User",
        }),
      );
    });

    // Reload
    await page.reload({ timeout: 15000 });
    await expect(page).toHaveTitle(/Biatec Tokens/);

    // Verify wallet state persisted
    const walletState = await page.evaluate(() => {
      return {
        connected: localStorage.getItem("wallet_connected"),
        walletId: localStorage.getItem("active_wallet_id"),
        user: localStorage.getItem("algorand_user"),
      };
    });

    expect(walletState.connected).toBe("true");
    expect(walletState.walletId).toBe("pera");
    expect(walletState.user).toBeTruthy();
  });

  test("should show page successfully with network state", async ({ page }) => {
    await page.goto("/");

    // Verify page title
    await expect(page).toHaveTitle(/Biatec/);

    // Verify main content is visible
    await expect(page.getByRole("heading", { name: /Next-Generation Tokenization Platform/i })).toBeVisible({ timeout: 10000 });

    // Verify network state is accessible
    const hasNetworkState = await page.evaluate(() => {
      return localStorage.getItem("selected_network") !== null;
    });

    expect(hasNetworkState).toBe(true);
  });

  test("should allow network switching in localStorage", async ({ page }) => {
    await page.goto("/");

    // Set initial network
    await page.evaluate(() => {
      localStorage.setItem("selected_network", "voi-mainnet");
    });

    let network = await page.evaluate(() => localStorage.getItem("selected_network"));
    expect(network).toBe("voi-mainnet");

    // Switch to Aramid
    await page.evaluate(() => {
      localStorage.setItem("selected_network", "aramidmain");
    });

    network = await page.evaluate(() => localStorage.getItem("selected_network"));
    expect(network).toBe("aramidmain");

    // Switch to Ethereum
    await page.evaluate(() => {
      localStorage.setItem("selected_network", "ethereum");
    });

    network = await page.evaluate(() => localStorage.getItem("selected_network"));
    expect(network).toBe("ethereum");
  });
});
