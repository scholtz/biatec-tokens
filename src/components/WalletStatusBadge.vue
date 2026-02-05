<template>
  <div class="wallet-status-badge">
    <!-- Connection Status Indicator -->
    <div
      :class="[
        'status-indicator',
        `status-${connectionStateClass}`,
        isCompact ? 'compact' : 'full'
      ]"
      @click="$emit('click')"
      role="button"
      :aria-label="statusAriaLabel"
      tabindex="0"
      @keydown.enter="$emit('click')"
      @keydown.space.prevent="$emit('click')"
    >
      <!-- Status Icon -->
      <div class="status-icon">
        <i :class="statusIcon" aria-hidden="true"></i>
        <span v-if="showPulse" class="pulse-ring" aria-hidden="true"></span>
      </div>

      <!-- Status Details (non-compact) -->
      <div v-if="!isCompact" class="status-details">
        <div class="status-text">
          <span class="status-label">{{ statusLabel }}</span>
          <span v-if="networkInfo" class="network-label">{{ networkInfo.displayName }}</span>
        </div>
        <div v-if="formattedAddress" class="address-text">
          {{ formattedAddress }}
        </div>
      </div>

      <!-- Dropdown Arrow -->
      <i v-if="!isCompact && isInteractive" class="pi pi-chevron-down ml-2 text-xs" aria-hidden="true"></i>
    </div>

    <!-- Error Indicator -->
    <div
      v-if="hasError && showErrorIndicator"
      class="error-indicator"
      @click="$emit('error-click')"
      role="button"
      aria-label="View error details"
      tabindex="0"
      @keydown.enter="$emit('error-click')"
      @keydown.space.prevent="$emit('error-click')"
    >
      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <span class="sr-only">Connection error occurred</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { WalletConnectionState } from '../composables/walletState';
import type { NetworkInfo } from '../composables/useWalletManager';

interface Props {
  connectionState?: WalletConnectionState;
  networkInfo?: NetworkInfo | null;
  address?: string | null;
  formattedAddress?: string | null;
  hasError?: boolean;
  isCompact?: boolean;
  isInteractive?: boolean;
  showErrorIndicator?: boolean;
}

interface Emits {
  (e: 'click'): void;
  (e: 'error-click'): void;
}

const props = withDefaults(defineProps<Props>(), {
  connectionState: WalletConnectionState.DISCONNECTED,
  networkInfo: null,
  address: null,
  formattedAddress: null,
  hasError: false,
  isCompact: false,
  isInteractive: true,
  showErrorIndicator: true,
});

defineEmits<Emits>();

// Compute connection state CSS class
const connectionStateClass = computed(() => {
  switch (props.connectionState) {
    case WalletConnectionState.CONNECTED:
      return 'connected';
    case WalletConnectionState.CONNECTING:
    case WalletConnectionState.DETECTING:
    case WalletConnectionState.RECONNECTING:
      return 'connecting';
    case WalletConnectionState.SWITCHING_NETWORK:
      return 'switching';
    case WalletConnectionState.FAILED:
      return 'error';
    case WalletConnectionState.DISCONNECTED:
    default:
      return 'disconnected';
  }
});

// Status icon
const statusIcon = computed(() => {
  switch (props.connectionState) {
    case WalletConnectionState.CONNECTED:
      return 'pi pi-check-circle';
    case WalletConnectionState.CONNECTING:
    case WalletConnectionState.DETECTING:
    case WalletConnectionState.RECONNECTING:
      return 'pi pi-spin pi-spinner';
    case WalletConnectionState.SWITCHING_NETWORK:
      return 'pi pi-sync';
    case WalletConnectionState.FAILED:
      return 'pi pi-times-circle';
    case WalletConnectionState.DISCONNECTED:
    default:
      return 'pi pi-circle';
  }
});

// Status label
const statusLabel = computed(() => {
  switch (props.connectionState) {
    case WalletConnectionState.CONNECTED:
      return 'Connected';
    case WalletConnectionState.CONNECTING:
      return 'Connecting...';
    case WalletConnectionState.DETECTING:
      return 'Detecting...';
    case WalletConnectionState.RECONNECTING:
      return 'Reconnecting...';
    case WalletConnectionState.SWITCHING_NETWORK:
      return 'Switching Network...';
    case WalletConnectionState.FAILED:
      return 'Connection Failed';
    case WalletConnectionState.DISCONNECTED:
    default:
      return 'Not Connected';
  }
});

// Show pulse animation
const showPulse = computed(() => {
  return props.connectionState === WalletConnectionState.CONNECTING ||
    props.connectionState === WalletConnectionState.DETECTING ||
    props.connectionState === WalletConnectionState.RECONNECTING ||
    props.connectionState === WalletConnectionState.SWITCHING_NETWORK;
});

// Accessibility label
const statusAriaLabel = computed(() => {
  let label = statusLabel.value;
  if (props.networkInfo) {
    label += ` on ${props.networkInfo.displayName}`;
  }
  if (props.formattedAddress) {
    label += `, address ${props.formattedAddress}`;
  }
  if (props.hasError) {
    label += ', error occurred';
  }
  return label;
});
</script>

<style scoped>
.wallet-status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.status-indicator.compact {
  padding: 0.5rem;
  gap: 0;
}

.status-indicator:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-indicator:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Status variants */
.status-connected {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.status-connecting,
.status-switching {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.status-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.status-disconnected {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.1));
  border-color: rgba(107, 114, 128, 0.3);
  color: #6b7280;
}

/* Status icon */
.status-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  font-size: 1.25rem;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid currentColor;
  border-radius: 50%;
  opacity: 0.6;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Status details */
.status-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.status-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-label {
  white-space: nowrap;
}

.network-label {
  font-size: 0.75rem;
  opacity: 0.8;
  padding: 0.125rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  white-space: nowrap;
}

.address-text {
  font-size: 0.75rem;
  opacity: 0.7;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Error indicator */
.error-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid rgba(239, 68, 68, 0.3);
}

.error-indicator:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.05);
}

.error-indicator:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .status-indicator:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>
