<template>
  <MicaSummaryWidget
    title="Network Health"
    subtitle="VOI & Aramid network status"
    icon="pi pi-server"
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
          <div class="text-sm text-gray-400">Overall Status</div>
          <div class="text-2xl font-bold" :class="getOverallHealthColor">
            {{ getOverallHealthLabel }}
          </div>
        </div>

        <div v-for="network in metrics.networks" :key="network.network" class="flex items-center justify-between text-sm">
          <span class="text-gray-400 flex items-center gap-2">
            <span :class="['w-2 h-2 rounded-full', getNetworkStatusDotColor(network.status)]"></span>
            {{ network.network }}
          </span>
          <div class="flex items-center gap-2">
            <span :class="['font-medium', getNetworkStatusTextColor(network.status)]">
              {{ getNetworkStatusLabel(network.status) }}
            </span>
            <span v-if="network.responseTime" class="text-gray-500 text-xs">
              {{ network.responseTime }}ms
            </span>
          </div>
        </div>

        <div v-if="hasIssues" class="pt-2 border-t border-white/10">
          <div class="text-xs text-orange-400 flex items-start gap-1">
            <i class="pi pi-info-circle mt-0.5"></i>
            <span>Network issues detected</span>
          </div>
        </div>

        <div v-else class="pt-2 border-t border-white/10">
          <div class="text-xs text-green-400 flex items-center gap-1">
            <i class="pi pi-check-circle"></i>
            <span>All networks operational</span>
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
import type { NetworkHealthMetrics } from "../types/compliance";

defineEmits<{
  "view-details": [];
}>();

const metrics = ref<NetworkHealthMetrics | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const getIconColor = computed(() => {
  if (!metrics.value) return "blue";
  switch (metrics.value.overallHealth) {
    case "healthy":
      return "green";
    case "degraded":
      return "yellow";
    case "critical":
      return "orange";
    default:
      return "blue";
  }
});

const getOverallHealthColor = computed(() => {
  if (!metrics.value) return "text-gray-400";
  switch (metrics.value.overallHealth) {
    case "healthy":
      return "text-green-400";
    case "degraded":
      return "text-yellow-400";
    case "critical":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
});

const getOverallHealthLabel = computed(() => {
  if (!metrics.value) return "Unknown";
  switch (metrics.value.overallHealth) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    case "critical":
      return "Critical";
    default:
      return "Unknown";
  }
});

const hasIssues = computed(() => {
  return metrics.value?.networks.some((n) => n.issues && n.issues.length > 0) || false;
});

const getNetworkStatusDotColor = (status: string) => {
  switch (status) {
    case "operational":
      return "bg-green-500";
    case "degraded":
      return "bg-yellow-500";
    case "down":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getNetworkStatusTextColor = (status: string) => {
  switch (status) {
    case "operational":
      return "text-green-400";
    case "degraded":
      return "text-yellow-400";
    case "down":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

const getNetworkStatusLabel = (status: string) => {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
    default:
      return "Unknown";
  }
};

const loadMetrics = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    metrics.value = await complianceService.getNetworkHealth();
    
    // Track analytics event
    if ((window as any).gtag) {
      (window as any).gtag("event", "compliance_widget_view", {
        widget_type: "network_health",
      });
    }
  } catch (err) {
    console.error("Failed to load network health:", err);
    error.value = "Failed to load metrics";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadMetrics();
});
</script>
