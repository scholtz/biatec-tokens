/**
 * Entitlement Service
 * Manages feature access, usage tracking, and subscription tier logic
 */

import {
  SubscriptionTier,
  FeatureFlag,
  type Entitlement,
  type FeatureAccessResult,
  type UsageLimits,
  type CurrentUsage,
  type UpgradePrompt,
  TIER_CONFIGS,
} from "../types/entitlement";
import { telemetryService } from "./TelemetryService";

export class EntitlementService {
  private static instance: EntitlementService;
  private currentEntitlement: Entitlement | null = null;

  private constructor() {}

  static getInstance(): EntitlementService {
    if (!EntitlementService.instance) {
      EntitlementService.instance = new EntitlementService();
    }
    return EntitlementService.instance;
  }

  /**
   * Initialize entitlement from subscription data
   */
  initialize(subscriptionData: any): void {
    // In a real implementation, this would fetch from backend
    // For now, we'll create a default entitlement based on subscription status
    const tier = this.determineTierFromSubscription(subscriptionData);
    const config = TIER_CONFIGS[tier];

    this.currentEntitlement = {
      tier,
      features: config.features,
      limits: config.limits,
      usage: this.createDefaultUsage(),
      isActive: subscriptionData?.subscription_status === "active" || tier === SubscriptionTier.FREE,
      expiresAt: subscriptionData?.current_period_end ? new Date(subscriptionData.current_period_end * 1000) : null,
    };

    telemetryService.track("entitlement_initialized", {
      tier,
      feature_count: config.features.length,
      is_active: this.currentEntitlement.isActive,
    });
  }

  /**
   * Get current entitlement
   */
  getEntitlement(): Entitlement | null {
    return this.currentEntitlement;
  }

  /**
   * Check if user has access to a feature
   */
  checkFeatureAccess(feature: FeatureFlag): FeatureAccessResult {
    if (!this.currentEntitlement) {
      return {
        allowed: false,
        reason: "No active subscription. Please subscribe to access this feature.",
        upgradeRequired: SubscriptionTier.BASIC,
      };
    }

    if (!this.currentEntitlement.isActive) {
      return {
        allowed: false,
        reason: "Your subscription is not active. Please renew to continue.",
        upgradeRequired: this.currentEntitlement.tier,
      };
    }

    // Check if feature is included in tier
    if (!this.currentEntitlement.features.includes(feature)) {
      const requiredTier = this.findMinimumTierForFeature(feature);
      return {
        allowed: false,
        reason: `This feature requires ${requiredTier} tier or higher.`,
        upgradeRequired: requiredTier,
      };
    }

    // Track feature access attempt
    telemetryService.track("feature_access_check", {
      feature,
      tier: this.currentEntitlement.tier,
      allowed: true,
    });

    return { allowed: true };
  }

  /**
   * Check usage against limits
   */
  checkUsageLimit(limitKey: keyof UsageLimits, increment: number = 1): FeatureAccessResult {
    if (!this.currentEntitlement) {
      return {
        allowed: false,
        reason: "No active subscription.",
        upgradeRequired: SubscriptionTier.BASIC,
      };
    }

    const limit = this.currentEntitlement.limits[limitKey];
    
    // Null means unlimited
    if (limit === null) {
      return { allowed: true };
    }

    // Map limit keys to usage keys
    const usageKey = this.mapLimitToUsageKey(limitKey);
    const currentUsage = this.currentEntitlement.usage[usageKey] as number;
    const newUsage = currentUsage + increment;

    if (newUsage > limit) {
      const percentage = (currentUsage / limit) * 100;
      return {
        allowed: false,
        reason: `You have reached your ${limitKey} limit of ${limit}.`,
        upgradeRequired: this.findNextTier(),
        usageInfo: {
          current: currentUsage,
          limit,
          percentage,
        },
      };
    }

    const percentage = (newUsage / limit) * 100;

    return {
      allowed: true,
      usageInfo: {
        current: newUsage,
        limit,
        percentage,
      },
    };
  }

