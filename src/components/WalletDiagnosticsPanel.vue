<template>
  <div class="wallet-diagnostics-panel">
    <div class="panel-header">
      <div class="header-content">
        <i class="pi pi-info-circle text-2xl text-blue-400"></i>
        <div>
          <h3 class="text-lg font-semibold text-white">Diagnostic Information</h3>
          <p class="text-sm text-gray-400">Information for troubleshooting wallet connection issues</p>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="close-button"
        aria-label="Close diagnostics panel"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>

    <div class="panel-content">
      <!-- Current State -->
      <div class="diagnostic-section">
        <h4 class="section-title">
          <i class="pi pi-chart-line mr-2"></i>
          Current State
        </h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Connection State:</span>
            <span class="info-value">
              <span :class="getStateClass(diagnosticData.walletState)">
                {{ diagnosticData.walletState }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Network:</span>
            <span class="info-value">{{ diagnosticData.network }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Wallet:</span>
            <span class="info-value">{{ diagnosticData.walletId || 'ARC76 Auth' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Address:</span>
            <span class="info-value font-mono text-xs">{{ diagnosticData.address || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Last Error -->
      <div v-if="diagnosticData.lastError" class="diagnostic-section error-section">
        <h4 class="section-title">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          Last Error
        </h4>
        <div class="error-details">
          <div class="error-item">
            <span class="error-label">Type:</span>
            <span class="error-value">{{ diagnosticData.lastError.type }}</span>
          </div>
          <div class="error-item">
            <span class="error-label">Message:</span>
            <span class="error-value">{{ diagnosticData.lastError.message }}</span>
          </div>
          <div class="error-item">
            <span class="error-label">Code:</span>
            <span class="error-value font-mono">{{ diagnosticData.lastError.diagnosticCode || 'N/A' }}</span>
          </div>
          <div class="error-item">
            <span class="error-label">Timestamp:</span>
            <span class="error-value">{{ diagnosticData.lastError.timestamp }}</span>
          </div>
        </div>
      </div>

      <!-- Browser Information -->
      <div class="diagnostic-section">
        <h4 class="section-title">
          <i class="pi pi-globe mr-2"></i>
          Browser Environment
        </h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Online:</span>
            <span class="info-value">
              <span :class="diagnosticData.browserInfo.online ? 'text-green-400' : 'text-red-400'">
                {{ diagnosticData.browserInfo.online ? 'Yes' : 'No' }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Language:</span>
            <span class="info-value">{{ diagnosticData.browserInfo.language }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">User Agent:</span>
            <span class="info-value text-xs">{{ diagnosticData.browserInfo.userAgent }}</span>
          </div>
        </div>
      </div>

      <!-- Connection History -->
      <div class="diagnostic-section">
        <h4 class="section-title">
          <i class="pi pi-history mr-2"></i>
          Recent Connection History
        </h4>
        <div class="history-list">
          <div
            v-for="(item, index) in recentHistory"
            :key="index"
            class="history-item"
          >
            <span class="history-time">{{ formatTimestamp(item.timestamp) }}</span>
            <span class="history-event">{{ item.event }}</span>
            <span v-if="item.details" class="history-details">{{ item.details }}</span>
          </div>
          <div v-if="diagnosticData.connectionHistory.length === 0" class="empty-state">
            No connection history available
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="panel-actions">
        <button
          @click="handleCopy"
          :disabled="isCopying"
          class="action-button primary"
        >
          <i :class="isCopying ? 'pi pi-spin pi-spinner' : 'pi pi-copy'" class="mr-2"></i>
          {{ isCopying ? 'Copying...' : copySuccess ? 'Copied!' : 'Copy Diagnostic Data' }}
        </button>
        <button
          @click="$emit('refresh')"
          class="action-button secondary"
        >
          <i class="pi pi-refresh mr-2"></i>
          Refresh
        </button>
      </div>

      <!-- Help Text -->
      <div class="help-text">
        <i class="pi pi-info-circle mr-2"></i>
        <p>
          Copy this diagnostic information and include it when contacting support for faster resolution of wallet connection issues.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DiagnosticData } from '../services/WalletSessionService';
import { copyDiagnosticData } from '../services/WalletSessionService';

interface Props {
  diagnosticData: DiagnosticData;
}

interface Emits {
  (e: 'close'): void;
  (e: 'refresh'): void;
  (e: 'copied'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isCopying = ref(false);
const copySuccess = ref(false);

// Show recent history (last 10 items)
const recentHistory = computed(() => {
  return props.diagnosticData.connectionHistory.slice(0, 10);
});

// Get CSS class for state
const getStateClass = (state: string): string => {
  if (state.includes('connected')) return 'text-green-400 font-semibold';
  if (state.includes('connecting') || state.includes('switching')) return 'text-blue-400 font-semibold';
  if (state.includes('failed') || state.includes('error')) return 'text-red-400 font-semibold';
  return 'text-gray-400';
};

// Format timestamp to readable format
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  // If less than 1 minute ago
  if (diff < 60000) {
    return 'Just now';
  }

  // If less than 1 hour ago
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // If less than 24 hours ago
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Otherwise show date and time
  return date.toLocaleString();
};

// Handle copy to clipboard
const handleCopy = async () => {
  isCopying.value = true;
  copySuccess.value = false;

  try {
    const success = await copyDiagnosticData(props.diagnosticData);
    if (success) {
      copySuccess.value = true;
      emit('copied');
      setTimeout(() => {
        copySuccess.value = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to copy diagnostic data:', error);
  } finally {
    isCopying.value = false;
  }
};
</script>

<style scoped>
.wallet-diagnostics-panel {
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.close-button {
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.panel-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.diagnostic-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.diagnostic-section.error-section {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.2);
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #e5e7eb;
  word-break: break-all;
}

.error-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.error-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-label {
  font-size: 0.75rem;
  color: #fca5a5;
  font-weight: 500;
}

.error-value {
  font-size: 0.875rem;
  color: #fecaca;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  border-left: 3px solid rgba(59, 130, 246, 0.3);
}

.history-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.history-event {
  font-size: 0.875rem;
  color: #e5e7eb;
  font-weight: 500;
}

.history-details {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.panel-actions {
  display: flex;
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

.action-button.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.help-text {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 0.5rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.help-text p {
  font-size: 0.875rem;
  color: #93c5fd;
  margin: 0;
}

.help-text i {
  color: #60a5fa;
  margin-top: 0.125rem;
}

/* Scrollbar styling */
.history-list::-webkit-scrollbar,
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track,
.panel-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb,
.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover,
.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
