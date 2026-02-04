<template>
  <div
    class="discovery-token-card glass-effect rounded-xl p-6 hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 cursor-pointer relative"
    @click="handleCardClick"
    tabindex="0"
    role="button"
    :aria-label="`View ${token.name} token details`"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
    :data-testid="`token-card-${token.id}`"
  >
    <!-- Compliance Status Badge (Top Right) -->
    <div class="absolute top-4 right-4">
      <button
        v-if="complianceInfo"
        @click.stop="handleComplianceClick"
        :class="complianceInfo.badgeClass"
        class="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
        :title="complianceInfo.tooltip"
        :aria-label="`Compliance status: ${complianceInfo.label}`"
        :data-testid="`compliance-badge-${token.id}`"
      >
        <i :class="complianceInfo.icon"></i>
        {{ complianceInfo.label }}
      </button>
    </div>

    <!-- Header with Token Info -->
    <div class="flex items-start gap-3 mb-4 pr-24">
      <div
        class="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
      >
        <img
          v-if="token.imageUrl"
          :src="token.imageUrl"
          :alt="token.name"
          class="w-full h-full object-cover"
        />
        <i v-else class="pi pi-image text-white text-2xl"></i>
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white truncate">
          {{ token.name }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ token.symbol }}</p>
        <p v-if="token.issuer" class="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
          <i class="pi pi-building"></i>
          {{ token.issuer }}
        </p>
      </div>
    </div>

    <!-- Description -->
    <p class="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
      {{ token.description || 'No description available' }}
    </p>

    <!-- Operational Readiness Indicators -->
    <div v-if="hasOperationalInfo" class="mb-4 space-y-2">
      <div
        v-if="token.contractVerified"
        class="flex items-center gap-2 text-xs text-green-600 dark:text-green-400"
      >
        <i class="pi pi-check-circle"></i>
        <span>Contract Verified</span>
      </div>
      <div
        v-if="token.issuerIdentityVerified"
        class="flex items-center gap-2 text-xs text-green-600 dark:text-green-400"
      >
        <i class="pi pi-shield-check"></i>
        <span>Issuer Identity Verified</span>
      </div>
      <div
        v-if="token.auditCompleted"
        class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400"
      >
        <i class="pi pi-file-check"></i>
        <span>Security Audit Completed</span>
      </div>
      <div
        v-if="token.riskFlags && token.riskFlags.length > 0"
        class="flex items-center gap-2 text-xs text-red-600 dark:text-red-400"
      >
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ token.riskFlags.length }} Risk Flag(s)</span>
      </div>
    </div>

    <!-- Token Info Grid -->
    <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-500">Network</p>
        <p class="text-gray-900 dark:text-white font-medium">{{ formatNetwork(token.network) }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-500">Standard</p>
        <div class="flex items-center gap-1">
          <span class="text-gray-900 dark:text-white font-medium">{{ token.standard }}</span>
          <span
            :class="chainTypeBadgeClass"
            class="px-1.5 py-0.5 text-xs rounded"
          >
            {{ chainType }}
          </span>
        </div>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-500">Type</p>
        <p class="text-gray-900 dark:text-white font-medium">{{ token.type }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-500">Supply</p>
        <p class="text-gray-900 dark:text-white font-medium">{{ formatSupply(token.supply) }}</p>
      </div>
    </div>

    <!-- Liquidity Display (if available) -->
    <div v-if="token.liquidity" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-600 dark:text-gray-400">Liquidity</span>
        <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">
          ${{ formatNumber(token.liquidity) }}
        </span>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
      <button
        @click.stop="handleWatchlistToggle"
        :class="isInWatchlist ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-600'"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        :aria-label="isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'"
      >
        <i :class="isInWatchlist ? 'pi pi-star-fill' : 'pi pi-star'" class="text-lg"></i>
      </button>
      
      <button
        class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        @click.stop="handleViewDetails"
      >
        View Details
        <i class="pi pi-arrow-right text-xs"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MarketplaceToken } from '../stores/marketplace'
import { telemetryService } from '../services/TelemetryService'

interface Props {
  token: MarketplaceToken
  isInWatchlist?: boolean
}

interface Emits {
  (e: 'select', token: MarketplaceToken): void
  (e: 'view-details', token: MarketplaceToken): void
  (e: 'toggle-watchlist', token: MarketplaceToken): void
  (e: 'compliance-click', token: MarketplaceToken): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const complianceInfo = computed(() => {
  const status = props.token.complianceStatus || 'unknown'
  
  const statusMap: Record<string, { label: string; badgeClass: string; icon: string; tooltip: string }> = {
    compliant: {
      label: 'Compliant',
      badgeClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
      icon: 'pi pi-check-circle',
      tooltip: 'Fully compliant with regulatory requirements',
    },
    partial: {
      label: 'Partial',
      badgeClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
      icon: 'pi pi-exclamation-triangle',
      tooltip: 'Partially compliant - some requirements pending',
    },
    pending: {
      label: 'Pending',
      badgeClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
      icon: 'pi pi-clock',
      tooltip: 'Compliance review in progress',
    },
    'non-compliant': {
      label: 'Non-Compliant',
      badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
      icon: 'pi pi-times-circle',
      tooltip: 'Does not meet compliance requirements',
    },
    unknown: {
      label: 'Unknown',
      badgeClass: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500 border border-gray-200 dark:border-gray-700',
      icon: 'pi pi-question-circle',
      tooltip: 'Compliance status not verified',
    },
  }
  
  return statusMap[status] || statusMap.unknown
})

const hasOperationalInfo = computed(() => {
  return (
    props.token.contractVerified ||
    props.token.issuerIdentityVerified ||
    props.token.auditCompleted ||
    (props.token.riskFlags && props.token.riskFlags.length > 0)
  )
})

const chainType = computed(() => {
  const standard = props.token.standard || ''
  if (standard.startsWith('ARC') || standard === 'ASA') {
    return 'AVM'
  } else if (standard.startsWith('ERC')) {
    return 'EVM'
  }
  return 'Unknown'
})

const chainTypeBadgeClass = computed(() => {
  const type = chainType.value
  if (type === 'AVM') {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  } else if (type === 'EVM') {
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
  }
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
})

const formatNetwork = (network: string | undefined): string => {
  if (!network) return 'N/A'
  return network
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatSupply = (supply: number | undefined): string => {
  if (!supply) return 'N/A'
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(supply)
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num)
}

const handleCardClick = () => {
  telemetryService.trackTokenDetailViewed({
    tokenId: props.token.id,
    tokenStandard: props.token.standard || 'unknown',
    tokenChain: props.token.network || 'unknown',
    source: 'discovery',
  })
  emit('select', props.token)
}

const handleViewDetails = () => {
  telemetryService.trackTokenDetailViewed({
    tokenId: props.token.id,
    tokenStandard: props.token.standard || 'unknown',
    tokenChain: props.token.network || 'unknown',
    source: 'discovery',
  })
  emit('view-details', props.token)
}

const handleWatchlistToggle = () => {
  if (props.isInWatchlist) {
    telemetryService.trackWatchlistRemove({
      tokenId: props.token.id,
      tokenStandard: props.token.standard || 'unknown',
    })
  } else {
    telemetryService.trackWatchlistAdd({
      tokenId: props.token.id,
      tokenStandard: props.token.standard || 'unknown',
      source: 'card',
    })
  }
  emit('toggle-watchlist', props.token)
}

const handleComplianceClick = () => {
  telemetryService.trackComplianceBadgeClicked({
    tokenId: props.token.id,
    badgeType: complianceInfo.value.label,
    complianceStatus: props.token.complianceStatus || 'unknown',
  })
  emit('compliance-click', props.token)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
