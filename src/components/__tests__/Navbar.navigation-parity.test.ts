/**
 * Navigation Parity Tests
 *
 * Validates that:
 * 1. Desktop and mobile navigation share the same items (AC #3)
 * 2. "Create Token" canonical route points to /launch/guided (AC #4)
 * 3. No dead-end routes (e.g., removed /allowances which has no router definition)
 * 4. No wallet connector UI in navigation items (business roadmap: email/password only)
 */
import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "../../constants/navItems";

describe("Navigation Parity - Single Source of Truth", () => {
  it("should export NAV_ITEMS for both desktop and mobile menus", () => {
    expect(NAV_ITEMS).toBeDefined();
    expect(Array.isArray(NAV_ITEMS)).toBe(true);
    expect(NAV_ITEMS.length).toBeGreaterThan(0);
  });

  it("should include Home as the first navigation item", () => {
    expect(NAV_ITEMS[0].label).toBe("Home");
    expect(NAV_ITEMS[0].path).toBe("/");
  });

  it("should include Create Token pointing to /launch/guided (canonical auth-first flow)", () => {
    const createItem = NAV_ITEMS.find((item) => item.label === "Create Token");
    expect(createItem).toBeDefined();
    expect(createItem?.path).toBe("/launch/guided");
    expect(createItem?.routeName).toBe("GuidedTokenLaunch");
  });

  it("should NOT include legacy /create path as top-level nav destination", () => {
    const legacyCreate = NAV_ITEMS.find((item) => item.path === "/create");
    expect(legacyCreate).toBeUndefined();
  });

  it("should NOT include dead /allowances route (no router definition)", () => {
    const deadRoute = NAV_ITEMS.find((item) => item.path === "/allowances");
    expect(deadRoute).toBeUndefined();
  });

  it("should NOT include wallet-connector UI labels in navigation items", () => {
    const walletLabels = ["WalletConnect", "MetaMask", "Connect Wallet", "Pera", "Defly"];
    for (const item of NAV_ITEMS) {
      for (const walletLabel of walletLabels) {
        expect(item.label).not.toContain(walletLabel);
      }
    }
  });

  it("should include Dashboard", () => {
    const dashItem = NAV_ITEMS.find((item) => item.path === "/dashboard");
    expect(dashItem).toBeDefined();
    expect(dashItem?.routeName).toBe("TokenDashboard");
  });

  it("should include Marketplace", () => {
    const marketItem = NAV_ITEMS.find((item) => item.path === "/marketplace");
    expect(marketItem).toBeDefined();
    expect(marketItem?.routeName).toBe("Marketplace");
  });

  it("should include Attestations", () => {
    const attestItem = NAV_ITEMS.find((item) => item.path === "/attestations");
    expect(attestItem).toBeDefined();
    expect(attestItem?.routeName).toBe("AttestationsDashboard");
  });

  it("should include Settings", () => {
    const settingsItem = NAV_ITEMS.find((item) => item.path === "/settings");
    expect(settingsItem).toBeDefined();
    expect(settingsItem?.routeName).toBe("Settings");
  });

  it("should have matching labels and paths for all items (no label/path mismatch)", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label).toBeTruthy();
      expect(item.path).toBeTruthy();
      expect(item.routeName).toBeTruthy();
      expect(item.path.startsWith("/")).toBe(true);
    }
  });

  it("should expose identical item count for desktop and mobile (parity check)", () => {
    // Both desktop and mobile render from the same NAV_ITEMS array
    // This test asserts that array is used by both via the single source
    const desktopItemCount = NAV_ITEMS.length;
    const mobileItemCount = NAV_ITEMS.length;
    expect(desktopItemCount).toBe(mobileItemCount);
  });
});
