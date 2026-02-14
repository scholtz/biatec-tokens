<template>
  <Card variant="glass" padding="md">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-400">Filters</h3>
        <button
          v-if="hasActiveFilters"
          @click="$emit('reset')"
          class="text-xs text-blue-400 hover:text-blue-300"
        >
          Reset All
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Timeframe Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">
            Timeframe
          </label>
          <Select
            :modelValue="filters.timeframe"
            @update:modelValue="updateFilter('timeframe', $event)"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </Select>
        </div>

        <!-- Network Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">
            Networks
          </label>
          <Select
            :modelValue="filters.networks.length > 0 ? filters.networks[0] : ''"
            @update:modelValue="updateFilter('networks', $event ? [$event] : [])"
          >
            <option value="">All Networks</option>
            <option value="algorand">Algorand Mainnet</option>
            <option value="ethereum">Ethereum</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="base">Base</option>
          </Select>
        </div>

        <!-- Wallet Segment Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-2">
            Wallet Segment
          </label>
          <Select
            :modelValue="filters.walletSegment"
            @update:modelValue="updateFilter('walletSegment', $event)"
          >
            <option value="all">All Wallets</option>
            <option value="whales">Whales (>1M tokens)</option>
            <option value="retail">Retail (<10K tokens)</option>
            <option value="institutional">Institutional</option>
            <option value="active">Active (30d)</option>
            <option value="dormant">Dormant (>90d)</option>
          </Select>
        </div>
      </div>

      <!-- Active Filters Display -->
      <div v-if="hasActiveFilters" class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-gray-400">Active:</span>
        
        <Badge
          v-for="network in filters.networks"
          :key="`network-${network}`"
          variant="default"
          size="sm"
        >
          {{ getNetworkLabel(network) }}
        </Badge>
        
        <Badge
          v-if="filters.walletSegment !== 'all'"
          variant="default"
          size="sm"
        >
          {{ filters.walletSegment }}
        </Badge>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from '../ui/Card.vue'
import Select from '../ui/Select.vue'
import Badge from '../ui/Badge.vue'
import type { InsightsFilters } from '../../stores/insights'

interface Props {
  filters: InsightsFilters
}

interface Emits {
  (e: 'update:filters', filters: Partial<InsightsFilters>): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasActiveFilters = computed(() => {
  return (
    props.filters.networks.length > 0 ||
    props.filters.tokenIds.length > 0 ||
    props.filters.walletSegment !== 'all'
  )
})

function updateFilter(key: keyof InsightsFilters, value: any) {
  emit('update:filters', { [key]: value })
}

function getNetworkLabel(value: string): string {
  const labels: Record<string, string> = {
    algorand: 'Algorand',
    ethereum: 'Ethereum',
    arbitrum: 'Arbitrum',
    base: 'Base',
  }
  return labels[value] || value
}
</script>
