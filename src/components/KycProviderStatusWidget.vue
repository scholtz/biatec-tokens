<template>
  <MicaSummaryWidget
    title="KYC Provider Integration"
    subtitle="Provider status and coverage"
    icon="pi pi-verified"
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

      <div v-else-if="metrics" class="space-y-3">
        <!-- Integration Progress -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm text-gray-400">Integration Complete</span>
            <span class="text-sm font-semibold text-white">{{ metrics.integrationComplete }}%</span>
          </div>
          <div class="w-full bg-white/10 rounded-full h-2">
            <div 
              class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              :style="{ width: `${metrics.integrationComplete}%` }"
            ></div>
          </div>
        </div>

        <!-- Coverage Summary -->
        <div class="pt-2">
          <div class="text-sm text-gray-400">Overall Coverage</div>
          <div class="text-2xl font-bold text-white">
            {{ metrics.totalCoverage.toFixed(1) }}%
          </div>
        </div>

        <!-- Provider Status List -->
        <div class="space-y-2 pt-2 border-t border-white/10">
          <div v-for="provider in metrics.providers" :key="provider.id" class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span :class="['w-2 h-2 rounded-full flex-shrink-0', getProviderStatusDotColor(provider)]"></span>
              <span class="text-gray-300 truncate">{{ provider.name }}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-if="provider.isStale" class="text-orange-400 text-xs px-1.5 py-0.5 bg-orange-500/10 rounded">
                Stale
              </span>
              <span class="text-gray-400 text-xs">{{ provider.coverage }}%</span>
            </div>
          </div>
        </div>

        <!-- Alert Status -->
        <div v-if="hasAlerts" class="pt-2 border-t border-white/10">
          <div class="text-xs text-orange-400 flex items-start gap-1">
            <i class="pi pi-exclamation-triangle mt-0.5"></i>
            <span>{{ metrics.staleProviders + metrics.failedProviders }} provider(s) need attention</span>
          </div>
        </div>

        <div v-else class="pt-2 border-t border-white/10">
          <div class="text-xs text-green-400 flex items-center gap-1">
            <i class="pi pi-check-circle"></i>
            <span>All active providers synced</span>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-3 gap-2 pt-2">
          <div class="text-center">
            <div class="text-lg font-bold text-green-400">{{ metrics.activeProviders }}</div>
            <div class="text-xs text-gray-500">Active</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-orange-400">{{ metrics.staleProviders }}</div>
            <div class="text-xs text-gray-500">Stale</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-red-400">{{ metrics.failedProviders }}</div>
            <div class="text-xs text-gray-500">Failed</div>
          </div>
        </div>

        <!-- Settings CTA -->
        <div class="pt-2">
          <button
            @click="navigateToSettings"
            class="w-full py-2 px-3 bg-biatec-accent/10 hover:bg-biatec-accent/20 border border-biatec-accent/30 rounded-lg text-sm text-biatec-accent font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i class="pi pi-cog"></i>
            <span>Configure KYC Providers</span>
          </button>
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
import { useRouter } from "vue-router";
import MicaSummaryWidget from "./MicaSummaryWidget.vue";
import { complianceService } from "../services/ComplianceService";
import type { KycProviderMetrics, KycProviderStatus } from "../types/compliance";

interface Props {
  network?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "view-details": [];
}>();

const router = useRouter();

const metrics = ref<KycProviderMetrics | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const getIconColor = computed(() => {
  if (!metrics.value) return "blue";
  
  // Orange if integration incomplete or issues present
  if (metrics.value.integrationComplete < 100 || hasAlerts.value) {
    return "orange";
  }
  
  // Green if all good
  if (metrics.value.activeProviders > 0 && !hasAlerts.value) {
    return "green";
  }
  
  return "blue";
});

const hasAlerts = computed(() => {
  return metrics.value && (metrics.value.staleProviders > 0 || metrics.value.failedProviders > 0);
});

const getProviderStatusDotColor = (provider: KycProviderStatus) => {
  if (provider.isStale || provider.status === 'error') {
    return "bg-orange-500";
  }
  
  switch (provider.status) {
    case "connected":
      return "bg-green-500";
    case "syncing":
      return "bg-blue-500 animate-pulse";
    case "disconnected":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const navigateToSettings = () => {
  router.push("/settings?tab=kyc-providers");
};

const loadMetrics = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    metrics.value = await complianceService.getKycProviderStatus(props.network);
    
    // Track analytics event
    if ((window as any).gtag) {
      (window as any).gtag("event", "compliance_widget_view", {
        widget_type: "kyc_provider_status",
      });
    }
  } catch (err) {
    console.error("Failed to load KYC provider status:", err);
    error.value = "Failed to load metrics";
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadMetrics();
});
</script>
