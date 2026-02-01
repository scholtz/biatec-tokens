<template>
  <MainLayout>
    <div class="min-h-screen px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Token Marketplace</h1>
          <p class="text-gray-300 text-lg">
            Discover and trade regulated tokens across multiple blockchain networks
          </p>
        </div>

        <!-- Filters -->
        <div class="mb-8">
          <MarketplaceFilters
            :filters="marketplaceStore.filters"
            :filtered-count="marketplaceStore.filteredCount"
            :total-tokens="marketplaceStore.totalTokens"
            @update:filters="handleFilterUpdate"
            @reset="handleReset"
          />
        </div>

        <!-- Loading State -->
        <div
          v-if="marketplaceStore.loading"
          class="glass-effect rounded-xl p-12 text-center"
        >
          <i class="pi pi-spin pi-spinner text-biatec-accent text-4xl mb-4"></i>
          <p class="text-gray-300 text-lg">Loading marketplace tokens...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="marketplaceStore.error"
          class="glass-effect rounded-xl p-12 text-center"
        >
          <i class="pi pi-exclamation-triangle text-red-400 text-4xl mb-4"></i>
          <p class="text-white text-lg font-semibold mb-2">Failed to load tokens</p>
          <p class="text-gray-300 mb-4">{{ marketplaceStore.error }}</p>
          <button
            @click="marketplaceStore.loadTokens()"
            class="px-6 py-2 bg-biatec-accent text-gray-900 rounded-lg font-medium hover:bg-biatec-accent/90 transition-colors"
          >
            <i class="pi pi-refresh mr-2"></i>
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="marketplaceStore.filteredTokens.length === 0 && !marketplaceStore.loading"
          class="glass-effect rounded-xl p-12 text-center"
        >
          <i class="pi pi-inbox text-gray-400 text-6xl mb-4"></i>
          <p class="text-white text-xl font-semibold mb-2">No tokens found</p>
          <p class="text-gray-300 mb-6">
            {{ hasActiveFilters ? 'Try adjusting your filters' : 'The marketplace is currently empty' }}
          </p>
          <button
            v-if="hasActiveFilters"
            @click="handleReset"
            class="px-6 py-2 bg-biatec-accent/20 text-biatec-accent rounded-lg font-medium hover:bg-biatec-accent/30 transition-colors"
          >
            <i class="pi pi-filter-slash mr-2"></i>
            Clear Filters
          </button>
        </div>

        <!-- Tokens Grid -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in"
        >
          <MarketplaceTokenCard
            v-for="token in marketplaceStore.filteredTokens"
            :key="token.id"
            :token="token"
            @select="handleTokenSelect"
            @view-details="handleTokenSelect"
          />
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
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMarketplaceStore } from '../stores/marketplace';
import type { MarketplaceToken, MarketplaceFilters as IMarketplaceFilters } from '../stores/marketplace';
import MainLayout from '../layout/MainLayout.vue';
import MarketplaceFilters from '../components/MarketplaceFilters.vue';
import MarketplaceTokenCard from '../components/MarketplaceTokenCard.vue';
import TokenDetailDrawer from '../components/TokenDetailDrawer.vue';

const router = useRouter();
const route = useRoute();
const marketplaceStore = useMarketplaceStore();

const selectedToken = ref<MarketplaceToken | null>(null);
const showDetailDrawer = ref(false);

const hasActiveFilters = computed(() => {
  return (
    marketplaceStore.filters.network !== 'All' ||
    marketplaceStore.filters.complianceBadge !== 'All' ||
    marketplaceStore.filters.assetClass !== 'All' ||
    marketplaceStore.filters.search !== ''
  );
});

// Load tokens on mount
onMounted(async () => {
  // Load filters from URL
  const params = new URLSearchParams(window.location.search);
  marketplaceStore.setFiltersFromUrl(params);

  // Load tokens
  await marketplaceStore.loadTokens();
});

// Update URL when filters change
watch(
  () => marketplaceStore.filters,
  () => {
    const params = marketplaceStore.getUrlParams();
    const query = Object.fromEntries(params.entries());
    
    // Only update if query actually changed
    const currentQuery = route.query;
    const queriesEqual = Object.keys(query).length === Object.keys(currentQuery).length &&
      Object.keys(query).every(key => query[key] === currentQuery[key]);
    
    if (!queriesEqual) {
      router.replace({ query });
    }
  },
  { deep: true }
);

const handleFilterUpdate = (filters: IMarketplaceFilters) => {
  marketplaceStore.updateFilters(filters);
};

const handleReset = () => {
  marketplaceStore.resetFilters();
};

const handleTokenSelect = (token: MarketplaceToken) => {
  selectedToken.value = token;
  showDetailDrawer.value = true;
};

const closeDetailDrawer = () => {
  showDetailDrawer.value = false;
  // Small delay before clearing to allow animation
  setTimeout(() => {
    selectedToken.value = null;
  }, 300);
};
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
  animation: fade-in 0.3s ease-out;
}
</style>
