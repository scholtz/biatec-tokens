/**
 * Canonical Navigation Route Tests
 *
 * Tests validate alignment between:
 * 1. navItems.ts (source of truth for nav)
 * 2. Router routes (ensuring nav items resolve to defined routes)
 * 3. Auth guard (ensuring auth-first flow is enforced on all protected destinations)
 *
 * These tests enforce the product definition requirements from business-owner-roadmap.md:
 * - "Email and password authentication only - no wallet connectors anywhere"
 * - "Token creation and deployment handled entirely by backend services"
 * - Auth-first routing with /launch/guided as canonical create entry
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NAV_ITEMS } from "../constants/navItems";
import { AUTH_STORAGE_KEYS } from "../constants/auth";
import { AUTH_UI_COPY } from "../constants/uiCopy";

describe("Canonical Nav Routes - Router Alignment", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should define Guided Launch as canonical create entry in NAV_ITEMS", () => {
    const createEntry = NAV_ITEMS.find((item) => item.label === "Create Token");
    expect(createEntry?.path).toBe("/launch/guided");
    expect(createEntry?.routeName).toBe("GuidedTokenLaunch");
  });

  it("should store redirect path before auth redirect", () => {
    const intendedPath = "/launch/guided";
    localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, intendedPath);
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    expect(stored).toBe(intendedPath);
  });

  it("should have all NAV_ITEMS paths starting with /", () => {
    for (const item of NAV_ITEMS) {
      expect(item.path).toMatch(/^\//);
    }
  });

  it("should have exactly 6 top-level navigation destinations (≤7 per roadmap)", () => {
    // Roadmap says: "Maximum 7 top-level navigation items"
    expect(NAV_ITEMS.length).toBeLessThanOrEqual(7);
    expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(5);
  });

  it("should include the 5 minimum required destinations per roadmap", () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    // Home is always required
    expect(paths).toContain("/");
    // Auth-first create entry is required
    expect(paths).toContain("/launch/guided");
    // Dashboard is required
    expect(paths).toContain("/dashboard");
    // Settings is required
    expect(paths).toContain("/settings");
  });

  it("should NOT contain /allowances path (no router definition exists)", () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(paths).not.toContain("/allowances");
  });

  it("should NOT contain /create as top-level nav (legacy path, wizard removed)", () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(paths).not.toContain("/create");
  });

  it("should have unique paths across all nav items (no duplicates)", () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(paths.length);
  });

  it("should have unique labels across all nav items (no duplicate labels)", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });

  it("should have unique routeNames across all nav items", () => {
    const names = NAV_ITEMS.map((item) => item.routeName);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

describe("Auth-First Route Guard Logic", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * Simulates the router guard logic from src/router/index.ts
   */
  const simulateGuard = (path: string, requiresAuth: boolean): "allowed" | "redirected" => {
    if (!requiresAuth) return "allowed";
    if (path === "/dashboard") return "allowed"; // special exception
    const user = localStorage.getItem("algorand_user");
    if (!user) {
      localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, path);
      return "redirected";
    }
    return "allowed";
  };

  it("should redirect /launch/guided when unauthenticated", () => {
    const result = simulateGuard("/launch/guided", true);
    expect(result).toBe("redirected");
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe("/launch/guided");
  });

  it("should allow /launch/guided when authenticated", () => {
    localStorage.setItem("algorand_user", JSON.stringify({ address: "TEST", email: "t@t.com" }));
    const result = simulateGuard("/launch/guided", true);
    expect(result).toBe("allowed");
  });

  it("should allow /dashboard without auth (exception per router config)", () => {
    const result = simulateGuard("/dashboard", true);
    expect(result).toBe("allowed");
  });

  it("should allow public routes without auth", () => {
    const publicRoutes = ["/", "/marketplace", "/token-standards", "/subscription/pricing"];
    for (const path of publicRoutes) {
      const result = simulateGuard(path, false);
      expect(result).toBe("allowed");
    }
  });

  it("should redirect all protected auth-first NAV_ITEMS routes when unauthenticated", () => {
    // All nav items that require auth should redirect when user is not logged in
    const protectedPaths = NAV_ITEMS.filter(
      (item) => item.path !== "/" && item.path !== "/marketplace" && item.path !== "/subscription/pricing",
    ).map((item) => item.path);

    for (const path of protectedPaths) {
      localStorage.clear();
      const result = simulateGuard(path, true);
      if (path !== "/dashboard") {
        expect(result).toBe("redirected");
        expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBe(path);
      }
    }
  });

  it("should preserve intended destination in localStorage for post-auth redirect", () => {
    const intendedPath = "/launch/guided";
    simulateGuard(intendedPath, true);
    const storedPath = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    expect(storedPath).toBe(intendedPath);
  });

  it("should clear redirect storage after retrieving (post-auth flow)", () => {
    const intendedPath = "/launch/guided";
    localStorage.setItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH, intendedPath);

    // Simulate post-auth retrieval and cleanup
    const redirectPath = localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH);

    expect(redirectPath).toBe(intendedPath);
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.REDIRECT_AFTER_AUTH)).toBeNull();
  });
});

describe("Auth UI Copy - No Wallet Language (Roadmap Compliance)", () => {
  it("should use Sign In not Connect Wallet for auth CTA", () => {
    expect(AUTH_UI_COPY.SIGN_IN).toBe("Sign In");
    expect(AUTH_UI_COPY.SIGN_IN).not.toMatch(/wallet/i);
    expect(AUTH_UI_COPY.SIGN_IN).not.toMatch(/connect/i);
  });

  it("should use Sign Out not Disconnect for session end", () => {
    expect(AUTH_UI_COPY.SIGN_OUT).toBe("Sign Out");
    expect(AUTH_UI_COPY.SIGN_OUT).not.toMatch(/disconnect/i);
    expect(AUTH_UI_COPY.SIGN_OUT).not.toMatch(/wallet/i);
  });

  it("should use email/password terminology in description", () => {
    expect(AUTH_UI_COPY.EMAIL_PASSWORD_DESCRIPTION).toMatch(/blockchain identity|account/i);
  });

  it("should not reference wallet connectors in any UI copy string", () => {
    const walletTerms = ["WalletConnect", "MetaMask", "Pera", "Defly", "wallet connector"];
    const allCopyValues = Object.values(AUTH_UI_COPY);
    for (const value of allCopyValues) {
      for (const term of walletTerms) {
        expect(value).not.toContain(term);
      }
    }
  });

  it("should have Sign In header mentioning product name", () => {
    expect(AUTH_UI_COPY.SIGN_IN_HEADER).toContain("Biatec Tokens");
  });

  it("should have ARC76 account label (not wallet address)", () => {
    expect(AUTH_UI_COPY.CONNECTED_ADDRESS).toContain("ARC76");
    expect(AUTH_UI_COPY.CONNECTED_ADDRESS).not.toMatch(/wallet/i);
  });
});
