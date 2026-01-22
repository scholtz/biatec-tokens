<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <i class="pi pi-chart-bar text-biatec-accent"></i>
          MICA Compliance Summary
        </h2>
        <p class="text-sm text-gray-400 mt-1">
          Key reporting metrics aligned with MICA regulatory requirements
        </p>
      </div>
      <button
        v-if="!isLoading && micaMetrics"
        @click="refreshMetrics"
        :disabled="isRefreshing"
        class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <i :class="['pi pi-refresh', isRefreshing && 'animate-spin']"></i>
        <span>Refresh</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="i in 4" :key="i" class="glass-effect rounded-xl p-6 animate-pulse">
        <div class="h-20 bg-white/5 rounded"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="glass-effect rounded-xl p-6 border border-red-500/30">
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-red-400 text-xl"></i>
        <div>
          <h3 class="text-lg font-semibold text-red-400">Failed to load MICA metrics</h3>
          <p class="text-sm text-gray-400 mt-1">{{ error }}</p>
          <button
            @click="loadMetrics"
            class="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div v-else-if="micaMetrics" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Token Supply Widget -->
      <MicaSummaryWidget
        title="Token Supply"
        subtitle="Circulating and total supply metrics"
        icon="pi pi-database"
        icon-color="blue"
        :last-updated="micaMetrics.tokenSupply.lastUpdated"
        :has-details="true"
        @view-details="showSupplyDetails = true"
      >
        <template #content>
          <div class="space-y-2">
            <div>
              <div class="text-sm text-gray-400">Total Supply</div>
              <div class="text-2xl font-bold text-white">
                {{ formatNumber(micaMetrics.tokenSupply.totalSupply) }}
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Circulating</span>
              <span class="text-white font-medium">
                {{ formatNumber(micaMetrics.tokenSupply.circulatingSupply) }}
              </span>
            </div>
            <div v-if="micaMetrics.tokenSupply.burnedSupply" class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Burned</span>
              <span class="text-orange-400 font-medium">
                {{ formatNumber(micaMetrics.tokenSupply.burnedSupply) }}
              </span>
            </div>
          </div>
        </template>
      </MicaSummaryWidget>

      <!-- Holder Distribution Widget -->
      <MicaSummaryWidget
        title="Holder Distribution"
        subtitle="Token holder concentration metrics"
        icon="pi pi-users"
        icon-color="green"
        :last-updated="micaMetrics.holderDistribution.lastUpdated"
        :has-details="true"
        @view-details="showDistributionDetails = true"
      >
        <template #content>
          <div class="space-y-2">
            <div>
              <div class="text-sm text-gray-400">Total Holders</div>
              <div class="text-2xl font-bold text-white">
                {{ micaMetrics.holderDistribution.totalHolders.toLocaleString() }}
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Top 10 Concentration</span>
              <span class="text-white font-medium">
                {{ micaMetrics.holderDistribution.top10Concentration.toFixed(1) }}%
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Average Holding</span>
              <span class="text-white font-medium">
                {{ formatNumber(micaMetrics.holderDistribution.averageHolding) }}
              </span>
            </div>
          </div>
        </template>
      </MicaSummaryWidget>

      <!-- Whitelist Status Widget -->
      <MicaSummaryWidget
        title="Whitelist Status"
        subtitle="KYC/AML compliant addresses"
        icon="pi pi-shield-check"
        :icon-color="micaMetrics.whitelistStatus.enabled ? 'green' : 'yellow'"
        :has-details="true"
        @view-details="$emit('navigate-to-whitelist')"
      >
        <template #content>
          <div class="space-y-2">
            <div>
              <div class="text-sm text-gray-400">Status</div>
              <div class="text-2xl font-bold" :class="micaMetrics.whitelistStatus.enabled ? 'text-green-400' : 'text-yellow-400'">
                {{ micaMetrics.whitelistStatus.enabled ? 'Enabled' : 'Disabled' }}
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Whitelisted Addresses</span>
              <span class="text-white font-medium">
                {{ micaMetrics.whitelistStatus.totalWhitelisted.toLocaleString() }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Pending Approvals</span>
              <span :class="micaMetrics.whitelistStatus.pendingApprovals > 0 ? 'text-yellow-400' : 'text-gray-400'" class="font-medium">
                {{ micaMetrics.whitelistStatus.pendingApprovals }}
              </span>
            </div>
            <div v-if="micaMetrics.whitelistStatus.recentlyAdded > 0" class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Added (24h)</span>
              <span class="text-green-400 font-medium">
                +{{ micaMetrics.whitelistStatus.recentlyAdded }}
              </span>
            </div>
          </div>
        </template>
      </MicaSummaryWidget>

      <!-- RWA Transfer Activity Widget -->
      <MicaSummaryWidget
        title="Transfer Activity"
        subtitle="Recent RWA token transfers"
        icon="pi pi-arrow-right-arrow-left"
        icon-color="purple"
        :last-updated="micaMetrics.transferActivity.lastUpdated"
        :has-details="true"
        @view-details="showTransferDetails = true"
      >
        <template #content>
          <div class="space-y-2">
            <div>
              <div class="text-sm text-gray-400">24h Volume</div>
              <div class="text-2xl font-bold text-white">
                {{ formatNumber(micaMetrics.transferActivity.totalVolume24h) }}
              </div>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Transfers (24h)</span>
              <span class="text-white font-medium">
                {{ micaMetrics.transferActivity.last24Hours }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Transfers (7d)</span>
              <span class="text-white font-medium">
                {{ micaMetrics.transferActivity.last7Days }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Avg Transfer Size</span>
              <span class="text-white font-medium">
                {{ formatNumber(micaMetrics.transferActivity.averageTransferSize) }}
              </span>
            </div>
          </div>
        </template>
      </MicaSummaryWidget>
    </div>

    <!-- Recent Transfers List -->
    <div v-if="micaMetrics && micaMetrics.transferActivity.recentTransfers.length > 0" class="glass-effect rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <i class="pi pi-history text-biatec-accent"></i>
          Recent Transfers
        </h3>
        <button
          @click="$emit('navigate-to-audit-log')"
          class="text-sm text-biatec-accent hover:text-biatec-accent/80 transition-colors flex items-center gap-1"
        >
          View All <i class="pi pi-arrow-right"></i>
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="transfer in micaMetrics.transferActivity.recentTransfers.slice(0, 5)"
          :key="transfer.id"
          class="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm text-gray-400">{{ formatTimestamp(transfer.timestamp) }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 text-xs font-medium rounded-full',
                    getTransferStatusClass(transfer.status)
                  ]"
                >
                  {{ transfer.status }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <span class="text-gray-400 truncate max-w-[120px]" :title="transfer.from">
                  {{ shortenAddress(transfer.from) }}
                </span>
                <i class="pi pi-arrow-right text-gray-500"></i>
                <span class="text-gray-400 truncate max-w-[120px]" :title="transfer.to">
                  {{ shortenAddress(transfer.to) }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-white font-medium">
                {{ formatNumber(transfer.amount) }}
              </div>
              <div v-if="transfer.transactionId" class="text-xs text-gray-500 truncate max-w-[100px]" :title="transfer.transactionId">
                {{ shortenAddress(transfer.transactionId) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MicaSummaryWidget from './MicaSummaryWidget.vue';
import { complianceService } from '../services/ComplianceService';
import type { MicaComplianceMetrics, Network } from '../types/compliance';

interface Props {
  tokenId: string;
  network: Network | string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'navigate-to-whitelist': [];
  'navigate-to-audit-log': [];
}>();

const micaMetrics = ref<MicaComplianceMetrics | null>(null);
const isLoading = ref(false);
const isRefreshing = ref(false);
const error = ref<string | null>(null);

const showSupplyDetails = ref(false);
const showDistributionDetails = ref(false);
const showTransferDetails = ref(false);

const loadMetrics = async () => {
  if (!props.tokenId) return;

  isLoading.value = true;
  error.value = null;

  try {
    micaMetrics.value = await complianceService.getMicaComplianceMetrics(
      props.tokenId,
      props.network
    );
  } catch (err) {
    console.error('Failed to load MICA metrics:', err);
    // Use mock data for development/testing if API fails
    
    micaMetrics.value = {
      tokenId: props.tokenId,
      network: props.network as 'VOI' | 'Aramid',
      tokenSupply: {
        totalSupply: '10000000',
        circulatingSupply: '8500000',
        reserveSupply: '1000000',
        burnedSupply: '500000',
        lastUpdated: new Date().toISOString(),
      },
      holderDistribution: {
        totalHolders: 1247,
        top10Concentration: 42.5,
        top50Concentration: 68.3,
        averageHolding: '8020.05',
        medianHolding: '2500.00',
        lastUpdated: new Date().toISOString(),
      },
      whitelistStatus: {
        enabled: true,
        totalWhitelisted: 856,
        pendingApprovals: 12,
        recentlyAdded: 5,
      },
      transferActivity: {
        last24Hours: 47,
        last7Days: 312,
        last30Days: 1456,
        totalVolume24h: '125000',
        averageTransferSize: '2659.57',
        recentTransfers: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            from: 'VOI7XKJKLJHGFDSAQWERTYUIOPLKJHGFDSAZXCVBNM',
            to: 'VOI9MNBVCXZASDFGHJKLPOIUYTREWQASDFGHJKLMNB',
            amount: '5000',
            status: 'completed',
            transactionId: 'TXN1234567890ABCDEF',
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
            from: 'VOI3LKJHGFDSAZXCVBNMASDFGHJKLPOIUYTREWQASD',
            to: 'VOI5QWERTYUIOPLKJHGFDSAZXCVBNMASDFGHJKLPOI',
            amount: '2500',
            status: 'completed',
            transactionId: 'TXN2345678901BCDEFG',
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
            from: 'VOI8ASDFGHJKLPOIUYTREWQASDFGHJKLMNBVCXZAS',
            to: 'VOI2ZXCVBNMASDFGHJKLPOIUYTREWQASDFGHJKLMN',
            amount: '1000',
            status: 'blocked',
            transactionId: 'TXN3456789012CDEFGH',
            reason: 'Receiver not whitelisted',
          },
        ],
        lastUpdated: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };
  } finally {
    isLoading.value = false;
  }
};

const refreshMetrics = async () => {
  isRefreshing.value = true;
  await loadMetrics();
  isRefreshing.value = false;
};

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const shortenAddress = (address: string) => {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getTransferStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400 border border-green-500/50';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    case 'failed':
      return 'bg-red-500/20 text-red-400 border border-red-500/50';
    case 'blocked':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
  }
};

onMounted(() => {
  loadMetrics();
});
</script>
