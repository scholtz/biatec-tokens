<template>
  <MicaSummaryWidget
    title="Whitelist Coverage"
    subtitle="KYC/AML compliant addresses"
    icon="pi pi-shield-check"
    :icon-color="getIconColor"
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
          <div class="text-sm text-gray-400">Coverage</div>
          <div class="text-2xl font-bold text-white">
            {{ metrics.coveragePercentage.toFixed(1) }}%
          </div>
        </div>
        
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Total Addresses</span>
          <span class="text-white font-medium">
            {{ metrics.totalAddresses.toLocaleString("en-US") }}
          </span>
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Active</span>
          <span class="text-green-400 font-medium">
            {{ metrics.activeAddresses.toLocaleString("en-US") }}
          </span>
        </div>

        <div v-if="metrics.pendingAddresses > 0" class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Pending</span>
          <span class="text-yellow-400 font-medium">
            {{ metrics.pendingAddresses }}
          </span>
        </div>

        <div v-if="metrics.recentlyAdded > 0" class="flex items-center justify-between text-sm pt-2 border-t border-white/10">
          <span class="text-gray-400">Added (24h)</span>
          <span class="text-green-400 font-medium">
            +{{ metrics.recentlyAdded }}
          </span>
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
import type { WhitelistCoverageMetrics } from "../types/compliance";

interface Props {
  tokenId: string;
  network: string;
}

const props = defineProps<Props>();

defineEmits<{
  "view-details": [];
}>();

const metrics = ref<WhitelistCoverageMetrics | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const getIconColor = computed(() => {
  if (!metrics.value) return "blue";
  if (metrics.value.coveragePercentage >= 90) return "green";
  if (metrics.value.coveragePercentage >= 70) return "yellow";
  return "orange";
});

const loadMetrics = async () => {
  if (!props.tokenId) return;

  isLoading.value = true;
  error.value = null;

  try {
    metrics.value = await complianceService.getWhitelistCoverageMetrics(props.tokenId, props.network);
    
    // Track analytics event
    if ((window as any).gtag) {
      (window as any).gtag("event", "compliance_widget_view", {
        widget_type: "whitelist_coverage",
        token_id: props.tokenId,
        network: props.network,
      });
    }
  } catch (err) {
    console.error("Failed to load whitelist coverage metrics:", err);
    error.value = "Failed to load metrics";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadMetrics();
});
</script>
