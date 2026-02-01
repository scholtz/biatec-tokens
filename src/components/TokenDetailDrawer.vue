<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-hidden"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          @click="$emit('close')"
        ></div>

        <!-- Drawer -->
        <div class="absolute inset-y-0 right-0 max-w-full flex">
          <div
            class="relative w-screen max-w-2xl"
            @click.stop
          >
            <div class="h-full flex flex-col bg-gray-900 shadow-xl overflow-y-auto">
              <!-- Header -->
              <div class="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
                <div class="flex items-start justify-between">
                  <div class="flex items-center space-x-4">
                    <div
                      class="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-biatec-accent to-biatec-teal flex items-center justify-center flex-shrink-0"
                    >
                      <img
                        v-if="token.imageUrl"
                        :src="token.imageUrl"
                        :alt="token.name"
                        class="w-full h-full object-cover"
                      />
                      <i v-else class="pi pi-image text-white text-3xl"></i>
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold text-white">{{ token.name }}</h2>
                      <p class="text-gray-300">{{ token.symbol }}</p>
                      <p v-if="token.issuer" class="text-sm text-gray-400 mt-1">
                        by {{ token.issuer }}
                      </p>
                    </div>
                  </div>
                  <button
                    @click="$emit('close')"
                    class="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Close drawer"
                  >
                    <i class="pi pi-times text-white text-xl"></i>
                  </button>
                </div>

                <!-- Price Info -->
                <div v-if="token.price" class="mt-4 flex items-center justify-between">
                  <div>
                    <div class="text-3xl font-bold text-white">${{ formatPrice(token.price) }}</div>
                    <div
                      v-if="token.priceChange24h !== undefined"
                      :class="[
                        'text-sm font-medium mt-1',
                        token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                      ]"
                    >
                      <i :class="token.priceChange24h >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                      {{ token.priceChange24h >= 0 ? '+' : '' }}{{ token.priceChange24h.toFixed(2) }}% (24h)
                    </div>
                  </div>
                  
                  <div class="flex space-x-2">
                    <button
                      class="px-4 py-2 bg-biatec-accent text-gray-900 rounded-lg font-medium hover:bg-biatec-accent/90 transition-colors"
                    >
                      <i class="pi pi-shopping-cart mr-2"></i>
                      Trade
                    </button>
                    <button
                      class="px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                    >
                      <i class="pi pi-heart mr-2"></i>
                      Watch
                    </button>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 px-6 py-6 space-y-6">
                <!-- Description -->
                <section>
                  <h3 class="text-lg font-semibold text-white mb-3">About</h3>
                  <p class="text-gray-300 leading-relaxed">{{ token.description }}</p>
                </section>

                <!-- Compliance Badges -->
                <section v-if="token.complianceBadges && token.complianceBadges.length > 0">
                  <h3 class="text-lg font-semibold text-white mb-3">Compliance</h3>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="badge in token.complianceBadges"
                      :key="badge"
                      :class="getBadgeClass(badge)"
                      class="px-3 py-1.5 text-sm font-medium rounded-lg"
                    >
                      <i :class="getBadgeIcon(badge)" class="mr-2"></i>
                      {{ badge }}
                    </span>
                  </div>
                  
                  <div class="mt-4 space-y-2">
                    <div v-if="token.isMicaCompliant" class="flex items-start space-x-2 text-sm">
                      <i class="pi pi-check-circle text-green-400 mt-0.5"></i>
                      <span class="text-gray-300">MICA compliant for EU markets</span>
                    </div>
                    <div v-if="token.kycRequired" class="flex items-start space-x-2 text-sm">
                      <i class="pi pi-shield-check text-blue-400 mt-0.5"></i>
                      <span class="text-gray-300">KYC verification required for trading</span>
                    </div>
                    <div v-if="token.whitelistStatus === 'enabled'" class="flex items-start space-x-2 text-sm">
                      <i class="pi pi-list-check text-purple-400 mt-0.5"></i>
                      <span class="text-gray-300">Restricted to whitelisted addresses</span>
                    </div>
                  </div>
                </section>

                <!-- Token Details -->
                <section>
                  <h3 class="text-lg font-semibold text-white mb-3">Token Details</h3>
                  <div class="glass-effect rounded-lg p-4 space-y-3">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Network</span>
                      <span class="text-white font-medium">{{ token.network || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Standard</span>
                      <span class="text-white font-medium">{{ token.standard }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Type</span>
                      <span class="text-white font-medium">{{ token.type === 'FT' ? 'Fungible Token' : 'NFT' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Total Supply</span>
                      <span class="text-white font-medium">{{ formatSupply(token.supply) }}</span>
                    </div>
                    <div v-if="token.decimals !== undefined" class="flex justify-between">
                      <span class="text-gray-400">Decimals</span>
                      <span class="text-white font-medium">{{ token.decimals }}</span>
                    </div>
                    <div v-if="token.assetId" class="flex justify-between">
                      <span class="text-gray-400">Asset ID</span>
                      <span class="text-biatec-accent font-mono text-sm">{{ token.assetId }}</span>
                    </div>
                    <div v-if="token.contractAddress" class="flex justify-between">
                      <span class="text-gray-400">Contract Address</span>
                      <span class="text-biatec-accent font-mono text-sm break-all">{{ token.contractAddress }}</span>
                    </div>
                  </div>
                </section>

                <!-- Whitelist Status -->
                <section v-if="token.whitelistStatus">
                  <h3 class="text-lg font-semibold text-white mb-3">Transfer Restrictions</h3>
                  <div
                    :class="getWhitelistStatusClass(token.whitelistStatus)"
                    class="glass-effect rounded-lg p-4"
                  >
                    <div class="flex items-center space-x-3">
                      <i
                        :class="getWhitelistStatusIcon(token.whitelistStatus)"
                        class="text-2xl"
                      ></i>
                      <div>
                        <div class="font-semibold">
                          {{ getWhitelistStatusLabel(token.whitelistStatus) }}
                        </div>
                        <div class="text-sm opacity-80 mt-1">
                          {{ getWhitelistStatusDescription(token.whitelistStatus) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Additional Info -->
                <section>
                  <h3 class="text-lg font-semibold text-white mb-3">Additional Information</h3>
                  <div class="glass-effect rounded-lg p-4 space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Created</span>
                      <span class="text-white">{{ formatDate(token.createdAt) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Status</span>
                      <span :class="getStatusClass(token.status)" class="font-medium capitalize">
                        {{ token.status }}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MarketplaceToken } from '../stores/marketplace';

defineProps<{
  token: MarketplaceToken;
  show: boolean;
}>();

defineEmits<{
  'close': [];
}>();

const formatPrice = (price: number): string => {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSupply = (supply: number): string => {
  return supply.toLocaleString('en-US');
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getBadgeClass = (badge: string): string => {
  if (badge.includes('MICA')) {
    return 'bg-blue-500/20 text-blue-400 border border-blue-400/30';
  }
  if (badge.includes('KYC')) {
    return 'bg-green-500/20 text-green-400 border border-green-400/30';
  }
  if (badge.includes('Whitelisted')) {
    return 'bg-purple-500/20 text-purple-400 border border-purple-400/30';
  }
  return 'bg-gray-500/20 text-gray-400 border border-gray-400/30';
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
      return 'text-green-400';
    case 'partial':
      return 'text-yellow-400';
    case 'disabled':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

const getWhitelistStatusIcon = (status: string): string => {
  switch (status) {
    case 'enabled':
      return 'pi pi-lock';
    case 'partial':
      return 'pi pi-exclamation-triangle';
    case 'disabled':
      return 'pi pi-unlock';
    default:
      return 'pi pi-circle';
  }
};

const getWhitelistStatusLabel = (status: string): string => {
  switch (status) {
    case 'enabled':
      return 'Whitelist Enabled';
    case 'partial':
      return 'Partial Restrictions';
    case 'disabled':
      return 'No Restrictions';
    default:
      return 'Unknown Status';
  }
};

const getWhitelistStatusDescription = (status: string): string => {
  switch (status) {
    case 'enabled':
      return 'This token can only be transferred between whitelisted addresses.';
    case 'partial':
      return 'Some transfer restrictions apply. Check with the issuer for details.';
    case 'disabled':
      return 'This token can be freely transferred without restrictions.';
    default:
      return 'Status unknown.';
  }
};

const getStatusClass = (status: string): string => {
  switch (status) {
    case 'deployed':
      return 'text-green-400';
    case 'deploying':
      return 'text-yellow-400';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .relative,
.drawer-leave-to .relative {
  transform: translateX(100%);
}

.drawer-enter-active .relative,
.drawer-leave-active .relative {
  transition: transform 0.3s ease;
}
</style>
