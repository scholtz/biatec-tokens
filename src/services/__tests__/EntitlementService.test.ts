/**
 * Unit tests for EntitlementService
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EntitlementService } from "../EntitlementService";
import { SubscriptionTier, FeatureFlag } from "../../types/entitlement";

describe("EntitlementService", () => {
  let service: EntitlementService;

  beforeEach(() => {
    service = EntitlementService.getInstance();
  });

  describe("initialize", () => {
    it("should initialize with free tier for no subscription", () => {
      service.initialize({
        subscription_status: "not_started",
      });

      const entitlement = service.getEntitlement();
      expect(entitlement).toBeDefined();
      expect(entitlement?.tier).toBe(SubscriptionTier.FREE);
      expect(entitlement?.isActive).toBe(true);
    });

    it("should initialize with basic tier for basic subscription", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });

      const entitlement = service.getEntitlement();
      expect(entitlement?.tier).toBe(SubscriptionTier.BASIC);
      expect(entitlement?.isActive).toBe(true);
    });

    it("should initialize with pro tier for pro subscription", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_pro_monthly",
      });

      const entitlement = service.getEntitlement();
      expect(entitlement?.tier).toBe(SubscriptionTier.PRO);
      expect(entitlement?.isActive).toBe(true);
    });

    it("should initialize with enterprise tier for enterprise subscription", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_enterprise_monthly",
      });

      const entitlement = service.getEntitlement();
      expect(entitlement?.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(entitlement?.isActive).toBe(true);
    });

    it("should set expiry date from subscription", () => {
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
      service.initialize({
        subscription_status: "active",
        price_id: "price_pro_monthly",
        current_period_end: expiryTimestamp,
      });

      const entitlement = service.getEntitlement();
      expect(entitlement?.expiresAt).toBeDefined();
      expect(entitlement?.expiresAt?.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("checkFeatureAccess", () => {
    it("should allow access to features in user's tier", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });

      const result = service.checkFeatureAccess(FeatureFlag.TOKEN_CREATION_ASA);
      expect(result.allowed).toBe(true);
    });

    it("should deny access to features above user's tier", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });

      const result = service.checkFeatureAccess(FeatureFlag.TOKEN_CREATION_ARC200);
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBeDefined();
      expect(result.reason).toContain("requires");
    });

    it("should deny access when subscription is not active", () => {
      service.initialize({
        subscription_status: "cancelled",
        price_id: "price_pro_monthly",
      });

      const result = service.checkFeatureAccess(FeatureFlag.TOKEN_CREATION_ASA);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not active");
    });

    it("should deny access when subscription is inactive", () => {
      // Initialize with inactive subscription
      service.initialize({
        subscription_status: "cancelled",
        price_id: "price_basic_monthly",
      });
      const result = service.checkFeatureAccess(FeatureFlag.TOKEN_CREATION_ASA);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not active");
    });

    it("should allow all features for enterprise tier", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_enterprise_monthly",
      });

      const features = [
        FeatureFlag.TOKEN_CREATION_ARC200,
        FeatureFlag.COMPLIANCE_MICA,
        FeatureFlag.API_ACCESS,
        FeatureFlag.CUSTOM_BRANDING,
      ];

      features.forEach((feature) => {
        const result = service.checkFeatureAccess(feature);
        expect(result.allowed).toBe(true);
      });
    });
  });

  describe("checkUsageLimit", () => {
    beforeEach(() => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });
    });

    it("should allow usage within limits", () => {
      const result = service.checkUsageLimit("tokensPerMonth", 1);
      expect(result.allowed).toBe(true);
      expect(result.usageInfo).toBeDefined();
      expect(result.usageInfo?.current).toBe(1);
    });

    it("should deny usage when limit is exceeded", () => {
      // Increment usage to the limit
      const entitlement = service.getEntitlement();
      const limit = entitlement?.limits.tokensPerMonth || 0;

      for (let i = 0; i < limit; i++) {
        service.incrementUsage("tokensPerMonth");
      }

      const result = service.checkUsageLimit("tokensPerMonth", 1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("reached your");
      expect(result.usageInfo?.current).toBe(limit);
      expect(result.usageInfo?.limit).toBe(limit);
    });

    it("should always allow unlimited features", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_enterprise_monthly",
      });

      const result = service.checkUsageLimit("tokensPerMonth", 1000);
      expect(result.allowed).toBe(true);
    });

    it("should calculate usage percentage correctly", () => {
      service.incrementUsage("tokensPerMonth", 5); // Basic has 10 tokens/month

      const result = service.checkUsageLimit("tokensPerMonth", 1);
      expect(result.usageInfo?.percentage).toBe(60); // (5+1)/10 * 100 = 60%
    });
  });

  describe("incrementUsage", () => {
    beforeEach(() => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });
    });

    it("should increment usage counter", () => {
      service.incrementUsage("tokensPerMonth", 1);
      
      const entitlement = service.getEntitlement();
      expect(entitlement?.usage.tokensThisMonth).toBe(1);
    });

    it("should increment by specified amount", () => {
      service.incrementUsage("deploymentPerDay", 5);
      
      const entitlement = service.getEntitlement();
      expect(entitlement?.usage.deploymentsToday).toBe(5);
    });

    it("should accumulate increments", () => {
      service.incrementUsage("tokensPerMonth", 2);
      service.incrementUsage("tokensPerMonth", 3);
      
      const entitlement = service.getEntitlement();
      expect(entitlement?.usage.tokensThisMonth).toBe(5);
    });
  });

  describe("getUpgradePrompt", () => {
    beforeEach(() => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });
    });

    it("should provide upgrade prompt for restricted feature", () => {
      const prompt = service.getUpgradePrompt(FeatureFlag.TOKEN_CREATION_ARC200);

      expect(prompt.title).toContain("Upgrade");
      expect(prompt.message).toBeDefined();
      expect(prompt.targetTier).toBe(SubscriptionTier.PRO);
      expect(prompt.features).toBeInstanceOf(Array);
      expect(prompt.features.length).toBeGreaterThan(0);
      expect(prompt.ctaText).toBeDefined();
      expect(prompt.ctaLink).toBe("/subscription");
    });

    it("should suggest correct tier for feature", () => {
      const prompt = service.getUpgradePrompt(FeatureFlag.COMPLIANCE_MICA);
      expect(prompt.targetTier).toBe(SubscriptionTier.PRO);
    });
  });

  describe("getUsagePercentage", () => {
    beforeEach(() => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });
    });

    it("should return null for unlimited features", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_enterprise_monthly",
      });

      const percentage = service.getUsagePercentage("tokensPerMonth");
      expect(percentage).toBeNull();
    });

    it("should calculate percentage correctly", () => {
      service.incrementUsage("tokensPerMonth", 5); // Basic has 10 limit

      const percentage = service.getUsagePercentage("tokensPerMonth");
      expect(percentage).toBe(50);
    });

    it("should return 0 for unused limits", () => {
      const percentage = service.getUsagePercentage("tokensPerMonth");
      expect(percentage).toBe(0);
    });
  });

  describe("isNearLimit", () => {
    beforeEach(() => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });
    });

    it("should return false when usage is low", () => {
      service.incrementUsage("tokensPerMonth", 2); // 20% of 10

      const isNear = service.isNearLimit("tokensPerMonth");
      expect(isNear).toBe(false);
    });

    it("should return true when usage is above 80%", () => {
      service.incrementUsage("tokensPerMonth", 9); // 90% of 10

      const isNear = service.isNearLimit("tokensPerMonth");
      expect(isNear).toBe(true);
    });

    it("should return false for unlimited features", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_enterprise_monthly",
      });

      const isNear = service.isNearLimit("tokensPerMonth");
      expect(isNear).toBe(false);
    });
  });

  describe("resetUsage", () => {
    beforeEach(() => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_basic_monthly",
      });
    });

    it("should reset monthly counters", () => {
      service.incrementUsage("tokensPerMonth", 5);
      service.incrementUsage("attestationsPerMonth", 10);

      service.resetUsage();

      const entitlement = service.getEntitlement();
      expect(entitlement?.usage.tokensThisMonth).toBe(0);
      expect(entitlement?.usage.attestationsThisMonth).toBe(0);
    });

    it("should reset daily counters", () => {
      service.incrementUsage("deploymentPerDay", 5);
      service.incrementUsage("apiCallsPerDay", 50);

      service.resetUsage();

      const entitlement = service.getEntitlement();
      expect(entitlement?.usage.deploymentsToday).toBe(0);
      expect(entitlement?.usage.apiCallsToday).toBe(0);
    });

    it("should not reset permanent counters", () => {
      service.incrementUsage("whitelistAddresses", 500);

      service.resetUsage();

      const entitlement = service.getEntitlement();
      expect(entitlement?.usage.whitelistAddresses).toBe(500);
    });

    it("should update period dates", () => {
      const beforeReset = service.getEntitlement()?.usage.periodStart;

      service.resetUsage();

      const afterReset = service.getEntitlement()?.usage.periodStart;
      expect(afterReset).toBeDefined();
      expect(afterReset?.getTime()).toBeGreaterThanOrEqual(beforeReset?.getTime() || 0);
    });
  });

  describe("determineTierFromSubscription — uncovered branches", () => {
    it("should return FREE for a price_id that matches no known tier keyword", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_unknown_plan_xyz",
      });
      const entitlement = service.getEntitlement();
      expect(entitlement?.tier).toBe(SubscriptionTier.FREE);
    });

    it("should return FREE for a subscription with undefined price_id", () => {
      service.initialize({
        subscription_status: "active",
        price_id: undefined,
      });
      const entitlement = service.getEntitlement();
      expect(entitlement?.tier).toBe(SubscriptionTier.FREE);
    });
  });

  describe("findMinimumTierForFeature — ENTERPRISE fallback", () => {
    it("should return ENTERPRISE when feature is not in any tier config", () => {
      // Cast an unknown feature string so findMinimumTierForFeature exhausts all tiers
      const unknownFeature = "nonexistent_feature_xyz_abc" as FeatureFlag;
      // getUpgradePrompt calls findMinimumTierForFeature internally
      const prompt = service.getUpgradePrompt(unknownFeature);
      // The prompt title should reflect ENTERPRISE as the required tier
      expect(prompt.title.toLowerCase()).toContain("enterprise");
    });
  });

  describe("findNextTier — edge cases", () => {
    it("should return BASIC when currentEntitlement is null (no subscription)", () => {
      // Re-create instance; do not call initialize → currentEntitlement stays null
      const freshService = new (EntitlementService as any)();
      // checkUsageLimit with a limit exceeded calls findNextTier internally
      // Since there is no entitlement, checkUsageLimit returns allowed:false with upgradeRequired BASIC (line 111)
      const result = freshService.checkUsageLimit("tokensPerMonth", 1);
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(SubscriptionTier.BASIC);
    });

    it("should return ENTERPRISE when current tier is already ENTERPRISE (no higher tier)", () => {
      service.initialize({
        subscription_status: "active",
        price_id: "price_enterprise_yearly",
      });
      // Force usage to exceed the limit so findNextTier is invoked
      const entitlement = service.getEntitlement()!;
      // Set a finite limit so we can exceed it
      entitlement.limits.tokensPerMonth = 1;
      entitlement.usage.tokensThisMonth = 1;
      const result = service.checkUsageLimit("tokensPerMonth", 1);
      expect(result.allowed).toBe(false);
      // At ENTERPRISE there is no higher tier — findNextTier returns ENTERPRISE
      expect(result.upgradeRequired).toBe(SubscriptionTier.ENTERPRISE);
    });
  });

  describe("determineTierFromSubscription — null subscriptionData branch (line 248)", () => {
    it("should return FREE when subscriptionData is null (line 248 first condition)", () => {
      // Calling initialize with null triggers determineTierFromSubscription(null)
      // which hits the !subscriptionData branch (line 248)
      service.initialize(null as any);
      const entitlement = service.getEntitlement();
      expect(entitlement?.tier).toBe(SubscriptionTier.FREE);
    });

    it("should return FREE when subscriptionData is undefined (line 248 first condition)", () => {
      service.initialize(undefined as any);
      const entitlement = service.getEntitlement();
      expect(entitlement?.tier).toBe(SubscriptionTier.FREE);
    });
  });

  describe("getFeatureDescriptions — all feature flags covered (lines 340-342)", () => {
    it("covers CUSTOM_BRANDING, PRIORITY_SUPPORT, ADVANCED_ANALYTICS descriptions via ENTERPRISE upgrade prompt", () => {
      // getFeatureDescriptions is private — call it directly via (service as any)
      // to exercise the lookup paths for lines 340-342
      const svc = service as any;
      const descriptions = svc.getFeatureDescriptions([
        FeatureFlag.CUSTOM_BRANDING,
        FeatureFlag.PRIORITY_SUPPORT,
        FeatureFlag.ADVANCED_ANALYTICS,
      ]);
      expect(descriptions).toContain("Custom branding");
      expect(descriptions).toContain("Priority support");
      expect(descriptions).toContain("Advanced analytics");
    });

    it("covers || f fallback when feature not in descriptions object (line 351)", () => {
      const svc = service as any;
      const unknownFlag = "unknown_flag_for_test" as any;
      const descriptions = svc.getFeatureDescriptions([unknownFlag]);
      expect(descriptions).toContain(unknownFlag);
    });
  });
});
