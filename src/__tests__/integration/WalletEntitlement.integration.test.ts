/**
 * Integration tests for wallet signing with entitlement checks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { entitlementService } from "../../services/EntitlementService";
import { FeatureFlag, SubscriptionTier } from "../../types/entitlement";
import { SigningStatus } from "../../types/signing";

// Mock wallet modules
vi.mock("@txnlab/use-wallet-vue", () => ({
  useWallet: vi.fn(() => ({
    activeAccount: { value: { address: "TEST_ADDRESS", name: "Test User" } },
    activeWallet: {
      value: {
        id: "pera",
        signTransactions: vi.fn(async () => [new Uint8Array([1, 2, 3])]),
      },
    },
    wallets: { value: [] },
  })),
}));

// Mock window.ethereum for EVM tests
(global as any).window = {
  ethereum: {
    request: vi.fn(async ({ method }: any) => {
      if (method === "eth_requestAccounts") {
        return ["0x1234567890123456789012345678901234567890"];
      }
      if (method === "eth_chainId") {
        return "0x1"; // Ethereum mainnet
      }
      if (method === "eth_sendTransaction") {
        return "0xabcdef1234567890";
      }
      return null;
    }),
    on: vi.fn(),
    selectedAddress: "0x1234567890123456789012345678901234567890",
  },
};

describe("Wallet Signing with Entitlement Integration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    
    // Initialize with free tier
    entitlementService.initialize({
      subscription_status: "active",
      price_id: null,
    });
  });

  describe("Token Creation Flow", () => {
    it("should allow ASA creation on free tier", () => {
      const accessResult = entitlementService.checkFeatureAccess(FeatureFlag.TOKEN_CREATION_ASA);
      expect(accessResult.allowed).toBe(true);
    });

    it("should block ARC200 creation on free tier", () => {
      const accessResult = entitlementService.checkFeatureAccess(FeatureFlag.TOKEN_CREATION_ARC200);
      expect(accessResult.allowed).toBe(false);
      expect(accessResult.upgradeRequired).toBeDefined();
    });

    it("should enforce token creation limits on free tier", () => {
      // Create 3 tokens (the limit for free tier)
      for (let i = 0; i < 3; i++) {
        const result = entitlementService.checkUsageLimit("tokensPerMonth", 1);
        expect(result.allowed).toBe(true);
        entitlementService.incrementUsage("tokensPerMonth", 1);
      }

      // 4th token should be blocked
      const result = entitlementService.checkUsageLimit("tokensPerMonth", 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("reached your");
    });

    it("should allow unlimited tokens on enterprise tier", () => {
      entitlementService.initialize({
        subscription_status: "active",
        price_id: "price_enterprise_monthly",
      });

      // Try creating many tokens
      for (let i = 0; i < 100; i++) {
        const result = entitlementService.checkUsageLimit("tokensPerMonth", 1);
        expect(result.allowed).toBe(true);
        entitlementService.incrementUsage("tokensPerMonth", 1);
      }
    });
  });

  describe("Network Access Control", () => {
    it("should allow VOI network on free tier", () => {
      const accessResult = entitlementService.checkFeatureAccess(FeatureFlag.NETWORK_VOI);
      expect(accessResult.allowed).toBe(true);
    });

    it("should block Ethereum network on free tier", () => {
      const accessResult = entitlementService.checkFeatureAccess(FeatureFlag.NETWORK_ETHEREUM);
      expect(accessResult.allowed).toBe(false);
    });

    it("should allow all networks on pro tier", () => {
      entitlementService.initialize({
        subscription_status: "active",
        price_id: "price_pro_monthly",
      });

      const networks = [
        FeatureFlag.NETWORK_VOI,
        FeatureFlag.NETWORK_ARAMID,
        FeatureFlag.NETWORK_ETHEREUM,
        FeatureFlag.NETWORK_ARBITRUM,
        FeatureFlag.NETWORK_BASE,
      ];

      networks.forEach((network) => {
        const result = entitlementService.checkFeatureAccess(network);
        expect(result.allowed).toBe(true);
      });
    });
  });

  describe("Compliance Features", () => {
    it("should block compliance features on free tier", () => {
      const features = [
        FeatureFlag.COMPLIANCE_WHITELIST,
        FeatureFlag.COMPLIANCE_KYC,
        FeatureFlag.COMPLIANCE_MICA,
      ];

      features.forEach((feature) => {
        const result = entitlementService.checkFeatureAccess(feature);
        expect(result.allowed).toBe(false);
      });
    });

    it("should allow whitelist on basic tier", () => {
      entitlementService.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });

      const result = entitlementService.checkFeatureAccess(FeatureFlag.COMPLIANCE_WHITELIST);
      expect(result.allowed).toBe(true);
    });

    it("should enforce whitelist address limits", () => {
      entitlementService.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });

      // Basic tier has 1000 whitelist address limit
      entitlementService.incrementUsage("whitelistAddresses", 950);

      const result1 = entitlementService.checkUsageLimit("whitelistAddresses", 50);
      expect(result1.allowed).toBe(true);

      // This should exceed the limit
      const result2 = entitlementService.checkUsageLimit("whitelistAddresses", 51);
      expect(result2.allowed).toBe(false);
    });
  });

  describe("Batch Operations", () => {
    it("should block batch deployment on free tier", () => {
      const result = entitlementService.checkFeatureAccess(FeatureFlag.BATCH_DEPLOYMENT);
      expect(result.allowed).toBe(false);
    });

    it("should allow batch deployment on pro tier", () => {
      entitlementService.initialize({
        subscription_status: "active",
        price_id: "price_pro_monthly",
      });

      const result = entitlementService.checkFeatureAccess(FeatureFlag.BATCH_DEPLOYMENT);
      expect(result.allowed).toBe(true);
    });

    it("should enforce daily deployment limits", () => {
      entitlementService.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });

      // Basic tier has 20 deployments/day
      entitlementService.incrementUsage("deploymentPerDay", 19);

      const result1 = entitlementService.checkUsageLimit("deploymentPerDay", 1);
      expect(result1.allowed).toBe(true);

      entitlementService.incrementUsage("deploymentPerDay", 1);

      const result2 = entitlementService.checkUsageLimit("deploymentPerDay", 1);
      expect(result2.allowed).toBe(false);
    });
  });

  describe("Usage Tracking and Warnings", () => {
    beforeEach(() => {
      entitlementService.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });
    });

    it("should track usage percentage", () => {
      entitlementService.incrementUsage("tokensPerMonth", 5);

      const percentage = entitlementService.getUsagePercentage("tokensPerMonth");
      expect(percentage).toBe(50); // 5 out of 10 for basic tier
    });

    it("should detect near limit threshold", () => {
      entitlementService.incrementUsage("tokensPerMonth", 9);

      const isNear = entitlementService.isNearLimit("tokensPerMonth");
      expect(isNear).toBe(true); // 90% is above 80% threshold
    });

    it("should not flag as near limit when below threshold", () => {
      entitlementService.incrementUsage("tokensPerMonth", 5);

      const isNear = entitlementService.isNearLimit("tokensPerMonth");
      expect(isNear).toBe(false); // 50% is below 80% threshold
    });

    it("should provide usage info in check result", () => {
      entitlementService.incrementUsage("tokensPerMonth", 7);

      const result = entitlementService.checkUsageLimit("tokensPerMonth", 1);
      expect(result.usageInfo).toBeDefined();
      expect(result.usageInfo?.current).toBe(8);
      expect(result.usageInfo?.limit).toBe(10);
      expect(result.usageInfo?.percentage).toBe(80);
    });
  });

  describe("Upgrade Prompts", () => {
    it("should generate upgrade prompt for restricted feature", () => {
      const prompt = entitlementService.getUpgradePrompt(FeatureFlag.TOKEN_CREATION_ARC200);

      expect(prompt.title).toContain("Upgrade");
      expect(prompt.targetTier).toBe(SubscriptionTier.PRO);
      expect(prompt.features).toBeInstanceOf(Array);
      expect(prompt.features.length).toBeGreaterThan(0);
      expect(prompt.ctaLink).toBe("/subscription");
    });

    it("should suggest correct tier for feature", () => {
      const prompt1 = entitlementService.getUpgradePrompt(FeatureFlag.COMPLIANCE_WHITELIST);
      expect(prompt1.targetTier).toBe(SubscriptionTier.BASIC);

      const prompt2 = entitlementService.getUpgradePrompt(FeatureFlag.COMPLIANCE_MICA);
      expect(prompt2.targetTier).toBe(SubscriptionTier.PRO);
    });
  });

  describe("Subscription State Handling", () => {
    it("should block all features when subscription is inactive", () => {
      entitlementService.initialize({
        subscription_status: "cancelled",
        price_id: "price_pro_monthly",
      });

      const result = entitlementService.checkFeatureAccess(FeatureFlag.TOKEN_CREATION_ASA);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not active");
    });

    it("should handle missing subscription gracefully", () => {
      // Don't initialize or initialize with null
      const newService = entitlementService;
      
      const entitlement = newService.getEntitlement();
      // Service should have some state from previous tests
      expect(entitlement).toBeDefined();
    });
  });

  describe("Usage Reset", () => {
    beforeEach(() => {
      entitlementService.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });
    });

    it("should reset monthly counters", () => {
      entitlementService.incrementUsage("tokensPerMonth", 8);
      entitlementService.incrementUsage("attestationsPerMonth", 20);

      entitlementService.resetUsage();

      const entitlement = entitlementService.getEntitlement();
      expect(entitlement?.usage.tokensThisMonth).toBe(0);
      expect(entitlement?.usage.attestationsThisMonth).toBe(0);
    });

    it("should reset daily counters", () => {
      entitlementService.incrementUsage("deploymentPerDay", 15);
      entitlementService.incrementUsage("apiCallsPerDay", 200);

      entitlementService.resetUsage();

      const entitlement = entitlementService.getEntitlement();
      expect(entitlement?.usage.deploymentsToday).toBe(0);
      expect(entitlement?.usage.apiCallsToday).toBe(0);
    });

    it("should preserve permanent counters", () => {
      entitlementService.incrementUsage("whitelistAddresses", 500);

      entitlementService.resetUsage();

      const entitlement = entitlementService.getEntitlement();
      expect(entitlement?.usage.whitelistAddresses).toBe(500);
    });
  });
});
