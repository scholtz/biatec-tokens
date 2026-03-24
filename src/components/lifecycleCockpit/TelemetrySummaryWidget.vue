<template>
  <Card variant="glass" padding="lg">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <i class="pi pi-chart-line text-2xl text-purple-400"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-white">Post-Launch Telemetry</h3>
            <p class="text-sm text-gray-400">Real-time health indicators</p>
          </div>
        </div>
      </div>

      <!-- No Token State -->
      <div v-if="!telemetry" class="text-center py-8">
        <i class="pi pi-info-circle text-4xl text-gray-500 mb-2"></i>
        <p class="text-sm text-gray-400">No token deployed yet</p>
        <p class="text-xs text-gray-500 mt-1">Telemetry will appear after token launch</p>
      </div>

      <!-- Telemetry Data -->
      <div v-else class="space-y-4">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Total Holders -->
          <div class="bg-white/5 rounded-lg p-4">
            <div class="text-sm text-gray-400 mb-1">Total Holders</div>
            <div class="text-2xl font-bold text-white">{{ formatNumber(telemetry.totalHolders) }}</div>
            <div class="flex items-center gap-2 mt-2 text-xs">
              <span class="text-green-400">{{ telemetry.activeHolders }} active</span>
              <span class="text-gray-500">•</span>
              <span class="text-gray-400">{{ telemetry.inactiveHolders }} inactive</span>
            </div>
          </div>

          <!-- Total Transactions -->
          <div class="bg-white/5 rounded-lg p-4">
            <div class="text-sm text-gray-400 mb-1">Total Transactions</div>
            <div class="text-2xl font-bold text-white">{{ formatNumber(telemetry.totalTransactions) }}</div>
            <div class="flex items-center gap-2 mt-2 text-xs">
              <span class="text-blue-400">{{ telemetry.transactionsLast24h }} last 24h</span>
            </div>
          </div>
        </div>

        <!-- Activity Trend -->
        <div class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <i
                  :class="[
                    'pi text-lg',
                    telemetry.activityTrend.direction === 'increasing'
                      ? 'pi-arrow-up text-green-400'
                      : telemetry.activityTrend.direction === 'decreasing'
                        ? 'pi-arrow-down text-red-400'
                        : 'pi-minus text-gray-400',
                  ]"
                ></i>
                <span class="text-sm font-semibold text-white">Activity Trend</span>
              </div>
              <p class="text-sm text-gray-300">{{ telemetry.activityTrend.message }}</p>
            </div>
            <Badge :variant="telemetry.activityTrend.direction === 'increasing' ? 'success' : telemetry.activityTrend.direction === 'decreasing' ? 'error' : 'default'" size="sm">
              {{ telemetry.activityTrend.changePercentage > 0 ? "+" : "" }}{{ telemetry.activityTrend.changePercentage }}%
            </Badge>
          </div>
        </div>

        <!-- Concentration Risk -->
        <div
          :class="[
            'rounded-lg p-4 border',
            telemetry.concentrationRisk.severity === 'critical'
              ? 'bg-red-500/10 border-red-500/30'
              : telemetry.concentrationRisk.severity === 'high'
                ? 'bg-orange-500/10 border-orange-500/30'
                : telemetry.concentrationRisk.severity === 'medium'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30',
          ]"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-lg text-yellow-400"></i>
              <span class="text-sm font-semibold text-white">Concentration Risk</span>
            </div>
            <Badge
              :variant="
                telemetry.concentrationRisk.severity === 'critical'
                  ? 'error'
                  : telemetry.concentrationRisk.severity === 'high'
                    ? 'warning'
                    : telemetry.concentrationRisk.severity === 'medium'
                      ? 'warning'
                      : 'success'
              "
              size="sm"
            >
              {{ telemetry.concentrationRisk.severity }}
            </Badge>
          </div>

          <p class="text-sm text-gray-300 mb-3">{{ telemetry.concentrationRisk.message }}</p>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-400">Top holder:</span>
              <span class="text-white font-medium">{{ telemetry.concentrationRisk.topHolderPercentage }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Top 5 holders:</span>
              <span class="text-white font-medium">{{ telemetry.concentrationRisk.top5HoldersPercentage }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Top 10 holders:</span>
              <span class="text-white font-medium">{{ telemetry.concentrationRisk.top10HoldersPercentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Last Updated -->
        <div class="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">Last updated: {{ formatTimestamp(telemetry.lastUpdated) }}</div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { LifecycleTelemetry } from "../../types/lifecycleCockpit";
import Card from "../ui/Card.vue";
import Badge from "../ui/Badge.vue";

defineProps<{
  telemetry: LifecycleTelemetry | null;
}>();

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
</script>
