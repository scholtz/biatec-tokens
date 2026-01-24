<template>
  <Card class="token-balance-panel">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Token Holdings
        </h3>
        <div class="flex items-center gap-2">
          <button
            @click="refresh"
            :disabled="isLoading"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Refresh balances"
          >
            <i :class="['pi pi-refresh text-sm', { 'pi-spin': isLoading }]"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !hasAssets" class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-600 dark:text-blue-400 mb-3"></i>
        <p class="text-sm text-gray-600 dark:text-gray-400">Loading token holdings...</p>
      </div>

      <!-- Connected with Assets -->
      <div v-else-if="isConnected && hasAssets" class="space-y-3">
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
              Total Assets
            </div>
            <div class="text-xl font-bold text-blue-700 dark:text-blue-300">
              {{ accountBalance.assets.length }}
            </div>
          </div>
          <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div class="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
              ALGO Balance
            </div>
            <div class="text-xl font-bold text-purple-700 dark:text-purple-300">
              {{ formattedAlgoBalance }}
            </div>
          </div>
        </div>

        <!-- Search/Filter -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search assets..."
            class="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        </div>

        <!-- Asset List -->
        <div class="space-y-2 max-h-[500px] overflow-y-auto">
          <div
            v-for="asset in filteredAssets"
            :key="asset.assetId"
            class="p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
            @click="selectAsset(asset)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {{ getAssetName(asset) }}
                  </h4>
                  <Badge
                    v-if="assetMetadata.get(asset.assetId)?.standard"
                    :variant="getStandardBadgeVariant(assetMetadata.get(asset.assetId)!.standard!)"
                    class="text-xs"
                  >
                    {{ assetMetadata.get(asset.assetId)?.standard }}
                  </Badge>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>ID: {{ asset.assetId }}</span>
                  <span class="w-1 h-1 rounded-full bg-gray-400"></span>
                  <span>{{ asset.unitName || 'N/A' }}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-bold text-gray-900 dark:text-white">
                  {{ formatAmount(asset.amount, asset.decimals) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ asset.unitName || '' }}
                </div>
              </div>
            </div>

            <!-- Asset Details (if metadata loaded) -->
            <div v-if="assetMetadata.has(asset.assetId)" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Total Supply:</span>
                  <span class="text-gray-900 dark:text-white font-medium ml-1">
                    {{ formatAmount(assetMetadata.get(asset.assetId)!.total, asset.decimals) }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Decimals:</span>
                  <span class="text-gray-900 dark:text-white font-medium ml-1">
                    {{ asset.decimals }}
                  </span>
                </div>
              </div>
              <div v-if="assetMetadata.get(asset.assetId)?.arc3?.description" class="mt-2">
                <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {{ assetMetadata.get(asset.assetId)!.arc3!.description }}
                </p>
              </div>
            </div>

            <!-- Loading metadata indicator -->
            <div v-else-if="loadingMetadata.has(asset.assetId)" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <i class="pi pi-spin pi-spinner mr-1"></i>
              Loading metadata...
            </div>
          </div>

          <!-- No results -->
          <div v-if="filteredAssets.length === 0 && searchQuery" class="text-center py-8">
            <i class="pi pi-inbox text-3xl text-gray-400 mb-2"></i>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              No assets found matching "{{ searchQuery }}"
            </p>
          </div>
        </div>
      </div>

      <!-- Not Connected or No Assets -->
      <div v-else class="text-center py-8">
        <i class="pi pi-wallet text-4xl text-gray-400 mb-3"></i>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {{ isConnected ? 'No token holdings' : 'Connect your wallet to view tokens' }}
        </p>
        <p v-if="isConnected" class="text-xs text-gray-500 dark:text-gray-500">
          Once you receive tokens, they will appear here
        </p>
      </div>

      <!-- Error State -->
      <div v-if="accountBalance.error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-red-500"></i>
          <div class="flex-1">
            <div class="text-sm font-medium text-red-600 dark:text-red-400">
              Failed to load token holdings
            </div>
            <div class="text-xs text-red-500 dark:text-red-400 mt-1">
              {{ accountBalance.error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import { useWalletManager } from '../composables/useWalletManager'
import { useTokenBalance, type TokenBalance } from '../composables/useTokenBalance'
import { useTokenMetadata } from '../composables/useTokenMetadata'

const { isConnected } = useWalletManager()
const { 
  accountBalance, 
  isLoading, 
  hasAssets, 
  formattedAlgoBalance, 
  refresh 
} = useTokenBalance()

const { getMetadata, metadataCache } = useTokenMetadata()

const searchQuery = ref('')
const selectedAssetId = ref<number | null>(null)
const loadingMetadata = ref(new Set<number>())
const assetMetadata = computed(() => metadataCache.value)

const filteredAssets = computed(() => {
  if (!searchQuery.value) return accountBalance.value.assets

  const query = searchQuery.value.toLowerCase()
  return accountBalance.value.assets.filter(asset => {
    const name = getAssetName(asset).toLowerCase()
    const id = asset.assetId.toString()
    const unitName = (asset.unitName || '').toLowerCase()
    
    return name.includes(query) || id.includes(query) || unitName.includes(query)
  })
})

const formatAmount = (amount: number, decimals: number): string => {
  const divisor = Math.pow(10, decimals)
  const formatted = (amount / divisor).toFixed(decimals)
  // Remove trailing zeros
  return parseFloat(formatted).toString()
}

const getAssetName = (asset: TokenBalance): string => {
  const metadata = assetMetadata.value.get(asset.assetId)
  return metadata?.name || asset.assetName || asset.unitName || `Asset #${asset.assetId}`
}

const getStandardBadgeVariant = (standard: string): 'success' | 'info' | 'default' => {
  if (standard === 'ARC3') return 'success'
  if (standard === 'ARC19') return 'info'
  return 'default'
}

const selectAsset = (asset: TokenBalance) => {
  selectedAssetId.value = asset.assetId
  // Future enhancement: navigate to asset details page or show detailed modal
  // router.push(`/assets/${asset.assetId}`)
}

// Load metadata for assets when they appear
watch(() => accountBalance.value.assets, async (newAssets) => {
  for (const asset of newAssets.slice(0, 10)) { // Load first 10 to avoid rate limiting
    if (!assetMetadata.value.has(asset.assetId) && !loadingMetadata.value.has(asset.assetId)) {
      loadingMetadata.value.add(asset.assetId)
      try {
        await getMetadata(asset.assetId)
      } finally {
        loadingMetadata.value.delete(asset.assetId)
      }
    }
  }
}, { immediate: true })
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
