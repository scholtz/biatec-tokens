<template>
  <div
    class="marketplace-token-card glass-effect rounded-xl p-6 hover:shadow-xl hover:border-biatec-accent/30 transition-all duration-300 cursor-pointer"
    @click="$emit('select', token)"
  >
    <!-- Header with Token Info -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div
          class="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-biatec-accent to-biatec-teal flex items-center justify-center flex-shrink-0"
        >
          <img
            v-if="token.imageUrl"
            :src="token.imageUrl"
            :alt="token.name"
            class="w-full h-full object-cover"
          />
          <i v-else class="pi pi-image text-white text-2xl"></i>
        </div>
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-white truncate">{{ token.name }}</h3>
          <p class="text-sm text-gray-300">{{ token.symbol }}</p>
          <p v-if="token.issuer" class="text-xs text-gray-400 mt-1">by {{ token.issuer }}</p>
        </div>
      </div>
      
      <!-- Price Info -->
      <div v-if="token.price" class="text-right">
        <PriceDisplay
          :price="token.price"
          :priceChange24h="token.priceChange24h"
          :priceChange7d="token.priceChange7d"
          :priceSource="token.priceSource"
          :lastUpdated="token.priceLastUpdated"
          :showChanges="true"
          :show7dChange="false"
          :showSource="false"
          :showLastUpdated="false"
        />
      </div>
    </div>

    <!-- Description -->
    <p class="text-gray-300 text-sm mb-4 line-clamp-2">{{ token.description }}</p>

    <!-- Compliance Badges -->
    <div v-if="token.complianceBadges && token.complianceBadges.length > 0" class="flex flex-wrap gap-2 mb-4">
      <span
        v-for="badge in token.complianceBadges"
        :key="badge"
        :class="getBadgeClass(badge)"
        class="px-2 py-1 text-xs font-medium rounded-full"
      >
        <i :class="getBadgeIcon(badge)" class="mr-1"></i>
        {{ badge }}
      </span>
    </div>

    <!-- Token Info Grid -->
    <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
      <div>
        <p class="text-xs text-gray-400">Network</p>
        <p class="text-white font-medium">{{ token.network || 'N/A' }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-400">Standard</p>
        <p class="text-white font-medium">{{ token.standard }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-400">Type</p>
        <p class="text-white font-medium">{{ token.type }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-400">Supply</p>
        <p class="text-white font-medium">{{ formatSupply(token.supply) }}</p>
      </div>
    </div>

    <!-- Whitelist Status -->
    <div class="flex items-center justify-between pt-4 border-t border-white/10">
      <div class="flex items-center space-x-2">
        <div
          v-if="token.whitelistStatus"
          :class="getWhitelistStatusClass(token.whitelistStatus)"
          class="px-3 py-1 rounded-full text-xs font-medium"
        >
          <i
            :class="getWhitelistStatusIcon(token.whitelistStatus)"
            class="mr-1"
          ></i>
          {{ getWhitelistStatusLabel(token.whitelistStatus) }}
        </div>
      </div>
      
      <button
        class="px-3 py-1.5 bg-biatec-accent/20 text-biatec-accent hover:bg-biatec-accent/30 rounded-lg text-sm font-medium transition-colors"
        @click.stop="$emit('view-details', token)"
      >
        View Details
        <i class="pi pi-arrow-right ml-1 text-xs"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MarketplaceToken } from '../stores/marketplace';
import PriceDisplay from './PriceDisplay.vue';

defineProps<{
  token: MarketplaceToken;
}>();

defineEmits<{
  'select': [token: MarketplaceToken];
  'view-details': [token: MarketplaceToken];
}>();

const formatSupply = (supply: number): string => {
  if (supply >= 1000000) {
    return (supply / 1000000).toFixed(1) + 'M';
  } else if (supply >= 1000) {
    return (supply / 1000).toFixed(1) + 'K';
  }
  return supply.toString();
};

const getBadgeClass = (badge: string): string => {
  if (badge.includes('MICA')) {
    return 'bg-blue-500/20 text-blue-400';
  }
  if (badge.includes('KYC')) {
    return 'bg-green-500/20 text-green-400';
  }
  if (badge.includes('Whitelisted')) {
    return 'bg-purple-500/20 text-purple-400';
  }
  return 'bg-gray-500/20 text-gray-400';
};

const getBadgeIcon = (badge: string): string => {
  if (badge.includes('MICA')) {
    return 'pi pi-shield-check';
  }
  if (badge.includes('KYC')) {
    return 'pi pi-verified';
  }
  if (badge.includes('Whitelisted')) {
    return 'pi pi-list-check';
  }
  return 'pi pi-tag';
};

const getWhitelistStatusClass = (status: string): string => {
  switch (status) {
    case 'enabled':
      return 'bg-green-500/20 text-green-400';
    case 'partial':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'disabled':
      return 'bg-gray-500/20 text-gray-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

const getWhitelistStatusIcon = (status: string): string => {
  switch (status) {
    case 'enabled':
      return 'pi pi-check-circle';
    case 'partial':
      return 'pi pi-exclamation-circle';
    case 'disabled':
      return 'pi pi-times-circle';
    default:
      return 'pi pi-circle';
  }
};

const getWhitelistStatusLabel = (status: string): string => {
  switch (status) {
    case 'enabled':
      return 'Whitelist: Enabled';
    case 'partial':
      return 'Whitelist: Partial';
    case 'disabled':
      return 'Whitelist: Disabled';
    default:
      return 'Whitelist: Unknown';
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.marketplace-token-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.marketplace-token-card:hover {
  transform: translateY(-2px);
}
</style>
