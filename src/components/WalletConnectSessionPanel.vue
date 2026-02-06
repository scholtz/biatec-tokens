<template>
  <div class="walletconnect-session-panel">
    <!-- Active Session Display -->
    <div v-if="isConnected && currentSession" class="glass-effect rounded-xl p-5 border border-white/10">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <i class="pi pi-check-circle text-xl text-green-400"></i>
          </div>
          <div>
            <div class="text-white font-semibold">WalletConnect Active</div>
            <div class="text-sm text-gray-400">Session established</div>
          </div>
        </div>
        <button
          @click="handleDisconnect"
          class="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
        >
          Disconnect
        </button>
      </div>

      <!-- Session Details -->
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span class="text-sm text-gray-400">Network</span>
          <span class="text-sm text-white font-medium">{{ networkName }}</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span class="text-sm text-gray-400">Address</span>
          <span class="text-sm text-white font-mono">{{ formattedAddress }}</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span class="text-sm text-gray-400">Connected</span>
          <span class="text-sm text-white">{{ connectedTime }}</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span class="text-sm text-gray-400">Last Activity</span>
          <span class="text-sm text-white">{{ lastActivityTime }}</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span class="text-sm text-gray-400">Expires</span>
          <span class="text-sm text-white">{{ expiryTime }}</span>
        </div>
      </div>
    </div>

    <!-- No Session State -->
    <div v-else class="glass-effect rounded-xl p-5 border border-white/10">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
          <i class="pi pi-qrcode text-xl text-gray-400"></i>
        </div>
        <div>
          <div class="text-white font-semibold">No Active Session</div>
          <div class="text-sm text-gray-400">Connect with WalletConnect</div>
        </div>
      </div>
      
      <button
        @click="$emit('connect')"
        class="w-full px-6 py-3 rounded-lg bg-biatec-accent hover:bg-biatec-accent-dark transition-colors text-white font-medium flex items-center justify-center gap-2"
      >
        <i class="pi pi-qrcode"></i>
        <span>Connect WalletConnect</span>
      </button>
    </div>

    <!-- Session Statistics -->
    <div v-if="stats.totalSessions > 0" class="mt-4 p-4 bg-white/5 rounded-lg">
      <div class="text-sm font-medium text-gray-300 mb-3">Session Statistics</div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <div class="text-xs text-gray-400">Active</div>
          <div class="text-lg font-bold text-green-400">{{ stats.activeSessions }}</div>
        </div>
        <div>
          <div class="text-xs text-gray-400">Expired</div>
          <div class="text-lg font-bold text-red-400">{{ stats.expiredSessions }}</div>
        </div>
        <div>
          <div class="text-xs text-gray-400">Total</div>
          <div class="text-lg font-bold text-white">{{ stats.totalSessions }}</div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-red-400 mt-0.5"></i>
        <div class="flex-1">
          <div class="text-sm font-medium text-red-400">Connection Error</div>
          <div class="text-xs text-gray-400 mt-1">{{ error }}</div>
          <button
            @click="clearError"
            class="mt-2 text-xs text-red-400 hover:text-red-300 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { WalletConnectSession, WalletConnectSessionStats } from '../services/WalletConnectService';

interface Props {
  isConnected: boolean;
  currentSession: WalletConnectSession | null;
  stats: WalletConnectSessionStats;
  error: string | null;
}

interface Emits {
  (e: 'connect'): void;
  (e: 'disconnect'): void;
  (e: 'clearError'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Format address for display
 */
const formattedAddress = computed(() => {
  if (!props.currentSession?.address) return '';
  const addr = props.currentSession.address;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
});

/**
 * Get network display name
 */
const networkName = computed(() => {
  if (!props.currentSession?.networkId) return '';
  const networkNames: Record<string, string> = {
    'algorand-mainnet': 'Algorand Mainnet',
    'algorand-testnet': 'Algorand Testnet',
    'voi-mainnet': 'VOI Mainnet',
    'aramidmain': 'Aramid Mainnet',
    'ethereum': 'Ethereum',
    'arbitrum': 'Arbitrum',
    'base': 'Base',
    'sepolia': 'Sepolia',
  };
  return networkNames[props.currentSession.networkId] || props.currentSession.networkId;
});

/**
 * Format timestamp for display
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Format expiry time
 */
function formatExpiry(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h`;
  return 'Soon';
}

const connectedTime = computed(() => {
  if (!props.currentSession) return '';
  return formatTime(props.currentSession.connectedAt);
});

const lastActivityTime = computed(() => {
  if (!props.currentSession) return '';
  return formatTime(props.currentSession.lastActivityAt);
});

const expiryTime = computed(() => {
  if (!props.currentSession) return '';
  return formatExpiry(props.currentSession.expiresAt);
});

function handleDisconnect() {
  emit('disconnect');
}

function clearError() {
  emit('clearError');
}
</script>

<style scoped>
.walletconnect-session-panel {
  /* Component-specific styles */
}
</style>
