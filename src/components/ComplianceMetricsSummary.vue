<template>
  <div class="compliance-metrics-summary">
    <!-- Summary Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Assets Card -->
      <Card variant="glass" class="metric-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Assets
            </div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ totalAssets }}
            </div>
          </div>
          <div class="p-3 rounded-lg bg-blue-500/20">
            <i class="pi pi-wallet text-blue-600 dark:text-blue-400 text-xl"></i>
          </div>
        </div>
      </Card>

      <!-- Compliant Assets Card -->
      <Card variant="glass" class="metric-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Compliant Assets
            </div>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ compliantAssets }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ compliantPercentage }}% of total
            </div>
          </div>
          <div class="p-3 rounded-lg bg-green-500/20">
            <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-xl"></i>
          </div>
        </div>
      </Card>

      <!-- MICA Ready Assets Card -->
      <Card variant="glass" class="metric-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              MICA Ready
            </div>
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ micaReadyAssets }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              EU compliant
            </div>
          </div>
          <div class="p-3 rounded-lg bg-purple-500/20">
            <i class="pi pi-shield text-purple-600 dark:text-purple-400 text-xl"></i>
          </div>
        </div>
      </Card>

      <!-- Restricted Assets Card -->
      <Card variant="glass" class="metric-card">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Restricted Assets
            </div>
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {{ restrictedAssets }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Transfer controls
            </div>
          </div>
          <div class="p-3 rounded-lg bg-orange-500/20">
            <i class="pi pi-lock text-orange-600 dark:text-orange-400 text-xl"></i>
          </div>
        </div>
      </Card>
    </div>

    <!-- Network Breakdown -->
    <div v-if="showNetworkBreakdown" class="mt-6">
      <Card variant="glass">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <i class="pi pi-sitemap text-blue-600 dark:text-blue-400"></i>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
              Network Breakdown
            </h4>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- VOI Network -->
            <div
              v-for="metric in networkMetrics"
              :key="metric.network"
              class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :class="metric.network === 'VOI' ? 'bg-blue-500' : 'bg-purple-500'"
                  ></div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ metric.network }} Network
                  </span>
                </div>
                <Badge :variant="metric.totalAssets > 0 ? 'success' : 'default'" class="text-xs">
                  {{ metric.totalAssets }} assets
                </Badge>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">Compliant:</span>
                  <span class="font-medium text-green-600 dark:text-green-400">
                    {{ metric.compliantAssets }}
                  </span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">MICA Ready:</span>
                  <span class="font-medium text-purple-600 dark:text-purple-400">
                    {{ metric.micaReadyAssets }}
                  </span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">Whitelisted:</span>
                  <span class="font-medium text-yellow-600 dark:text-yellow-400">
                    {{ metric.whitelistedAssets }}
                  </span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">Restricted:</span>
                  <span class="font-medium text-orange-600 dark:text-orange-400">
                    {{ metric.restrictedAssets }}
                  </span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                  :style="{ width: `${(metric.compliantAssets / metric.totalAssets * 100) || 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Transfer Impact Notice -->
    <div v-if="hasRestrictedAssets" class="mt-4">
      <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
          <div class="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Transfer Impact:</strong> {{ restrictedAssets }} asset(s) have 
            <strong>whitelist requirements</strong> or <strong>jurisdiction restrictions</strong>. 
            Transfers may be blocked for non-whitelisted addresses. Ensure recipients are verified before 
            initiating transfers to avoid failed transactions.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import type { NetworkComplianceMetrics } from '../stores/complianceDashboard'

interface Props {
  networkMetrics: NetworkComplianceMetrics[]
  showNetworkBreakdown?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showNetworkBreakdown: true
})

const totalAssets = computed(() => {
  return props.networkMetrics.reduce((sum, metric) => sum + metric.totalAssets, 0)
})

const compliantAssets = computed(() => {
  return props.networkMetrics.reduce((sum, metric) => sum + metric.compliantAssets, 0)
})

const micaReadyAssets = computed(() => {
  return props.networkMetrics.reduce((sum, metric) => sum + metric.micaReadyAssets, 0)
})

const restrictedAssets = computed(() => {
  return props.networkMetrics.reduce((sum, metric) => sum + metric.restrictedAssets, 0)
})

const compliantPercentage = computed(() => {
  if (totalAssets.value === 0) return 0
  const percentage = Math.round((compliantAssets.value / totalAssets.value) * 100)
  // Ensure percentage is within 0-100 bounds to handle any floating point edge cases
  return Math.min(100, Math.max(0, percentage))
})

const hasRestrictedAssets = computed(() => restrictedAssets.value > 0)
</script>

<style scoped>
.compliance-metrics-summary {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.metric-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}
</style>
