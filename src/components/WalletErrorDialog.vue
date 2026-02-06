<template>
  <Modal :show="show" size="md" @close="handleClose">
    <div class="p-6">
      <!-- Header with error icon -->
      <div class="flex items-start gap-4 mb-6">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <i class="pi pi-exclamation-triangle text-2xl text-red-400"></i>
          </div>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-white mb-2">
            {{ error?.title || 'Connection Error' }}
          </h3>
          <p class="text-gray-300 text-sm">
            {{ error?.message || 'Failed to connect to wallet' }}
          </p>
        </div>
        <button
          @click="handleClose"
          class="flex-shrink-0 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Diagnostic Code (if available) -->
      <div v-if="diagnosticCode" class="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">Error Code:</span>
          <code class="text-xs text-gray-300 font-mono">{{ diagnosticCode }}</code>
        </div>
      </div>

      <!-- Quick Actions -->
      <div v-if="error?.actions && error.actions.length > 0" class="mb-6">
        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <i class="pi pi-lightbulb text-yellow-400"></i>
          Quick Actions
        </h4>
        <div class="space-y-2">
          <button
            v-for="(action, index) in error.actions"
            :key="index"
            @click="handleAction(action)"
            class="w-full p-3 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-gray-300 hover:text-white text-sm"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-angle-right text-biatec-accent"></i>
              {{ action }}
            </div>
          </button>
        </div>
      </div>

      <!-- Troubleshooting Steps -->
      <div v-if="error?.troubleshooting && error.troubleshooting.length > 0" class="mb-6">
        <button
          @click="showTroubleshooting = !showTroubleshooting"
          class="w-full flex items-center justify-between p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition-colors text-left"
        >
          <span class="text-sm font-semibold text-blue-400 flex items-center gap-2">
            <i class="pi pi-question-circle"></i>
            Troubleshooting Steps
          </span>
          <i
            :class="[
              'pi transition-transform text-blue-400',
              showTroubleshooting ? 'pi-chevron-up' : 'pi-chevron-down',
            ]"
          ></i>
        </button>

        <Transition name="expand">
          <div v-if="showTroubleshooting" class="mt-3 space-y-2">
            <div
              v-for="(step, index) in error.troubleshooting"
              :key="index"
              class="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
            >
              <div
                class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400"
              >
                {{ index + 1 }}
              </div>
              <p class="text-sm text-gray-300 flex-1">{{ step }}</p>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Alternative Wallets -->
      <div
        v-if="error?.alternativeWallets && error.alternativeWallets.length > 0"
        class="mb-6"
        data-alternative-wallets
      >
        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <i class="pi pi-wallet text-purple-400"></i>
          Try Another Wallet
        </h4>
        <div class="space-y-2">
          <button
            v-for="wallet in error.alternativeWallets"
            :key="wallet.id"
            @click="handleSelectWallet(wallet.id)"
            class="w-full p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all text-left"
            :disabled="!wallet.available"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div v-if="wallet.logo" class="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
                  <img
                    :src="wallet.logo"
                    :alt="wallet.name"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div class="text-sm font-semibold text-white">{{ wallet.name }}</div>
                  <div class="text-xs text-gray-400">
                    {{ wallet.available ? 'Available' : 'Not installed' }}
                  </div>
                </div>
              </div>
              <div v-if="wallet.available" class="flex items-center gap-2">
                <span class="text-xs text-purple-400">Connect</span>
                <i class="pi pi-arrow-right text-purple-400"></i>
              </div>
              <a
                v-else
                :href="wallet.installUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                @click.stop
              >
                Install
                <i class="pi pi-external-link text-xs"></i>
              </a>
            </div>
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          v-if="error?.canRetry"
          @click="handleRetry"
          class="flex-1 px-4 py-3 bg-biatec-accent hover:bg-biatec-accent/80 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <i class="pi pi-refresh"></i>
          Retry Connection
        </button>
        <button
          @click="handleClose"
          class="px-4 py-3 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-semibold rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from './ui/Modal.vue';
import type { ConnectionError } from '../composables/useWalletConnectivity';

interface Props {
  show: boolean;
  error: ConnectionError | null;
  diagnosticCode?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'retry'): void;
  (e: 'select-wallet', walletId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showTroubleshooting = ref(false);

const handleClose = () => {
  emit('close');
};

const handleRetry = () => {
  emit('retry');
};

const handleSelectWallet = (walletId: string) => {
  emit('select-wallet', walletId);
};

const handleAction = (action: string) => {
  // Handle specific actions based on the action text
  if (action.toLowerCase().includes('retry') || action.toLowerCase().includes('try again')) {
    handleRetry();
  } else if (action.toLowerCase().includes('refresh')) {
    window.location.reload();
  } else if (action.toLowerCase().includes('another wallet')) {
    // Scroll to alternative wallets section
    const alternativeSection = document.querySelector('[data-alternative-wallets]');
    alternativeSection?.scrollIntoView({ behavior: 'smooth' });
  }
  // For other actions, just show the troubleshooting steps
  else if (!showTroubleshooting.value) {
    showTroubleshooting.value = true;
  }
};
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
