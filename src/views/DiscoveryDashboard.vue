<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Token Discovery
          </h1>
          <p class="text-gray-600 dark:text-gray-300 text-lg">
            Explore compliant tokens across multiple blockchain networks with advanced filtering
          </p>
        </div>

        <!-- Layout: Filters (Left) + Results (Right) -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Filter Panel (Left Sidebar) -->
          <aside class="lg:col-span-1">
            <DiscoveryFilterPanel
              :filters="discoveryStore.filters"
              :active-filter-count="discoveryStore.activeFilterCount"
              :has-active-filters="discoveryStore.hasActiveFilters"
              :has-saved-filters="!!discoveryStore.savedFilters"
              @update:filters="handleFilterUpdate"
              @save="handleSaveFilters"
              @load="handleLoadFilters"
              @reset="handleResetFilters"
            />
          </aside>

          <!-- Results Area (Right) -->
          <main class="lg:col-span-3">
            <!-- Results Summary Bar -->
            <div class="mb-6 flex items-center justify-between">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-semibold text-gray-900 dark:text-white text-lg">
                  {{ discoveryStore.filteredTokens.length }}
                </span>
                token{{ discoveryStore.filteredTokens.length !== 1 ? 's' : '' }} found
                <span v-if="discoveryStore.hasActiveFilters" class="ml-2">
                  with active filters
                </span>
              </div>

              <!-- Sort Options (Future Enhancement) -->
              <div class="flex items-center gap-2">
                <label for="sort-by" class="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
                <select
                  id="sort-by"
                  v-model="sortBy"
                  class="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="name">Name</option>
                  <option value="liquidity">Liquidity</option>
                  <option value="recent">Recently Added</option>
                </select>
              </div>
            </div>

            <!-- Loading State -->
            <div
              v-if="discoveryStore.loading"
              class="glass-effect rounded-xl p-12 text-center"
            >
              <i class="pi pi-spin pi-spinner text-blue-500 text-4xl mb-4"></i>
              <p class="text-gray-600 dark:text-gray-300 text-lg">Loading tokens...</p>
            </div>

            <!-- Error State -->
            <div
              v-else-if="discoveryStore.error"
              class="glass-effect rounded-xl p-12 text-center"
            >
              <i class="pi pi-exclamation-triangle text-red-500 text-4xl mb-4"></i>
              <p class="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                Failed to load tokens
              </p>
              <p class="text-gray-600 dark:text-gray-300 mb-4">{{ discoveryStore.error }}</p>
              <button
                @click="loadTokens"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <i class="pi pi-refresh mr-2"></i>
                Try Again
              </button>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="discoveryStore.filteredTokens.length === 0"
              class="glass-effect rounded-xl p-12 text-center"
            >
              <i class="pi pi-inbox text-gray-400 dark:text-gray-600 text-6xl mb-4"></i>
              <p class="text-gray-900 dark:text-white text-xl font-semibold mb-2">
                No tokens found
              </p>
              <p class="text-gray-600 dark:text-gray-300 mb-6">
                {{ discoveryStore.hasActiveFilters 
                  ? 'Try adjusting your filters to see more results' 
                  : 'The marketplace is currently empty' 
                }}
              </p>
              <button
                v-if="discoveryStore.hasActiveFilters"
                @click="handleResetFilters"
                class="px-6 py-2 bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-600/30 transition-colors"
              >
                <i class="pi pi-filter-slash mr-2"></i>
                Clear All Filters
              </button>
            </div>

            <!-- Tokens Grid -->
            <div
              v-else
              class="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in"
            >
              <DiscoveryTokenCard
                v-for="token in displayedTokens"
                :key="token.id"
                :token="token"
                :is-in-watchlist="isInWatchlist(token.id)"
                @select="handleTokenSelect"
                @view-details="handleTokenSelect"
                @toggle-watchlist="handleWatchlistToggle"
                @compliance-click="handleComplianceClick"
              />
            </div>

            <!-- Pagination (if needed) -->
            <div
              v-if="discoveryStore.filteredTokens.length > itemsPerPage"
              class="mt-8 flex items-center justify-center gap-2"
            >
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <i class="pi pi-chevron-left"></i>
              </button>
              
              <span class="px-4 py-2 text-gray-600 dark:text-gray-400">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>

    <!-- Token Detail Drawer -->
    <TokenDetailDrawer
      v-if="selectedToken"
      :token="selectedToken"
      :show="showDetailDrawer"
      @close="closeDetailDrawer"
    />

    <!-- Onboarding Checklist (Persistent) -->
    <OnboardingChecklist />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDiscoveryStore } from '../stores/discovery'
