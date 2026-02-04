<template>
  <div class="glass-effect rounded-xl p-6 sticky top-4" role="search" aria-label="Token discovery filters" data-testid="discovery-filter-panel">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <i class="pi pi-filter"></i>
        Filters
        <span
          v-if="activeFilterCount > 0"
          class="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full"
          data-testid="filter-count-badge"
        >
          {{ activeFilterCount }}
        </span>
      </h3>
      <button
        v-if="hasActiveFilters"
        @click="handleReset"
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        aria-label="Clear all filters"
        data-testid="clear-all-filters-button"
      >
        Clear all
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <label for="token-search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Search Tokens
      </label>
      <div class="relative">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input
          id="token-search"
          v-model="localFilters.search"
          type="text"
          placeholder="Token name or symbol..."
          class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
          @input="handleFilterChange"
          data-testid="token-search-input"
        />
      </div>
    </div>

    <!-- Token Standards -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Token Standards
      </label>
      <div class="space-y-2">
        <label
          v-for="standard in availableStandards"
          :key="standard.value"
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <input
            type="checkbox"
            :value="standard.value"
            v-model="localFilters.standards"
            @change="handleFilterChange"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            :data-testid="`filter-standard-${standard.value}`"
          />
          <span class="text-sm text-gray-900 dark:text-white flex-1">
            {{ standard.label }}
          </span>
          <span class="text-xs px-2 py-0.5 rounded-full" :class="standard.badgeClass">
            {{ standard.type }}
          </span>
        </label>
      </div>
    </div>

    <!-- Compliance Status -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Compliance Status
      </label>
      <div class="space-y-2">
        <label
          v-for="status in complianceStatuses"
          :key="status.value"
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <input
            type="checkbox"
            :value="status.value"
            v-model="localFilters.complianceStatus"
            @change="handleFilterChange"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="flex items-center gap-2 text-sm text-gray-900 dark:text-white flex-1">
            <i :class="status.icon" :style="{ color: status.color }"></i>
            {{ status.label }}
          </span>
        </label>
      </div>
    </div>

    <!-- Blockchain Networks -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Blockchain Networks
      </label>
      <div class="space-y-2">
        <label
          v-for="chain in availableChains"
          :key="chain.value"
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <input
            type="checkbox"
            :value="chain.value"
            v-model="localFilters.chains"
            @change="handleFilterChange"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="text-sm text-gray-900 dark:text-white">{{ chain.label }}</span>
        </label>
      </div>
    </div>

    <!-- Issuer Type -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Issuer Type
      </label>
      <div class="space-y-2">
        <label
          v-for="issuer in issuerTypes"
          :key="issuer.value"
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <input
            type="checkbox"
            :value="issuer.value"
            v-model="localFilters.issuerTypes"
            @change="handleFilterChange"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="text-sm text-gray-900 dark:text-white">{{ issuer.label }}</span>
        </label>
      </div>
    </div>

    <!-- Minimum Liquidity -->
    <div class="mb-6">
      <label for="liquidity-min" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Minimum Liquidity (USD)
      </label>
      <input
        id="liquidity-min"
        v-model.number="localFilters.liquidityMin"
        type="number"
        min="0"
        step="1000"
        placeholder="e.g., 10000"
        class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
        @input="handleFilterChange"
      />
    </div>

    <!-- Action Buttons -->
    <div class="space-y-3">
      <button
        @click="handleSave"
        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        :disabled="!hasActiveFilters"
        aria-label="Save filter preferences"
        data-testid="save-filters-button"
      >
        <i class="pi pi-save"></i>
        Save Preferences
      </button>
      <button
        v-if="hasSavedFilters"
        @click="handleLoad"
        class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        aria-label="Load saved filter preferences"
        data-testid="load-filters-button"
      >
        <i class="pi pi-upload"></i>
        Load Saved
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DiscoveryFilters } from '../stores/discovery'

interface Props {
  filters: DiscoveryFilters
  activeFilterCount: number
  hasActiveFilters: boolean
  hasSavedFilters: boolean
}

interface Emits {
  (e: 'update:filters', filters: DiscoveryFilters): void
  (e: 'save'): void
  (e: 'load'): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = ref<DiscoveryFilters>({ ...props.filters })

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

const availableStandards = [
  { value: 'ASA', label: 'ASA - Algorand Standard Asset', type: 'AVM', badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { value: 'ARC3', label: 'ARC3 - NFT Standard', type: 'AVM', badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { value: 'ARC19', label: 'ARC19 - Enhanced NFT', type: 'AVM', badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { value: 'ARC69', label: 'ARC69 - Mutable NFT', type: 'AVM', badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { value: 'ARC200', label: 'ARC200 - Smart Contract Token', type: 'AVM', badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { value: 'ARC72', label: 'ARC72 - Advanced NFT', type: 'AVM', badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { value: 'ERC20', label: 'ERC20 - Fungible Token', type: 'EVM', badgeClass: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
  { value: 'ERC721', label: 'ERC721 - NFT Standard', type: 'EVM', badgeClass: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
]

const complianceStatuses = [
  { value: 'compliant', label: 'Fully Compliant', icon: 'pi pi-check-circle', color: '#10b981' },
  { value: 'partial', label: 'Partially Compliant', icon: 'pi pi-exclamation-triangle', color: '#f59e0b' },
  { value: 'pending', label: 'Pending Review', icon: 'pi pi-clock', color: '#6b7280' },
  { value: 'non-compliant', label: 'Non-Compliant', icon: 'pi pi-times-circle', color: '#ef4444' },
  { value: 'unknown', label: 'Status Unknown', icon: 'pi pi-question-circle', color: '#9ca3af' },
]

const availableChains = [
  { value: 'algorand-mainnet', label: 'Algorand Mainnet' },
  { value: 'algorand-testnet', label: 'Algorand Testnet' },
  { value: 'voi-mainnet', label: 'VOI Mainnet' },
  { value: 'voi-testnet', label: 'VOI Testnet' },
  { value: 'aramid-mainnet', label: 'Aramid Mainnet' },
  { value: 'aramid-testnet', label: 'Aramid Testnet' },
  { value: 'ethereum-mainnet', label: 'Ethereum Mainnet' },
  { value: 'ethereum-sepolia', label: 'Ethereum Sepolia' },
  { value: 'base-mainnet', label: 'Base Mainnet' },
  { value: 'arbitrum-mainnet', label: 'Arbitrum Mainnet' },
]

const issuerTypes = [
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'dao', label: 'DAO / Community' },
  { value: 'verified', label: 'Verified Issuer' },
]

const handleFilterChange = () => {
  emit('update:filters', localFilters.value)
}

const handleSave = () => {
  emit('save')
}

const handleLoad = () => {
  emit('load')
}

const handleReset = () => {
  emit('reset')
}
</script>
