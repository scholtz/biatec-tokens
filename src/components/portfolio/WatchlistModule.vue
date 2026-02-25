<template>
  <div>
    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Watchlist</h3>

    <!-- Empty state -->
    <div v-if="watchlist.length === 0" class="text-center py-6">
      <p class="text-gray-500 dark:text-gray-400 text-sm">Pin assets for quick access.</p>
    </div>

    <!-- Watchlist entries -->
    <ul v-else class="space-y-2" aria-label="Watchlist">
      <li
        v-for="entry in watchlist"
        :key="`${entry.assetId}-${entry.network}`"
        class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ entry.symbol }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ entry.name }} · {{ entry.network }}</p>
        </div>
        <button
          @click="$emit('remove', { assetId: entry.assetId, network: entry.network })"
          class="ml-3 flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded"
          :aria-label="`Remove ${entry.symbol} from watchlist`"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    </ul>

    <!-- Add assets from availableAssets -->
    <div v-if="availableAssets && availableAssets.length > 0" class="mt-4">
      <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-2">Add to Watchlist</p>
      <div class="space-y-1">
        <button
          v-for="asset in availableAssets"
          :key="`${asset.id}-${asset.network}`"
          @click="$emit('add', { assetId: asset.id, symbol: asset.symbol, name: asset.name, network: asset.network })"
          class="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
          :aria-label="`Add ${asset.symbol} to watchlist`"
        >
          <span>{{ asset.symbol }} <span class="text-xs text-gray-400">{{ asset.network }}</span></span>
          <span class="text-blue-500 dark:text-blue-400 text-xs">+ Add</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WatchlistEntry, PortfolioAsset } from '../../types/portfolioIntelligence'

interface Props {
  watchlist: WatchlistEntry[]
  availableAssets?: PortfolioAsset[]
}

withDefaults(defineProps<Props>(), {
  availableAssets: undefined,
})

defineEmits<{
  add: [payload: { assetId: string; symbol: string; name: string; network: string }]
  remove: [payload: { assetId: string; network: string }]
}>()
</script>