import { useOnboardingStore } from '../stores/onboarding'
import { useMarketplaceStore } from '../stores/marketplace'
import { telemetryService } from '../services/TelemetryService'
import MainLayout from '../layout/MainLayout.vue'
import DiscoveryFilterPanel from '../components/DiscoveryFilterPanel.vue'
import DiscoveryTokenCard from '../components/DiscoveryTokenCard.vue'
import TokenDetailDrawer from '../components/TokenDetailDrawer.vue'
import OnboardingChecklist from '../components/OnboardingChecklist.vue'
import type { MarketplaceToken } from '../stores/marketplace'
import type { DiscoveryFilters } from '../stores/discovery'

const discoveryStore = useDiscoveryStore()
const onboardingStore = useOnboardingStore()
const marketplaceStore = useMarketplaceStore()

const selectedToken = ref<MarketplaceToken | null>(null)
const showDetailDrawer = ref(false)
const sortBy = ref('relevance')
const currentPage = ref(1)
const itemsPerPage = ref(12)
const watchlist = ref<Set<string>>(new Set())

const totalPages = computed(() => 
  Math.ceil(discoveryStore.filteredTokens.length / itemsPerPage.value)
)

const displayedTokens = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return discoveryStore.filteredTokens.slice(start, end)
})

const isInWatchlist = (tokenId: string): boolean => {
  return watchlist.value.has(tokenId)
}

const handleFilterUpdate = (filters: DiscoveryFilters) => {
  discoveryStore.updateFilters(filters)
  currentPage.value = 1 // Reset to first page when filters change
  
  // Track filter application
  const filterTypes: Array<keyof DiscoveryFilters> = [
    'standards', 
    'complianceStatus', 
    'chains', 
    'issuerTypes'
  ]
  
  filterTypes.forEach(type => {
    const value = filters[type]
    if (Array.isArray(value) && value.length > 0) {
      telemetryService.trackDiscoveryFilterApplied({
        filterType: type as any,
        filterValue: value.join(','),
        filterCount: value.length,
      })
    }
  })
}

const handleSaveFilters = () => {
  discoveryStore.saveFilters()
  onboardingStore.markStepComplete('save-filters')
  
  telemetryService.trackDiscoveryFilterSaved({
    filterCount: discoveryStore.activeFilterCount,
    hasStandards: discoveryStore.filters.standards.length > 0,
    hasCompliance: discoveryStore.filters.complianceStatus.length > 0,
    hasChains: discoveryStore.filters.chains.length > 0,
  })
}

const handleLoadFilters = () => {
  discoveryStore.loadSavedFilters()
  currentPage.value = 1
}

const handleResetFilters = () => {
  discoveryStore.resetFilters()
  currentPage.value = 1
}

const handleTokenSelect = (token: MarketplaceToken) => {
  selectedToken.value = token
  showDetailDrawer.value = true
  onboardingStore.markStepComplete('explore-tokens')
}

const handleWatchlistToggle = (token: MarketplaceToken) => {
  if (watchlist.value.has(token.id)) {
    watchlist.value.delete(token.id)
  } else {
    watchlist.value.add(token.id)
  }
}

const handleComplianceClick = (token: MarketplaceToken) => {
  // Show compliance details in a modal or navigate to compliance page
  console.log('Compliance clicked for:', token.id)
}

const closeDetailDrawer = () => {
  showDetailDrawer.value = false
  selectedToken.value = null
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const loadTokens = async () => {
  discoveryStore.setLoading(true)
  discoveryStore.setError(null)
  
  try {
    // Load tokens from marketplace store
    await marketplaceStore.loadTokens()
    discoveryStore.setTokens(marketplaceStore.tokens)
  } catch (error) {
    discoveryStore.setError(error instanceof Error ? error.message : 'Failed to load tokens')
  } finally {
    discoveryStore.setLoading(false)
  }
}

onMounted(async () => {
  // Track dashboard view
  telemetryService.trackDiscoveryDashboardViewed({ source: 'direct' })
  
  // Initialize stores
  discoveryStore.initialize()
  onboardingStore.initialize()
  
  // Load tokens
  await loadTokens()
  
  // Mark onboarding step if standards were selected
  if (discoveryStore.filters.standards.length > 0) {
    onboardingStore.markStepComplete('select-standards')
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>
