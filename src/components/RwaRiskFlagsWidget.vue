<template>
  <MicaSummaryWidget
    title="RWA Risk Flags"
    subtitle="Compliance risk indicators"
    icon="pi pi-exclamation-triangle"
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
          <div class="text-sm text-gray-400">Total Flags</div>
          <div class="text-2xl font-bold" :class="getTotalFlagsColor">
            {{ metrics.totalFlags }}
          </div>
        </div>

        <div v-if="metrics.criticalFlags > 0" class="flex items-center justify-between text-sm">
          <span class="text-gray-400 flex items-center gap-1">
            <span class="w-2 h-2 bg-red-500 rounded-full"></span>
            Critical
          </span>
          <span class="text-red-400 font-medium">
            {{ metrics.criticalFlags }}
          </span>
        </div>

        <div v-if="metrics.highFlags > 0" class="flex items-center justify-between text-sm">
          <span class="text-gray-400 flex items-center gap-1">
            <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
            High
          </span>
          <span class="text-orange-400 font-medium">
            {{ metrics.highFlags }}
          </span>
        </div>

        <div v-if="metrics.mediumFlags > 0" class="flex items-center justify-between text-sm">
          <span class="text-gray-400 flex items-center gap-1">
            <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Medium
          </span>
          <span class="text-yellow-400 font-medium">
            {{ metrics.mediumFlags }}
          </span>
        </div>

        <div v-if="metrics.lowFlags > 0" class="flex items-center justify-between text-sm">
          <span class="text-gray-400 flex items-center gap-1">
            <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
            Low
          </span>
          <span class="text-blue-400 font-medium">
            {{ metrics.lowFlags }}
          </span>
        </div>

        <div v-if="metrics.totalFlags === 0" class="pt-2 border-t border-white/10">
          <div class="text-xs text-green-400 flex items-center gap-1">
            <i class="pi pi-check-circle"></i>
            <span>No active risk flags</span>
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
import type { RwaRiskFlagsMetrics } from "../types/compliance";

interface Props {
  network?: string;
}

const props = defineProps<Props>();

defineEmits<{
  "view-details": [];
}>();

const metrics = ref<RwaRiskFlagsMetrics | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const getIconColor = computed(() => {
  if (!metrics.value) return "blue";
  if (metrics.value.criticalFlags > 0) return "pink";
  if (metrics.value.highFlags > 0) return "orange";
  if (metrics.value.mediumFlags > 0) return "yellow";
  if (metrics.value.lowFlags > 0) return "blue";
  return "green";
});

const getTotalFlagsColor = computed(() => {
  if (!metrics.value) return "text-white";
  if (metrics.value.criticalFlags > 0) return "text-red-400";
  if (metrics.value.highFlags > 0) return "text-orange-400";
  if (metrics.value.mediumFlags > 0) return "text-yellow-400";
  if (metrics.value.totalFlags === 0) return "text-green-400";
  return "text-white";
});

const loadMetrics = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    metrics.value = await complianceService.getRwaRiskFlags(props.network);
    
    // Track analytics event
    if ((window as any).gtag) {
      (window as any).gtag("event", "compliance_widget_view", {
        widget_type: "rwa_risk_flags",
        network: props.network,
      });
    }
  } catch (err) {
    console.error("Failed to load RWA risk flags:", err);
    error.value = "Failed to load metrics";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadMetrics();
});
</script>
