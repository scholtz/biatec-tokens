<template>
  <div class="glass-effect rounded-xl p-6 space-y-4">
    <!-- Search Bar -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <i class="pi pi-search text-gray-400"></i>
      </div>
      <input
        v-model="localFilters.search"
        type="text"
        placeholder="Search by name, symbol, issuer..."
        class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-biatec-accent transition-colors"
        @input="emitFilters"
      />
    </div>

    <!-- Filter Options -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Network Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">Network</label>
        <select
          v-model="localFilters.network"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-biatec-accent transition-colors"
          @change="emitFilters"
        >
          <option value="All">All Networks</option>
          <option value="VOI">VOI</option>
          <option value="Aramid">Aramid</option>
          <option value="Algorand Mainnet">Algorand Mainnet</option>
          <option value="Algorand Testnet">Algorand Testnet</option>
          <option value="Ethereum">Ethereum</option>
          <option value="Arbitrum">Arbitrum</option>
          <option value="Base">Base</option>
          <option value="Sepolia">Sepolia</option>
        </select>
      </div>

      <!-- Compliance Badge Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">Compliance</label>
        <select
          v-model="localFilters.complianceBadge"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-biatec-accent transition-colors"
          @change="emitFilters"
        >
          <option value="All">All Compliance</option>
          <option value="MICA Compliant">MICA Compliant</option>
          <option value="KYC Required">KYC Required</option>
          <option value="Whitelisted">Whitelisted</option>
          <option value="None">None</option>
        </select>
      </div>

      <!-- Asset Class Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-2">Asset Class</label>
        <select
          v-model="localFilters.assetClass"
          class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-biatec-accent transition-colors"
          @change="emitFilters"
        >
          <option value="All">All Types</option>
          <option value="FT">Fungible Tokens</option>
          <option value="NFT">NFTs</option>
        </select>
      </div>
    </div>

    <!-- Active Filters and Reset -->
    <div class="flex items-center justify-between pt-2 border-t border-white/10">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-gray-400">
          {{ filteredCount }} of {{ totalTokens }} tokens
        </span>
        
        <!-- Active filter badges -->
        <div v-if="hasActiveFilters" class="flex flex-wrap gap-2 ml-4">
          <span
            v-if="localFilters.network !== 'All'"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-biatec-accent/20 text-biatec-accent rounded-full"
          >
            {{ localFilters.network }}
            <button
              @click="clearFilter('network')"
              class="hover:text-white transition-colors"
              aria-label="Clear network filter"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </span>
          
          <span
            v-if="localFilters.complianceBadge !== 'All'"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-biatec-accent/20 text-biatec-accent rounded-full"
          >
            {{ localFilters.complianceBadge }}
            <button
              @click="clearFilter('complianceBadge')"
              class="hover:text-white transition-colors"
              aria-label="Clear compliance filter"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </span>
          
          <span
            v-if="localFilters.assetClass !== 'All'"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-biatec-accent/20 text-biatec-accent rounded-full"
          >
            {{ localFilters.assetClass }}
            <button
              @click="clearFilter('assetClass')"
              class="hover:text-white transition-colors"
              aria-label="Clear asset class filter"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </span>
          
          <span
            v-if="localFilters.search"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-biatec-accent/20 text-biatec-accent rounded-full"
          >
            "{{ localFilters.search }}"
            <button
              @click="clearFilter('search')"
              class="hover:text-white transition-colors"
              aria-label="Clear search filter"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </span>
        </div>
      </div>

      <button
        v-if="hasActiveFilters"
        @click="handleReset"
        class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <i class="pi pi-filter-slash mr-2"></i>
        Reset All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { MarketplaceFilters as IMarketplaceFilters } from '../stores/marketplace';

const props = defineProps<{
  filters: IMarketplaceFilters;
  filteredCount: number;
  totalTokens: number;
}>();

const emit = defineEmits<{
  'update:filters': [filters: IMarketplaceFilters];
  'reset': [];
}>();

const localFilters = ref<IMarketplaceFilters>({ ...props.filters });

// Watch for external filter changes (e.g., from URL)
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);

const hasActiveFilters = computed(() => {
  return (
    localFilters.value.network !== 'All' ||
    localFilters.value.complianceBadge !== 'All' ||
    localFilters.value.assetClass !== 'All' ||
    localFilters.value.search !== ''
  );
});

const emitFilters = () => {
  emit('update:filters', { ...localFilters.value });
};

const clearFilter = (filterKey: keyof IMarketplaceFilters) => {
  if (filterKey === 'search') {
    localFilters.value.search = '';
  } else if (filterKey === 'network') {
    localFilters.value.network = 'All';
  } else if (filterKey === 'complianceBadge') {
    localFilters.value.complianceBadge = 'All';
  } else if (filterKey === 'assetClass') {
    localFilters.value.assetClass = 'All';
  }
  emitFilters();
};

const handleReset = () => {
  localFilters.value = {
    network: 'All',
    complianceBadge: 'All',
    assetClass: 'All',
    search: '',
  };
  emit('reset');
};
</script>
