<template>
  <div class="wallet-recovery-panel">
    <div class="panel-header">
      <div class="header-icon">
        <i class="pi pi-refresh text-3xl text-blue-400"></i>
      </div>
      <h2 class="panel-title">Recover Your Wallet Connection</h2>
      <p class="panel-subtitle">
        Let's restore your wallet session and get you back to managing tokens
      </p>
    </div>

    <div class="panel-content">
      <!-- Session Info (if available) -->
      <div v-if="sessionInfo" class="session-info">
        <div class="info-card">
          <i class="pi pi-info-circle text-blue-400 text-xl"></i>
          <div>
            <p class="info-title">Previous Session Found</p>
            <div class="info-details">
              <p><strong>Wallet:</strong> {{ getWalletName(sessionInfo.walletId) }}</p>
              <p><strong>Network:</strong> {{ getNetworkName(sessionInfo.networkId) }}</p>
              <p><strong>Last Active:</strong> {{ formatLastActive(sessionInfo.lastActivityAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recovery Steps -->
      <div class="recovery-steps">
        <h3 class="steps-title">Recovery Steps</h3>
        
        <div class="step-list">
          <!-- Step 1: Check Wallet -->
          <div :class="['recovery-step', { active: currentStep === 1, completed: currentStep > 1 }]">
            <div class="step-indicator">
              <i v-if="currentStep > 1" class="pi pi-check"></i>
              <span v-else>1</span>
            </div>
            <div class="step-content">
              <h4 class="step-title">Ensure Wallet is Accessible</h4>
              <p class="step-description">
                Make sure your wallet app or browser extension is installed, unlocked, and ready to connect.
              </p>
              <ul class="step-checklist" v-if="currentStep === 1">
                <li>✓ Wallet extension is installed in your browser</li>
                <li>✓ Wallet app is unlocked (enter your password if needed)</li>
                <li>✓ You're using the same wallet as before</li>
              </ul>
            </div>
          </div>

          <!-- Step 2: Select Network -->
          <div :class="['recovery-step', { active: currentStep === 2, completed: currentStep > 2 }]">
            <div class="step-indicator">
              <i v-if="currentStep > 2" class="pi pi-check"></i>
              <span v-else>2</span>
            </div>
            <div class="step-content">
              <h4 class="step-title">Verify Network</h4>
              <p class="step-description">
                Confirm you're connecting to the correct network.
              </p>
              <div v-if="currentStep === 2" class="network-selector">
                <label class="input-label">Select Network:</label>
                <select v-model="selectedNetwork" class="network-select">
                  <option v-for="network in availableNetworks" :key="network.id" :value="network.id">
                    {{ network.displayName }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Step 3: Reconnect -->
          <div :class="['recovery-step', { active: currentStep === 3, completed: currentStep > 3 }]">
            <div class="step-indicator">
              <i v-if="currentStep > 3" class="pi pi-check"></i>
              <span v-else>3</span>
            </div>
            <div class="step-content">
              <h4 class="step-title">Reconnect Wallet</h4>
              <p class="step-description">
                Click the button below to reconnect your wallet. You may need to approve the connection in your wallet app.
              </p>
              <div v-if="currentStep === 3 && recoveryError" class="error-message">
                <i class="pi pi-exclamation-triangle"></i>
                <div>
                  <p class="error-title">Connection Failed</p>
                  <p class="error-details">{{ recoveryError }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="panel-actions">
        <button
          v-if="currentStep < 3"
          @click="nextStep"
          class="action-button primary"
        >
          <span>Continue</span>
          <i class="pi pi-arrow-right ml-2"></i>
        </button>

        <button
          v-if="currentStep === 3"
          @click="handleReconnect"
          :disabled="isReconnecting"
          class="action-button primary"
        >
          <i :class="isReconnecting ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" class="mr-2"></i>
          {{ isReconnecting ? 'Reconnecting...' : 'Reconnect Wallet' }}
        </button>

        <button
          v-if="currentStep > 1"
          @click="previousStep"
          class="action-button secondary"
          :disabled="isReconnecting"
        >
          <i class="pi pi-arrow-left mr-2"></i>
          <span>Back</span>
        </button>

        <button
          @click="handleStartFresh"
          class="action-button tertiary"
          :disabled="isReconnecting"
        >
          <i class="pi pi-plus mr-2"></i>
          <span>Start Fresh Connection</span>
        </button>
      </div>

      <!-- Help Links -->
      <div class="help-section">
        <p class="help-text">
          <i class="pi pi-question-circle mr-2"></i>
          Need help? Check our <a href="#" @click.prevent="$emit('show-guide')" class="help-link">wallet connection guide</a> or 
          <a href="#" @click.prevent="$emit('show-diagnostics')" class="help-link">view diagnostics</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WalletSession } from '../services/WalletSessionService';
import type { NetworkId } from '../composables/useWalletManager';
import { NETWORKS } from '../composables/useWalletManager';

interface Props {
  sessionInfo: WalletSession | null;
  isReconnecting?: boolean;
  recoveryError?: string | null;
}

interface Emits {
  (e: 'reconnect', data: { walletId: string; networkId: NetworkId }): void;
  (e: 'start-fresh'): void;
  (e: 'show-guide'): void;
  (e: 'show-diagnostics'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isReconnecting: false,
  recoveryError: null,
});

const emit = defineEmits<Emits>();

const currentStep = ref(1);
const selectedNetwork = ref<NetworkId>(props.sessionInfo?.networkId || 'algorand-mainnet');

const availableNetworks = computed(() => {
  return Object.values(NETWORKS);
});

// Get wallet display name
const getWalletName = (walletId: string): string => {
  const names: Record<string, string> = {
    pera: 'Pera Wallet',
    defly: 'Defly Wallet',
    exodus: 'Exodus Wallet',
    biatec: 'Biatec Wallet',
    kibisis: 'Kibisis',
    lute: 'Lute Wallet',
    walletconnect: 'WalletConnect',
  };
  return names[walletId] || walletId;
};

// Get network display name
const getNetworkName = (networkId: NetworkId): string => {
  const network = NETWORKS[networkId];
  return network ? network.displayName : networkId;
};

// Format last active timestamp
const formatLastActive = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

// Navigate to next step
const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++;
  }
};

// Navigate to previous step
const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Handle reconnect
const handleReconnect = () => {
  const walletId = props.sessionInfo?.walletId;
  if (!walletId) {
    emit('start-fresh');
    return;
  }

  emit('reconnect', {
    walletId,
    networkId: selectedNetwork.value,
  });
};

// Handle start fresh
const handleStartFresh = () => {
  emit('start-fresh');
};
</script>

<style scoped>
.wallet-recovery-panel {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  max-width: 48rem;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  text-align: center;
  padding: 2rem 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon {
  margin-bottom: 1rem;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.panel-subtitle {
  color: #9ca3af;
  font-size: 0.875rem;
}

.panel-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.session-info {
  margin-bottom: 1.5rem;
}

.info-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.75rem;
}

.info-title {
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 0.5rem;
}

.info-details {
  font-size: 0.875rem;
  color: #93c5fd;
}

.info-details p {
  margin: 0.25rem 0;
}

.recovery-steps {
  margin-bottom: 1.5rem;
}

.steps-title {
  font-size: 1rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 1rem;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recovery-step {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.recovery-step.active {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.3);
}

.recovery-step.completed {
  opacity: 0.7;
}

.step-indicator {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  font-weight: 700;
  transition: all 0.3s ease;
}

.recovery-step.active .step-indicator {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.recovery-step.completed .step-indicator {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.step-description {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.step-checklist {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0 0;
}

.step-checklist li {
  padding: 0.5rem 0;
  color: #d1d5db;
  font-size: 0.875rem;
}

.network-selector {
  margin-top: 0.75rem;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}

.network-select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.network-select:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(59, 130, 246, 0.3);
}

.network-select:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.error-message {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  margin-top: 0.75rem;
}

.error-message i {
  color: #f87171;
  font-size: 1.25rem;
}

.error-title {
  font-weight: 600;
  color: #fca5a5;
  margin-bottom: 0.25rem;
}

.error-details {
  font-size: 0.875rem;
  color: #fecaca;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: fit-content;
}

.action-button.primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.action-button.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #e5e7eb;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-button.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.action-button.tertiary {
  background: transparent;
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex: 1 1 100%;
}

.action-button.tertiary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: #d1d5db;
}

.help-section {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.help-text {
  display: flex;
  align-items: flex-start;
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}

.help-link {
  color: #60a5fa;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.help-link:hover {
  color: #93c5fd;
}

/* Scrollbar styling */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
