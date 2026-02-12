<template>
  <div class="glass-effect rounded-xl p-6">
    <div class="flex items-start justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <i class="pi pi-users text-biatec-accent"></i>
          Whitelist Status
        </h2>
        <p class="text-sm text-gray-400 mt-1">Address whitelist enforcement and coverage</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
        <p class="text-gray-400">Loading whitelist status...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-3"></i>
      <h3 class="text-lg font-semibold text-red-400 mb-2">Failed to Load Whitelist Status</h3>
      <p class="text-sm text-gray-400 mb-4">{{ error }}</p>
      <button
        @click="loadWhitelistStatus"
        class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Success State -->
    <div v-else-if="whitelistStatus">
      <!-- Enforcement Status Card -->
      <div class="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-400 mb-2">Enforcement Status</div>
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-4 h-4 rounded-full',
                  whitelistStatus.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                ]"
              ></div>
              <span
                :class="[
                  'text-2xl font-bold',
                  whitelistStatus.enabled ? 'text-green-400' : 'text-gray-400'
                ]"
              >
                {{ whitelistStatus.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <div class="text-sm text-gray-400 mt-2">
              {{ whitelistStatus.enabled 
                ? 'Only whitelisted addresses can receive tokens' 
                : 'All addresses can receive tokens without restrictions' 
              }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-400">Last Updated</div>
            <div class="text-white font-medium">{{ formatTimestamp(whitelistStatus.lastUpdated) }}</div>
          </div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white/5 rounded-lg p-4">
          <div class="text-3xl font-bold text-white mb-1">{{ whitelistStatus.totalAddresses.toLocaleString() }}</div>
          <div class="text-xs text-gray-400">Total Addresses</div>
        </div>

        <div class="bg-white/5 rounded-lg p-4">
          <div class="text-3xl font-bold text-green-400 mb-1">{{ whitelistStatus.activeAddresses.toLocaleString() }}</div>
          <div class="text-xs text-gray-400">Active</div>
        </div>

        <div class="bg-white/5 rounded-lg p-4">
          <div class="text-3xl font-bold text-yellow-400 mb-1">{{ whitelistStatus.pendingAddresses.toLocaleString() }}</div>
          <div class="text-xs text-gray-400">Pending</div>
        </div>

        <div class="bg-white/5 rounded-lg p-4">
          <div class="text-3xl font-bold text-blue-400 mb-1">{{ whitelistStatus.coveragePercentage }}%</div>
          <div class="text-xs text-gray-400">Coverage</div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white/5 rounded-lg p-4 mb-6">
        <h3 class="text-sm font-semibold text-white mb-3">Recent Activity</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-plus-circle text-green-400"></i>
              <span class="text-sm text-gray-300">Recently Added</span>
            </div>
            <span class="text-lg font-bold text-white">{{ whitelistStatus.recentlyAdded }}</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-minus-circle text-red-400"></i>
              <span class="text-sm text-gray-300">Recently Removed</span>
            </div>
            <span class="text-lg font-bold text-white">{{ whitelistStatus.recentlyRemoved }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <button
          @click="navigateToWhitelist"
          class="w-full px-6 py-4 bg-gradient-to-r from-biatec-accent/20 to-biatec-accent/30 hover:from-biatec-accent/30 hover:to-biatec-accent/40 text-white rounded-lg transition-all flex items-center justify-between group"
          aria-label="Manage whitelist addresses"
        >
          <span class="font-medium">Manage Whitelist</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-300">View & edit addresses</span>
            <i class="pi pi-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </div>
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            @click="navigateToJurisdiction"
            class="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            aria-label="Configure jurisdiction rules"
          >
            <i class="pi pi-globe"></i>
            <span class="text-sm">Jurisdiction Rules</span>
          </button>

          <button
            @click="navigateToBulkImport"
            class="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            aria-label="Bulk import addresses"
          >
            <i class="pi pi-upload"></i>
            <span class="text-sm">Bulk Import</span>
          </button>
        </div>
      </div>

      <!-- Info Box -->
      <div class="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
          <div class="text-sm text-gray-300">
            <strong class="text-blue-400">Whitelist Compliance</strong>
            <p class="mt-1">
              When whitelist enforcement is enabled, only approved addresses can receive tokens.
              This helps ensure compliance with KYC/AML requirements and jurisdiction restrictions.
              Coverage indicates the percentage of token holders that are actively whitelisted.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <i class="pi pi-users text-4xl text-gray-500 mb-4"></i>
      <h3 class="text-lg font-semibold text-gray-400 mb-2">No Whitelist Data</h3>
      <p class="text-sm text-gray-500 mb-6">Configure whitelist settings to start managing approved addresses.</p>
      <button
        @click="navigateToWhitelist"
        class="px-6 py-3 bg-biatec-accent/20 hover:bg-biatec-accent/30 text-biatec-accent rounded-lg transition-colors"
      >
        Set Up Whitelist
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface WhitelistStatusData {
  enabled: boolean;
  totalAddresses: number;
  activeAddresses: number;
  pendingAddresses: number;
  coveragePercentage: number;
  recentlyAdded: number;
  recentlyRemoved: number;
  lastUpdated: string;
}

const props = defineProps<{
  tokenId?: string;
  network?: string;
}>();

const emit = defineEmits<{
  navigateToWhitelist: [];
  navigateToJurisdiction: [];
  navigateToBulkImport: [];
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const whitelistStatus = ref<WhitelistStatusData | null>(null);

const loadWhitelistStatus = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock whitelist status data
    whitelistStatus.value = {
      enabled: true,
      totalAddresses: 342,
      activeAddresses: 318,
      pendingAddresses: 24,
      coveragePercentage: 93,
      recentlyAdded: 12,
      recentlyRemoved: 3,
      lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load whitelist status';
    console.error('Error loading whitelist status:', err);
  } finally {
    loading.value = false;
  }
};

const navigateToWhitelist = () => {
  emit('navigateToWhitelist');
};

const navigateToJurisdiction = () => {
  emit('navigateToJurisdiction');
};

const navigateToBulkImport = () => {
  emit('navigateToBulkImport');
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
};

onMounted(() => {
  loadWhitelistStatus();
});
</script>