  /**
   * Increment usage counter
   */
  incrementUsage(limitKey: keyof UsageLimits, amount: number = 1): void {
    if (!this.currentEntitlement) {
      return;
    }

    const usageKey = this.mapLimitToUsageKey(limitKey);
    const currentValue = this.currentEntitlement.usage[usageKey] as number;
    (this.currentEntitlement.usage[usageKey] as number) = currentValue + amount;

    // Track usage increment
    telemetryService.track("usage_incremented", {
      limit_key: limitKey,
      amount,
      new_value: this.currentEntitlement.usage[usageKey],
      tier: this.currentEntitlement.tier,
    });
  }

  /**
   * Get upgrade prompt for a feature
   */
  getUpgradePrompt(feature: FeatureFlag): UpgradePrompt {
    const requiredTier = this.findMinimumTierForFeature(feature);
    const config = TIER_CONFIGS[requiredTier];

    return {
      title: `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}`,
      message: `This feature requires a ${requiredTier} subscription or higher.`,
      targetTier: requiredTier,
      features: this.getFeatureDescriptions(config.features.slice(0, 5)), // Show top 5 features
      ctaText: `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}`,
      ctaLink: "/subscription",
    };
  }

  /**
   * Get usage percentage for a limit
   */
  getUsagePercentage(limitKey: keyof UsageLimits): number | null {
    if (!this.currentEntitlement) {
      return null;
    }

    const limit = this.currentEntitlement.limits[limitKey];
    if (limit === null) {
      return null; // Unlimited
    }

    const usageKey = this.mapLimitToUsageKey(limitKey);
    const current = this.currentEntitlement.usage[usageKey] as number;

    return (current / limit) * 100;
  }

  /**
   * Check if usage is near limit (>80%)
   */
  isNearLimit(limitKey: keyof UsageLimits): boolean {
    const percentage = this.getUsagePercentage(limitKey);
    return percentage !== null && percentage > 80;
  }

  /**
   * Reset usage counters (called at period boundaries)
   */
  resetUsage(): void {
    if (!this.currentEntitlement) {
      return;
    }

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfMonth = new Date(nextMonth.getTime() - 1); // Last millisecond of current month
    
    this.currentEntitlement.usage = {
      tokensThisMonth: 0,
      deploymentsToday: 0,
      whitelistAddresses: this.currentEntitlement.usage.whitelistAddresses, // Don't reset
      attestationsThisMonth: 0,
      apiCallsToday: 0,
      periodStart: now,
      periodEnd: endOfMonth,
    };

    telemetryService.track("usage_reset", {
      tier: this.currentEntitlement.tier,
    });
  }

  // Private helper methods

  private determineTierFromSubscription(subscriptionData: any): SubscriptionTier {
    if (!subscriptionData || subscriptionData.subscription_status === "not_started") {
      return SubscriptionTier.FREE;
    }

    // Map price_id to tier (this would come from your stripe-config in real implementation)
    const priceId = subscriptionData.price_id;
    if (priceId?.includes("enterprise")) {
      return SubscriptionTier.ENTERPRISE;
    }
    if (priceId?.includes("pro")) {
      return SubscriptionTier.PRO;
    }
    if (priceId?.includes("basic")) {
      return SubscriptionTier.BASIC;
    }

    return SubscriptionTier.FREE;
  }

  private createDefaultUsage(): CurrentUsage {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfMonth = new Date(nextMonth.getTime() - 1); // Last millisecond of current month
    
    return {
      tokensThisMonth: 0,
      deploymentsToday: 0,
      whitelistAddresses: 0,
      attestationsThisMonth: 0,
      apiCallsToday: 0,
      periodStart: now,
      periodEnd: endOfMonth,
    };
  }

