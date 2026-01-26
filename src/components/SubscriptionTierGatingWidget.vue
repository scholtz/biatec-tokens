<template>
  <MicaSummaryWidget
    title="Subscription Tier"
    subtitle="Feature access and gating"
    icon="pi pi-star"
    :icon-color="getTierIconColor"
    :last-updated="metrics?.lastUpdated"
    :has-details="true"
    @view-details="$emit('view-details')"
  >
    <template #content>
      <div v-if="isLoading" class="animate-pulse space-y-2">
        <div class="h-8 bg-white/5 rounded w-24"></div>
        <div class="h-4 bg-white/5 rounded w-32"></div>
      </div>

      <div v-else-if="error" class="text-sm text-red-400">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        {{ error }}
      </div>

      <div v-else-if="metrics" class="space-y-2">
        <div>
          <div class="text-sm text-gray-400">Current Tier</div>
          <div class="text-2xl font-bold" :class="getTierColor">
            {{ getTierLabel }}
          </div>
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Total Features</span>
          <span class="text-white font-medium">
            {{ metrics.features.length }}
          </span>
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Enabled</span>
          <span class="text-green-400 font-medium">
            {{ enabledFeaturesCount }}
          </span>
        </div>

        <div v-if="metrics.upgradableFeatures > 0" class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Locked</span>
          <span class="text-orange-400 font-medium">
            {{ metrics.upgradableFeatures }}
          </span>
        </div>

        <div v-if="metrics.upgradableFeatures > 0" class="pt-2 border-t border-white/10">
          <button
            @click="$emit('upgrade-tier')"
            class="w-full px-3 py-1.5 bg-biatec-accent/20 hover:bg-biatec-accent/30 text-biatec-accent rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <i class="pi pi-arrow-up"></i>
            <span>Upgrade to unlock {{ metrics.upgradableFeatures }} features</span>
          </button>
        </div>

        <div v-else class="pt-2 border-t border-white/10">
          <div class="text-xs text-green-400 flex items-center gap-1">
            <i class="pi pi-check-circle"></i>
            <span>All features unlocked</span>
          </div>
        </div>
      </div>

      <div v-else class="text-sm text-gray-400">
        No data available
      </div>
    </template>
  </MicaSummaryWidget>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import MicaSummaryWidget from "./MicaSummaryWidget.vue";
import { complianceService } from "../services/ComplianceService";
import { useSubscriptionStore } from "../stores/subscription";
import type { SubscriptionTierGatingMetrics } from "../types/compliance";

defineEmits<{
  "view-details": [];
  "upgrade-tier": [];
}>();

const subscriptionStore = useSubscriptionStore();
const metrics = ref<SubscriptionTierGatingMetrics | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const getTierIconColor = computed(() => {
  if (!metrics.value) return "blue";
  switch (metrics.value.currentTier) {
    case "enterprise":
      return "purple";
    case "professional":
      return "blue";
    case "free":
      return "blue";
    default:
      return "blue";
  }
});

const getTierColor = computed(() => {
  if (!metrics.value) return "text-gray-400";
  switch (metrics.value.currentTier) {
    case "enterprise":
      return "text-purple-400";
    case "professional":
      return "text-blue-400";
    case "free":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
});

const getTierLabel = computed(() => {
  if (!metrics.value) return "Unknown";
  switch (metrics.value.currentTier) {
    case "enterprise":
      return "Enterprise";
    case "professional":
      return "Professional";
    case "free":
      return "Free";
    default:
      return "Unknown";
  }
});

const enabledFeaturesCount = computed(() => {
  return metrics.value?.features.filter((f) => f.enabled).length || 0;
});

const loadMetrics = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // Determine current tier from subscription store
    const currentTier = subscriptionStore.isActive
      ? subscriptionStore.currentProduct?.name.toLowerCase().includes("enterprise")
        ? "enterprise"
        : "professional"
      : "free";

    metrics.value = await complianceService.getSubscriptionTierGating(currentTier);
    
    // Track analytics event
    if ((window as any).gtag) {
      (window as any).gtag("event", "compliance_widget_view", {
        widget_type: "subscription_tier_gating",
        current_tier: currentTier,
      });
    }
  } catch (err) {
    console.error("Failed to load subscription tier gating:", err);
    error.value = "Failed to load metrics";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  subscriptionStore.fetchSubscription();
  loadMetrics();
});
</script>
