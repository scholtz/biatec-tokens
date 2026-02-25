<template>
  <div :aria-label="'Portfolio Summary'" role="region">
    <!-- Loading skeleton -->
    <div v-if="loading" aria-live="polite" class="space-y-4">
      <div class="animate-pulse space-y-3">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
      <div class="animate-pulse space-y-2 mt-4">
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-6">
      <p class="text-red-500 dark:text-red-400 text-sm mb-3" role="alert">{{ error }}</p>
      <button
        @click="$emit('retry')"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        aria-label="Retry loading portfolio"
      >
        Retry
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!summary" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        No portfolio data yet. Connect a wallet to get started.
      </p>
    </div>

    <!-- Loaded state -->
    <div v-else class="space-y-4">
      <!-- Total value -->
      <div aria-label="Total portfolio value">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
          Total Value
        </p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
          {{ formatPortfolioValue(summary.totalValueUsd) }}
        </p>
      </div>

      <!-- 24h change -->
      <div aria-label="24 hour change">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
          24h Change
        </p>
        <p
          class="text-lg font-semibold mt-0.5"
          :class="summary.change24hPct >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'"
        >
          {{ formatPct(summary.change24hPct) }}
          <span class="text-sm font-normal ml-1">({{ formatPortfolioValue(summary.change24hUsd) }})</span>
        </p>
      </div>

      <!-- Asset count -->
      <div aria-label="Number of assets">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
          Assets
        </p>
        <p class="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
          {{ summary.assetCount }}
        </p>
      </div>

      <!-- Allocation bars -->
      <div v-if="summary.allocationByCategory.length > 0" class="mt-4">
        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-2">
          Allocation by Network
        </p>
        <div class="space-y-2">
          <div
            v-for="cat in summary.allocationByCategory"
            :key="cat.label"
            class="space-y-1"
            :aria-label="`${cat.label}: ${formatPct(cat.pct)} of portfolio`"
          >
            <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{{ cat.label }}</span>
              <span>{{ formatPct(cat.pct) }}</span>
            </div>
            <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-500"
                :style="{ width: `${Math.min(cat.pct, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PortfolioSummary } from '../../types/portfolioIntelligence'
import { formatPortfolioValue, formatPct } from '../../utils/portfolioIntelligence'

interface Props {
  summary: PortfolioSummary | null
  loading: boolean
  error?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: undefined,
})

defineEmits<{
  retry: []
}>()
</script>