  private findMinimumTierForFeature(feature: FeatureFlag): SubscriptionTier {
    const tiers = [SubscriptionTier.FREE, SubscriptionTier.BASIC, SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE];

    for (const tier of tiers) {
      if (TIER_CONFIGS[tier].features.includes(feature)) {
        return tier;
      }
    }

    return SubscriptionTier.ENTERPRISE;
  }

  private findNextTier(): SubscriptionTier {
    if (!this.currentEntitlement) {
      return SubscriptionTier.BASIC;
    }

    const tiers = [SubscriptionTier.FREE, SubscriptionTier.BASIC, SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE];
    const currentIndex = tiers.indexOf(this.currentEntitlement.tier);

    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }

    return SubscriptionTier.ENTERPRISE;
  }

  private mapLimitToUsageKey(limitKey: keyof UsageLimits): keyof Omit<CurrentUsage, 'periodStart' | 'periodEnd'> {
    const mapping: Record<keyof UsageLimits, keyof Omit<CurrentUsage, 'periodStart' | 'periodEnd'>> = {
      tokensPerMonth: "tokensThisMonth",
      deploymentPerDay: "deploymentsToday",
      whitelistAddresses: "whitelistAddresses",
      attestationsPerMonth: "attestationsThisMonth",
      apiCallsPerDay: "apiCallsToday",
    };

    return mapping[limitKey];
  }

  private getFeatureDescriptions(features: FeatureFlag[]): string[] {
    const descriptions: Record<FeatureFlag, string> = {
      [FeatureFlag.TOKEN_CREATION_ASA]: "Create Algorand Standard Assets (ASA)",
      [FeatureFlag.TOKEN_CREATION_ARC3]: "Create ARC-3 NFTs",
      [FeatureFlag.TOKEN_CREATION_ARC19]: "Create ARC-19 tokens",
      [FeatureFlag.TOKEN_CREATION_ARC69]: "Create ARC-69 NFTs",
      [FeatureFlag.TOKEN_CREATION_ARC200]: "Create ARC-200 tokens",
      [FeatureFlag.TOKEN_CREATION_ARC72]: "Create ARC-72 NFTs",
      [FeatureFlag.TOKEN_CREATION_ERC20]: "Create ERC-20 tokens",
      [FeatureFlag.TOKEN_CREATION_ERC721]: "Create ERC-721 NFTs",
      [FeatureFlag.COMPLIANCE_WHITELIST]: "Whitelist management",
      [FeatureFlag.COMPLIANCE_BLACKLIST]: "Blacklist management",
      [FeatureFlag.COMPLIANCE_KYC]: "KYC integration",
      [FeatureFlag.COMPLIANCE_ATTESTATIONS]: "Compliance attestations",
      [FeatureFlag.COMPLIANCE_MICA]: "MiCA compliance tools",
      [FeatureFlag.COMPLIANCE_EXPORT]: "Compliance data export",
      [FeatureFlag.BATCH_DEPLOYMENT]: "Batch token deployment",
      [FeatureFlag.API_ACCESS]: "API access",
      [FeatureFlag.CUSTOM_BRANDING]: "Custom branding",
      [FeatureFlag.PRIORITY_SUPPORT]: "Priority support",
      [FeatureFlag.ADVANCED_ANALYTICS]: "Advanced analytics",
      [FeatureFlag.NETWORK_VOI]: "VOI network support",
      [FeatureFlag.NETWORK_ARAMID]: "Aramid network support",
      [FeatureFlag.NETWORK_ETHEREUM]: "Ethereum network support",
      [FeatureFlag.NETWORK_ARBITRUM]: "Arbitrum network support",
      [FeatureFlag.NETWORK_BASE]: "Base network support",
      [FeatureFlag.NETWORK_TESTNET]: "Testnet access",
    };

    return features.map((f) => descriptions[f] || f);
  }
}

export const entitlementService = EntitlementService.getInstance();
