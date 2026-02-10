<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="close">
        <div class="glass-effect rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">{{ AUTH_UI_COPY.SIGN_IN_HEADER }}</h2>
            <button @click="close" class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>

          <!-- Network Selection removed for MVP wallet-free authentication per business requirements -->

          <!-- Wallet List -->
          <div class="space-y-3">
            <!-- Success State: Show derived account before closing -->
            <div v-if="authenticationSuccess && derivedAccount" class="text-center py-6">
              <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="pi pi-check-circle text-4xl text-green-400"></i>
              </div>
              <p class="text-white font-semibold text-lg mb-2">Successfully Authenticated!</p>
              <p class="text-sm text-gray-300 mb-4">Your ARC76 account has been derived from your credentials.</p>
              <div class="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4">
                <div class="text-xs text-gray-400 mb-1">{{ AUTH_UI_COPY.CONNECTED_ADDRESS }}</div>
                <div class="text-sm text-white font-mono break-all">{{ derivedAccount }}</div>
              </div>
              <p class="text-xs text-gray-400">Redirecting...</p>
            </div>

            <!-- Loading State -->
            <div v-else-if="isConnecting || isReconnecting || isSwitchingNetwork" class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-4xl text-biatec-accent mb-4"></i>
              <p class="text-gray-300 font-medium mb-2">{{ connectionStateMessage }}</p>
              <p class="text-sm text-gray-400">{{ AUTH_UI_COPY.SECURITY_NOTE }}</p>
            </div>

            <!-- Error State -->
            <div v-else-if="hasFailed && error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
              <div class="flex items-start gap-3">
                <i class="pi pi-exclamation-triangle text-red-400"></i>
                <div class="flex-1">
                  <p class="text-sm text-red-400 font-medium">{{ AUTH_UI_COPY.AUTH_FAILED }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ error }}</p>
                  <div v-if="lastError" class="mt-2 text-xs text-gray-500">Error Code: {{ lastError.diagnosticCode }}</div>
                  <div v-if="troubleshootingSteps.length > 0" class="mt-3 space-y-2">
                    <p class="text-xs text-gray-300 font-medium">Troubleshooting:</p>
                    <ul class="text-xs text-gray-400 space-y-1 ml-4 list-disc">
                      <li v-for="(step, index) in troubleshootingSteps" :key="index">{{ step }}</li>
                    </ul>
                  </div>
                  <div class="flex gap-2 mt-3">
                    <button @click="handleRetry" class="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors flex items-center gap-2">
                      <i class="pi pi-refresh"></i>
                      {{ AUTH_UI_COPY.AUTHENTICATE }}
                    </button>
                    <button @click="error = null" class="px-3 py-1.5 text-xs bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 rounded-lg transition-colors">Dismiss</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Primary Authentication Method: Email & Password (Arc76) -->
            <div v-else class="space-y-4">
              <!-- Email/Password Section -->
              <div class="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-xl">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <i class="pi pi-envelope text-2xl text-blue-400"></i>
                  </div>
                  <div class="flex-1">
                    <div class="text-white font-semibold text-lg">{{ AUTH_UI_COPY.EMAIL_PASSWORD_PRIMARY }}</div>
                    <div class="text-sm text-gray-300">{{ AUTH_UI_COPY.EMAIL_PASSWORD_DESCRIPTION }}</div>
                  </div>
                </div>
                
                <!-- Email/Password Form (AC #3) -->
                <form @submit.prevent="handleEmailPasswordSubmit" class="space-y-4">
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      id="email"
                      v-model="emailForm.email"
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <input
                      id="password"
                      v-model="emailForm.password"
                      type="password"
                      required
                      placeholder="••••••••"
                      class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    :disabled="isConnecting || isReconnecting || !emailForm.email || !emailForm.password"
                    class="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <i v-if="!isConnecting" class="pi pi-sign-in"></i>
                    <i v-else class="pi pi-spin pi-spinner"></i>
                    <span>{{ isConnecting ? 'Signing In...' : 'Sign In with Email' }}</span>
                  </button>
                </form>
              </div>

              <!-- Wallet providers removed for MVP wallet-free authentication per business requirements -->
            </div>
          </div>

          <!-- Info & Links -->
          <div class="mt-6 space-y-3">
            <div class="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div class="flex items-start gap-3">
                <i class="pi pi-info-circle text-blue-400 mt-0.5"></i>
                <div class="text-sm text-gray-300">
                  <p class="mb-2">{{ AUTH_UI_COPY.TERMS_AGREEMENT }}</p>
                  <p class="text-xs text-gray-400"><strong class="text-blue-400">Security:</strong> {{ AUTH_UI_COPY.SECURITY_NOTE }}</p>
                </div>
              </div>
            </div>

            <!-- Wallet guidance removed for MVP wallet-free authentication -->
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useWalletManager, NETWORKS, type NetworkId } from "../composables/useWalletManager";
import { WalletConnectionState } from "../composables/walletState";
import { AUTH_UI_COPY } from "../constants/uiCopy";
import { AUTH_STORAGE_KEYS } from "../constants/auth";
import { useAVMAuthentication } from "algorand-authentication-component-vue";
import { useAuthStore } from "../stores/auth";

interface Props {
  isOpen: boolean;
  showNetworkSelector?: boolean;
  defaultNetwork?: NetworkId;
}

interface Emits {
  (e: "close"): void;
  (e: "connected", data: { address: string; walletId: string; network: NetworkId }): void;
  (e: "error", error: string): void;
}

