<template>
  <div class="glass-effect rounded-xl p-6 border border-white/10">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-semibold text-white flex items-center gap-2">
        <i class="pi pi-wallet text-biatec-accent"></i>
        Wallet & Network
      </h3>
      <div v-if="isConnected" class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        <span class="text-sm text-green-400">Connected</span>
      </div>
    </div>

    <!-- Wallet Connection Status -->
    <div v-if="!isConnected" class="text-center py-8">
      <i class="pi pi-wallet text-5xl text-gray-400 mb-4"></i>
      <p class="text-gray-300 mb-4">Sign in to deploy tokens</p>
      <button
        @click="emit('connect-wallet')"
        class="btn-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
        data-testid="connect-wallet-btn"
      >
        <i class="pi pi-link"></i>
        <span>Sign In</span>
      </button>
    </div>

    <!-- Wallet Connected View -->
    <div v-else class="space-y-4">
      <!-- Connected Wallet Info -->
      <div class="p-4 bg-gradient-to-br from-white/5 to-white/10 rounded-lg border border-white/10">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-300">Connected Wallet</span>
          <button
            @click="emit('disconnect-wallet')"
            class="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <i class="pi pi-power-off mr-1"></i>
            Disconnect
          </button>
        </div>
        <div class="flex items-center justify-between">
          <code class="text-sm text-white font-mono">{{ formattedAddress }}</code>
          <button
            @click="copyAddress"
            class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Copy address"
          >
            <i class="pi pi-copy"></i>
          </button>
        </div>
      </div>

      <!-- Current Network Display -->
      <div class="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <i class="pi pi-server text-biatec-accent"></i>
            <span class="text-sm font-medium text-gray-300">Current Network</span>
          </div>
          <button
            @click="showNetworkSwitcher = !showNetworkSwitcher"
            class="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
          >
            <i class="pi pi-refresh mr-1"></i>
            Switch Network
          </button>
        </div>

        <!-- Network Details -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-white font-semibold text-lg">{{ networkInfo?.displayName }}</span>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="
                networkInfo?.isTestnet
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              "
            >
              {{ networkInfo?.isTestnet ? 'Testnet' : 'Mainnet' }}
            </span>
          </div>

          <!-- Network Properties -->
          <div class="space-y-1 text-xs text-gray-400">
            <div v-if="networkInfo?.chainType === 'AVM'" class="flex items-center gap-2">
              <i class="pi pi-globe"></i>
              <span class="truncate">{{ networkInfo?.algodUrl }}</span>
            </div>
            <div v-if="networkInfo?.chainType === 'AVM'" class="flex items-center gap-2">
              <i class="pi pi-tag"></i>
              <span>{{ networkInfo?.genesisId }}</span>
            </div>
            <div v-if="networkInfo?.chainType === 'EVM'" class="flex items-center gap-2">
              <i class="pi pi-link"></i>
              <span class="truncate">{{ networkInfo?.rpcUrl }}</span>
            </div>
            <div v-if="networkInfo?.chainType === 'EVM'" class="flex items-center gap-2">
              <i class="pi pi-hashtag"></i>
              <span>Chain ID: {{ networkInfo?.chainId }}</span>
            </div>
          </div>

          <!-- Network Compliance Badge -->
          <div class="pt-2 border-t border-white/10">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400">Network Compliance:</span>
              <span
                class="px-2 py-1 text-xs font-medium rounded"
                :class="complianceBadgeClass"
              >
                {{ complianceLabel }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Switcher (collapsible) -->
      <Transition name="expand">
        <div v-if="showNetworkSwitcher" class="space-y-3">
          <!-- AVM Networks Section -->
          <div>
            <div class="text-sm font-medium text-gray-300 mb-2 border-b border-white/10 pb-1">
              AVM Chains (Algorand-based)
            </div>
            
            <div class="space-y-2">
              <button
                v-for="network in avmNetworks"
                :key="network.id"
                @click="handleNetworkSwitch(network.id)"
                :disabled="network.id === currentNetwork"
                class="w-full p-4 rounded-lg text-left transition-all border-2"
                :class="[
                  network.id === currentNetwork
                    ? 'border-biatec-accent bg-biatec-accent/10 cursor-not-allowed'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-white font-medium">{{ network.displayName }}</span>
                      <span
                        v-if="network.id === currentNetwork"
                        class="px-2 py-0.5 text-xs bg-biatec-accent/30 text-biatec-accent rounded"
                      >
                        Current
                      </span>
                      <span
                        v-if="!network.isTestnet"
                        class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400"
                      >
                        Mainnet
                      </span>
                    </div>
                    <div class="text-xs text-gray-400">{{ network.genesisId }}</div>
                  </div>
                  <i
                    v-if="network.id === currentNetwork"
                    class="pi pi-check-circle text-biatec-accent text-lg"
                  ></i>
                  <i
                    v-else
                    class="pi pi-arrow-right text-gray-400"
                  ></i>
                </div>
              </button>
            </div>
          </div>

          <!-- EVM Networks Section -->
          <div>
            <div class="text-sm font-medium text-gray-300 mb-2 border-b border-white/10 pb-1">
              EVM Chains (Ethereum-based)
            </div>
            
            <div class="space-y-2">
              <button
                v-for="network in evmNetworks"
                :key="network.id"
                @click="handleNetworkSwitch(network.id)"
                :disabled="network.id === currentNetwork"
                class="w-full p-4 rounded-lg text-left transition-all border-2"
                :class="[
                  network.id === currentNetwork
                    ? 'border-biatec-accent bg-biatec-accent/10 cursor-not-allowed'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-white font-medium">{{ network.displayName }}</span>
                      <span
                        v-if="network.id === currentNetwork"
                        class="px-2 py-0.5 text-xs bg-biatec-accent/30 text-biatec-accent rounded"
                      >
                        Current
                      </span>
                      <span
                        v-if="!network.isTestnet"
                        class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400"
                      >
                        Mainnet
                      </span>
                    </div>
                    <div class="text-xs text-gray-400">Chain ID: {{ network.chainId }}</div>
                  </div>
                  <i
                    v-if="network.id === currentNetwork"
                    class="pi pi-check-circle text-biatec-accent text-lg"
                  ></i>
                  <i
                    v-else
                    class="pi pi-arrow-right text-gray-400"
                  ></i>
                </div>
              </button>
            </div>
          </div>

          <!-- Warning about network switch -->
          <div class="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div class="flex items-start gap-2">
              <i class="pi pi-exclamation-triangle text-yellow-400 text-sm mt-0.5"></i>
              <p class="text-xs text-gray-300">
                <strong class="text-yellow-400">Note:</strong> Switching networks will disconnect your wallet. 
                You'll need to reconnect after switching to ensure compatibility.
              </p>
            </div>
          </div>

          <!-- Cancel button -->
          <button
            @click="showNetworkSwitcher = false"
            class="w-full px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWalletManager, AVM_NETWORKS, EVM_NETWORKS, type NetworkId } from '../composables/useWalletManager';

const emit = defineEmits<{
  'connect-wallet': [];
  'disconnect-wallet': [];
  'network-switched': [networkId: NetworkId];
}>();

const { 
  isConnected, 
  activeAddress, 
  formattedAddress, 
  networkInfo, 
  currentNetwork,
  switchNetwork 
} = useWalletManager();

const showNetworkSwitcher = ref(false);
const avmNetworks = computed(() => Object.values(AVM_NETWORKS));
const evmNetworks = computed(() => Object.values(EVM_NETWORKS));

const complianceLabel = computed(() => {
  const networkName = networkInfo.value?.name;
  if (networkName === 'voi-mainnet' || networkName === 'aramidmain' || networkName === 'algorand-mainnet') {
    return 'Enterprise Ready';
  } else if (networkName === 'dockernet' || networkName === 'algorand-testnet' || networkName === 'sepolia') {
    return 'Test Network';
  }
  return 'Standard';
});

const complianceBadgeClass = computed(() => {
  const networkName = networkInfo.value?.name;
  if (networkName === 'voi-mainnet' || networkName === 'aramidmain' || networkName === 'algorand-mainnet') {
    return 'bg-green-500/20 text-green-400';
  } else if (networkName === 'dockernet' || networkName === 'algorand-testnet' || networkName === 'sepolia') {
    return 'bg-yellow-500/20 text-yellow-400';
  }
  return 'bg-gray-500/20 text-gray-400';
});

const handleNetworkSwitch = async (networkId: NetworkId) => {
  if (networkId === currentNetwork.value) return;

  try {
    await switchNetwork(networkId);
    showNetworkSwitcher.value = false;
    emit('network-switched', networkId);
  } catch (error) {
    console.error('Failed to switch network:', error);
  }
};

const copyAddress = async () => {
  if (activeAddress.value) {
    try {
      await navigator.clipboard.writeText(activeAddress.value);
      // Could emit event for toast notification
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }
};
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
