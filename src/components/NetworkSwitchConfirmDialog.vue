<template>
  <Modal :show="show" size="md" @close="handleCancel">
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-start gap-4 mb-6">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <i class="pi pi-sync text-2xl text-blue-400"></i>
          </div>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-white mb-2">Switch Network</h3>
          <p class="text-gray-300 text-sm">
            {{ requiresReconnection
              ? 'This network switch requires disconnecting your wallet'
              : 'Switch to a different blockchain network' }}
          </p>
        </div>
        <button
          @click="handleCancel"
          class="flex-shrink-0 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Network Comparison -->
      <div class="mb-6 grid grid-cols-2 gap-4">
        <!-- Current Network -->
        <div class="p-4 bg-white/5 rounded-lg border border-white/10">
          <div class="text-xs text-gray-400 mb-2">Current Network</div>
          <div class="font-semibold text-white mb-1">{{ currentNetwork.displayName }}</div>
          <div class="text-xs text-gray-400">{{ currentNetwork.chainType }} Chain</div>
          <div
            v-if="currentNetwork.chainType === 'AVM'"
            class="text-xs text-gray-500 mt-2"
          >
            {{ currentNetwork.genesisId }}
          </div>
          <div
            v-else-if="currentNetwork.chainType === 'EVM'"
            class="text-xs text-gray-500 mt-2"
          >
            Chain ID: {{ currentNetwork.chainId }}
          </div>
        </div>

        <!-- Target Network -->
        <div
          class="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border-2 border-blue-500/30"
        >
          <div class="text-xs text-blue-400 mb-2">Target Network</div>
          <div class="font-semibold text-white mb-1">{{ targetNetwork.displayName }}</div>
          <div class="text-xs text-gray-400">{{ targetNetwork.chainType }} Chain</div>
          <div
            v-if="targetNetwork.chainType === 'AVM'"
            class="text-xs text-gray-500 mt-2"
          >
            {{ targetNetwork.genesisId }}
          </div>
          <div
            v-else-if="targetNetwork.chainType === 'EVM'"
            class="text-xs text-gray-500 mt-2"
          >
            Chain ID: {{ targetNetwork.chainId }}
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="warnings.length > 0" class="mb-6 space-y-3">
        <div
          v-for="(warning, index) in warnings"
          :key="index"
          class="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-yellow-400 text-sm mt-0.5"></i>
            <p class="text-sm text-gray-300">{{ warning }}</p>
          </div>
        </div>
      </div>

      <!-- Cross-chain switch info -->
      <div
        v-if="crossChain"
        class="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <i class="pi pi-info-circle text-purple-400 text-lg"></i>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-purple-300 mb-2">
              Cross-Chain Switch Detected
            </h4>
            <p class="text-xs text-gray-300 mb-3">
              You're switching from a {{ currentNetwork.chainType }} chain to a
              {{ targetNetwork.chainType }} chain. This requires:
            </p>
            <ul class="text-xs text-gray-400 space-y-1 list-disc list-inside">
              <li>Disconnecting your current wallet</li>
              <li>Signing in again after the switch</li>
              <li>Using a {{ targetNetwork.chainType }}-compatible wallet</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Testnet warning -->
      <div
        v-if="targetNetwork.isTestnet"
        class="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <i class="pi pi-shield text-orange-400 text-lg"></i>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-orange-300 mb-2">
              Testnet Network
            </h4>
            <p class="text-xs text-gray-300">
              This is a test network. Assets and transactions on this network have no real
              value. Use this network for testing purposes only.
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          @click="handleConfirm"
          :disabled="isSwitching"
          class="flex-1 px-4 py-3 bg-biatec-accent hover:bg-biatec-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <i v-if="isSwitching" class="pi pi-spin pi-spinner"></i>
          <span>{{ isSwitching ? 'Switching...' : 'Confirm Switch' }}</span>
        </button>
        <button
          @click="handleCancel"
          :disabled="isSwitching"
          class="px-4 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-gray-300 hover:text-white font-semibold rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './ui/Modal.vue';
import type { NetworkInfo } from '../composables/useWalletManager';

interface Props {
  show: boolean;
  currentNetwork: NetworkInfo;
  targetNetwork: NetworkInfo;
  warnings: string[];
  requiresReconnection: boolean;
  crossChain: boolean;
  isSwitching?: boolean;
}

interface Emits {
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isSwitching: false,
});

const emit = defineEmits<Emits>();

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>