// Load persisted network from localStorage, fall back to prop default
const loadInitialNetwork = (propDefault: NetworkId): NetworkId => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_NETWORK)
    if (stored && NETWORKS[stored as NetworkId]) {
      return stored as NetworkId
    }
  } catch (error) {
    console.warn('Failed to load persisted network:', error)
  }
  return propDefault
}

const props = withDefaults(defineProps<Props>(), {
  showNetworkSelector: true,
  defaultNetwork: "algorand-testnet" as NetworkId, // Changed to testnet per AC #1
});

const emit = defineEmits<Emits>();

const walletManager = useWalletManager();
const { authStore: arc76AuthStore, authenticate: arc76Authenticate } = useAVMAuthentication();
const localAuthStore = useAuthStore(); // Our local auth store
const selectedNetwork = ref<NetworkId>(loadInitialNetwork(props.defaultNetwork));

// Email/Password form state (AC #3)
const emailForm = ref({
  email: '',
  password: ''
});

// Success state for showing derived account
const authenticationSuccess = ref(false);
const derivedAccount = ref<string | null>(null);

// Constants for UX timing
const SUCCESS_DISPLAY_DURATION_MS = 1500; // Time to show success message before redirect

// Computed state flags
const isConnecting = computed(
  () => walletManager.walletState.value.connectionState === WalletConnectionState.CONNECTING || walletManager.walletState.value.connectionState === WalletConnectionState.DETECTING,
);

const isReconnecting = computed(() => walletManager.walletState.value.connectionState === WalletConnectionState.RECONNECTING);

const isSwitchingNetwork = computed(() => walletManager.walletState.value.connectionState === WalletConnectionState.SWITCHING_NETWORK);

const hasFailed = computed(() => walletManager.walletState.value.connectionState === WalletConnectionState.FAILED);

const error = computed(() => walletManager.walletState.value.error);
const lastError = computed(() => walletManager.walletState.value.lastError);

// Connection state message
const connectionStateMessage = computed(() => {
  const state = walletManager.walletState.value.connectionState;
  switch (state) {
    case WalletConnectionState.DETECTING:
      return "Detecting authentication provider...";
    case WalletConnectionState.CONNECTING:
      return "Signing in...";
    case WalletConnectionState.RECONNECTING:
      return "Reconnecting...";
    case WalletConnectionState.SWITCHING_NETWORK:
      return "Switching network...";
    case WalletConnectionState.FETCHING_BALANCE:
      return "Loading account details...";
    default:
      return "Please approve the authentication request in your wallet app";
  }
});

// Get troubleshooting steps if there's an error
const troubleshootingSteps = computed(() => {
  if (!lastError.value) return [];
  return walletManager.getTroubleshootingSteps!(lastError.value.type);
});

/**
 * Handle email/password authentication with ARC76
 * This integrates with algorand-authentication-component-vue for deterministic account derivation
 */
const handleEmailPasswordSubmit = async () => {
  try {
    if (!emailForm.value.email || !emailForm.value.password) {
      emit("error", "Email and password are required");
      return;
    }

    // Reset states
    authenticationSuccess.value = false;
    derivedAccount.value = null;

    // Save selected network to localStorage before authenticating
    localStorage.setItem(AUTH_STORAGE_KEYS.SELECTED_NETWORK, selectedNetwork.value);

    // Set email and password in the ARC76 auth store
    arc76AuthStore.arc76email = emailForm.value.email;
    arc76AuthStore.password = emailForm.value.password;
    arc76AuthStore.m = emailForm.value.email; // mnemonic field used for email

    // Trigger ARC76 authentication
    // This will derive the account deterministically from email/password
    arc76Authenticate();

    // Wait for authentication to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if authentication was successful
    if (arc76AuthStore.isAuthenticated && arc76AuthStore.account) {
      // Save authentication state to our local auth store
      await localAuthStore.authenticateWithARC76(
        emailForm.value.email,
        arc76AuthStore.account
      );

      // Mark as connected in localStorage
      localStorage.setItem(AUTH_STORAGE_KEYS.WALLET_CONNECTED, 'true');
      localStorage.setItem(AUTH_STORAGE_KEYS.ACTIVE_WALLET_ID, 'arc76');

      // Show success state with derived account
      authenticationSuccess.value = true;
      derivedAccount.value = arc76AuthStore.account;

      // Wait a moment to show success message
      await new Promise(resolve => setTimeout(resolve, SUCCESS_DISPLAY_DURATION_MS));

      emit("connected", {
        address: arc76AuthStore.account,
        walletId: 'arc76',
        network: selectedNetwork.value,
      });

      // Clear form
      emailForm.value.email = '';
      emailForm.value.password = '';

      close();
    } else {
      throw new Error("Authentication failed - account not available. Please check your email and password.");
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to authenticate with email/password";
    emit("error", errorMessage);
    console.error("Email/password authentication error:", err);
    
    // Reset success state on error
    authenticationSuccess.value = false;
    derivedAccount.value = null;
  }
};

const handleRetry = async () => {
  if (walletManager.walletState.value.activeWallet) {
    await walletManager.retryConnection(walletManager.walletState.value.activeWallet);
  }
};

const close = () => {
  if (!isConnecting.value) {
    emit("close");
  }
};

// Watch for network changes
watch(
  () => props.defaultNetwork,
  (newNetwork) => {
    if (newNetwork) {
      selectedNetwork.value = newNetwork;
    }
  },
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 1000px;
  transform: translateY(0);
}
</style>
