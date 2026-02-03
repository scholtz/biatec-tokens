/**
 * Entitlement composable
 * Provides easy access to entitlement checking in components
 */

import { computed, onMounted } from "vue";
import { useSubscriptionStore } from "../stores/subscription";
import { entitlementService } from "../services/EntitlementService";
import { FeatureFlag, type UsageLimits } from "../types/entitlement";

export function useEntitlement() {
  const subscriptionStore = useSubscriptionStore();

  // Initialize entitlement service when subscription changes
  onMounted(() => {
    if (subscriptionStore.subscription) {
      entitlementService.initialize(subscriptionStore.subscription);
    }
  });

  // Reactive entitlement
  const entitlement = computed(() => entitlementService.getEntitlement());

  /**
   * Check if user has access to a feature
   */
  const hasFeature = (feature: FeatureFlag): boolean => {
    const result = entitlementService.checkFeatureAccess(feature);
    return result.allowed;
  };

  /**
   * Check if user can perform an action (usage limit)
   */
  const canUse = (limitKey: keyof UsageLimits, increment: number = 1): boolean => {
    const result = entitlementService.checkUsageLimit(limitKey, increment);
    return result.allowed;
  };

  /**
   * Get feature access result with details
   */
  const checkFeature = (feature: FeatureFlag) => {
    return entitlementService.checkFeatureAccess(feature);
  };

  /**
   * Get usage limit result with details
   */
  const checkUsage = (limitKey: keyof UsageLimits, increment: number = 1) => {
    return entitlementService.checkUsageLimit(limitKey, increment);
  };

  /**
   * Track usage for a limit
   */
  const trackUsage = (limitKey: keyof UsageLimits, amount: number = 1) => {
    entitlementService.incrementUsage(limitKey, amount);
  };

  /**
   * Get usage percentage for a limit
   */
  const getUsagePercentage = (limitKey: keyof UsageLimits): number | null => {
    return entitlementService.getUsagePercentage(limitKey);
  };

  /**
   * Check if near limit (>80%)
   */
  const isNearLimit = (limitKey: keyof UsageLimits): boolean => {
    return entitlementService.isNearLimit(limitKey);
  };

  /**
   * Get upgrade prompt for feature
   */
  const getUpgradePrompt = (feature: FeatureFlag) => {
    return entitlementService.getUpgradePrompt(feature);
  };

  /**
   * Reinitialize entitlement (e.g., after subscription update)
   */
  const refreshEntitlement = () => {
    if (subscriptionStore.subscription) {
      entitlementService.initialize(subscriptionStore.subscription);
    }
  };

  return {
    // State
    entitlement,

    // Feature checks
    hasFeature,
    checkFeature,
    getUpgradePrompt,

    // Usage checks
    canUse,
    checkUsage,
    trackUsage,
    getUsagePercentage,
    isNearLimit,

    // Actions
    refreshEntitlement,
  };
}
